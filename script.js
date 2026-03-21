const firebaseConfig = { 
    apiKey: "AIzaSyDMJHzj0g_sRYW2exwyVLZZs4Y_hnnrDNM", 
    authDomain: "p2kc-b0553.firebaseapp.com", 
    databaseURL: "https://p2kc-b0553-default-rtdb.firebaseio.com", 
    projectId: "p2kc-b0553" 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName, myRoom, localStream, peerConnection, currentFacingMode="user", isFlash=false;

// --- INITIALIZATION ---
function enter(){
    myName = user.value.trim(); myRoom = pass.value.trim();
    if(!myName || !myRoom) return;
    loginDiv.style.display="none"; chatDiv.classList.remove('hidden');
    roomTitle.innerText = "ID: " + myRoom;
    db.ref(`rooms/${myRoom}/users/${myName}`).set(true);
    db.ref(`rooms/${myRoom}/users/${myName}`).onDisconnect().remove();
    db.ref(`rooms/${myRoom}/users`).on('value', s => document.getElementById('userCounter').innerText = "Online: " + s.numChildren());
    listenMsgs(); listenCall();
}

// --- PEER CONNECTION ENGINE (FIXED) ---
async function setupPeer(){
    peerConnection = new RTCPeerConnection({ 
        iceServers:[{urls:["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}] 
    });

    // Send local tracks
    localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));

    // Receive remote tracks (Aawaz aur Video yahan se aati hai)
    peerConnection.ontrack = e => { 
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo.srcObject !== e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
            remoteVideo.play().catch(err => console.log("Auto-play blocked"));
        }
    };

    // ICE Candidates synchronization
    peerConnection.onicecandidate = e => { 
        if(e.candidate) db.ref(`calls/${myRoom}/candidates/${myName}`).push(e.candidate.toJSON()); 
    };
}

// --- CALL ACTIONS ---
async function startCall(){
    callUI.style.display = "block";
    localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video: { facingMode: "user" } });
    document.getElementById('localVideo').srcObject = localStream;
    
    await setupPeer();
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Clear old call data before starting new
    await db.ref(`calls/${myRoom}`).remove();
    db.ref(`calls/${myRoom}`).set({ offer: offer, caller: myName, status: 'ringing' });
}

function listenCall(){
    db.ref(`calls/${myRoom}`).on("value", async snap => {
        let d = snap.val();
        if(!d) { if(peerConnection) endCall(); return; }

        // Receiver Side
        if(d.offer && d.caller !== myName && !peerConnection) {
            if(confirm(d.caller + " is calling...")) {
                callUI.style.display="block";
                localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true });
                document.getElementById('localVideo').srcObject = localStream;
                
                await setupPeer();
                await peerConnection.setRemoteDescription(new RTCSessionDescription(d.offer));
                
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                db.ref(`calls/${myRoom}`).update({ answer: answer, status: 'connected' });
                
                // Process pending candidates
                processCandidates();
            }
        }

        // Caller Side (Receiving Answer)
        if(d.answer && d.caller === myName && peerConnection.signalingState !== "stable") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(d.answer));
        }
    });
}

function processCandidates() {
    db.ref(`calls/${myRoom}/candidates`).on("child_added", s => {
        if(s.key !== myName) {
            s.ref.on("child_added", c => {
                if(peerConnection && peerConnection.remoteDescription) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(c.val())).catch(e=>{});
                }
            });
        }
    });
}

// --- END & UI HELPERS ---
function endCall(){ 
    db.ref(`calls/${myRoom}`).remove(); 
    if(localStream) localStream.getTracks().forEach(t => t.stop()); 
    if(peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.close();
    }
    peerConnection = null; 
    callUI.style.display = "none";
    document.getElementById('remoteVideo').srcObject = null;
}

// Flash & Switch Camera remain same but with better error handling
async function toggleFlash() {
    const track = localStream.getVideoTracks()[0];
    isFlash = !isFlash;
    try { await track.applyConstraints({ advanced: [{ torch: isFlash }] }); } catch(e) { console.log("Torch not supported"); }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    const track = localStream.getVideoTracks()[0]; track.stop();
    const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
    const newTrack = newStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
    if(sender) sender.replaceTrack(newTrack);
    localStream.removeTrack(track); localStream.addTrack(newTrack);
    document.getElementById('localVideo').srcObject = localStream;
}

// Rest of your messaging functions (sendMsg, sendPhoto, deleteMsg, listenMsgs) are fine.

const firebaseConfig = { 
    apiKey: "AIzaSyDMJHzj0g_sRYW2exwyVLZZs4Y_hnnrDNM", 
    authDomain: "p2kc-b0553.firebaseapp.com", 
    databaseURL: "https://p2kc-b0553-default-rtdb.firebaseio.com", 
    projectId: "p2kc-b0553" 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName, myRoom, localStream, pc, currentFacingMode="user", isFlash=false;

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

// --- CALLING LOGIC ---
async function startCall(){
    callUI.style.display = "block";
    localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video: { facingMode: "user" } });
    document.getElementById('localVideo').srcObject = localStream;
    await setupPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    db.ref(`calls/${myRoom}`).set({ offer, caller: myName });
}

async function setupPeer(){
    pc = new RTCPeerConnection({ iceServers:[{urls:["stun:stun.l.google.com:19302"]}] });
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    pc.ontrack = e => { document.getElementById('remoteVideo').srcObject = e.streams[0]; };
    pc.onicecandidate = e => { if(e.candidate) db.ref(`calls/${myRoom}/ice/${myName}`).push(e.candidate.toJSON()); };
}

function listenCall(){
    db.ref(`calls/${myRoom}`).on("value", async snap => {
        const d = snap.val();
        if(!d) { if(pc) endCall(); return; }
        if(d.offer && d.caller !== myName && !pc) {
            if(confirm("Incoming Call from " + d.caller)) {
                callUI.style.display="block";
                localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true });
                document.getElementById('localVideo').srcObject = localStream;
                await setupPeer();
                await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                db.ref(`calls/${myRoom}`).update({ answer });
            }
        }
        if(d.answer && d.caller === myName) await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
    });
    db.ref(`calls/${myRoom}/ice`).on("child_added", s => {
        if(s.key !== myName) s.ref.on("child_added", c => { if(pc) pc.addIceCandidate(new RTCIceCandidate(c.val())); });
    });
}

function endCall(){
    db.ref(`calls/${myRoom}`).remove();
    if(localStream) localStream.getTracks().forEach(t => t.stop());
    if(pc) pc.close(); pc = null;
    callUI.style.display = "none";
}

// --- CHAT LOGIC ---
function sendMsg(){
    const val = msgInput.value.trim(); if(!val) return;
    const ref = db.ref(`rooms/${myRoom}/msgs`).push({ u: myName, val, type: 'text', time: new Date().toLocaleTimeString() });
    if(ghostMode.checked) setTimeout(() => ref.remove(), 30000);
    msgInput.value="";
}

function listenMsgs(){
    db.ref(`rooms/${myRoom}/msgs`).on("child_added", s => {
        const d = s.val(), id = s.key;
        const div = document.createElement("div");
        div.className = "msg" + (d.u === myName ? " my-msg" : "");
        div.id = "m-"+id;
        div.innerHTML = `<div class='text-[10px] font-bold opacity-50 uppercase'>${d.u}</div>${d.val}`;
        chatBox.appendChild(div); chatBox.scrollTop = chatBox.scrollHeight;
    });
    db.ref(`rooms/${myRoom}/msgs`).on("child_removed", s => document.getElementById("m-"+s.key)?.remove());
}

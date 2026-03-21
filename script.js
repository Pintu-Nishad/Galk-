const firebaseConfig = { apiKey: "AIzaSyDMJHzj0g_sRYW2exwyVLZZs4Y_hnnrDNM", authDomain: "p2kc-b0553.firebaseapp.com", databaseURL: "https://p2kc-b0553-default-rtdb.firebaseio.com", projectId: "p2kc-b0553" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName, myRoom, localStream, peerConnection, currentFacingMode="user", isFlash=false;

function enter(){
    myName = user.value.trim(); myRoom = pass.value.trim();
    if(!myName || !myRoom) return;
    loginDiv.style.display="none"; chatDiv.classList.remove('hidden');
    roomTitle.innerText = "ID: " + myRoom;
    db.ref(`rooms/${myRoom}/users/${myName}`).set(true);
    db.ref(`rooms/${myRoom}/users`).on('value', s => document.getElementById('userCounter').innerText = "Online: " + s.numChildren());
    listenMsgs(); listenCall();
}

function sendMsg(){
    if(!msgInput.value.trim()) return;
    const ref = db.ref(`rooms/${myRoom}/msgs`).push({ u: myName, val: msgInput.value, type: 'text', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    if(ghostMode.checked) setTimeout(() => ref.remove(), 30000);
    msgInput.value="";
}

function sendPhoto(input) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
        const ref = db.ref(`rooms/${myRoom}/msgs`).push({ u: myName, val: e.target.result, type: 'image', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        if(ghostMode.checked) setTimeout(() => ref.remove(), 30000);
    };
    reader.readAsDataURL(input.files[0]);
}

function listenMsgs(){
    db.ref(`rooms/${myRoom}/msgs`).on("child_added", s=>{
        let d = s.val(), id = s.key;
        let div = document.createElement("div");
        div.className = "msg" + (d.u == myName ? " my-msg" : "");
        div.id = "msg-"+id;
        let actions = `<div class="msg-actions"><div class="icon-btn" onclick="deleteMsg('${id}')">🗑️</div>${d.type === 'image' ? `<div class="icon-btn" onclick="downloadImg('${d.val}')">⬇️</div>` : ''}</div>`;
        let content = d.type === 'image' ? `<div class="img-wrap"><img src="${d.val}" onclick="openZoom('${d.val}')"></div>` : `<div class="text-sm">${d.val}</div>`;
        div.innerHTML = `${actions}<div class="text-[8px] opacity-40 font-bold uppercase">${d.u}</div>${content}<div class="text-[7px] opacity-40 mt-1 text-right">${d.time}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
    db.ref(`rooms/${myRoom}/msgs`).on("child_removed", s => { const el = document.getElementById("msg-"+s.key); if(el) el.remove(); });
}

function deleteMsg(id) { if(confirm("Delete?")) db.ref(`rooms/${myRoom}/msgs/${id}`).remove(); }
function openZoom(src) { zoomImg.src = src; zoomOverlay.style.display = 'flex'; }
function downloadImg(b64) { const a = document.createElement('a'); a.href = b64; a.download = `P2K_${Date.now()}.png`; a.click(); }

async function startCall(){
    callUI.style.display = "block";
    localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video: { facingMode: "user" } });
    document.getElementById('localVideo').srcObject = localStream;
    setupPeer();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    db.ref(`calls/${myRoom}`).set({ offer:offer, caller:myName });
}

function setupPeer(){
    peerConnection = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
    localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
    peerConnection.ontrack = e => { document.getElementById('remoteVideo').srcObject = e.streams[0]; };
    peerConnection.onicecandidate = e => { if(e.candidate) db.ref(`calls/${myRoom}/candidates/${myName}`).push(e.candidate.toJSON()); };
}

function listenCall(){
    db.ref(`calls/${myRoom}`).on("value", async snap=>{
        let d = snap.val();
        if(!d) { if(peerConnection) endCall(); return; }
        if(d.offer && d.caller !== myName && !peerConnection) {
            if(confirm(d.caller + " is calling...")) {
                callUI.style.display="block";
                localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true });
                document.getElementById('localVideo').srcObject = localStream;
                setupPeer();
                await peerConnection.setRemoteDescription(new RTCSessionDescription(d.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                db.ref(`calls/${myRoom}`).update({answer:answer});
            }
        }
        if(d.answer && d.caller === myName) await peerConnection.setRemoteDescription(new RTCSessionDescription(d.answer));
    });
    db.ref(`calls/${myRoom}/candidates`).on("child_added", s => {
        if(s.key !== myName) s.ref.on("child_added", c => { if(peerConnection) peerConnection.addIceCandidate(new RTCIceCandidate(c.val())).catch(e=>{}); });
    });
}

function endCall(){ db.ref(`calls/${myRoom}`).remove(); if(localStream) localStream.getTracks().forEach(t => t.stop()); if(peerConnection) peerConnection.close(); peerConnection = null; callUI.style.display = "none"; }

async function toggleFlash() {
    const track = localStream.getVideoTracks()[0];
    isFlash = !isFlash;
    try { await track.applyConstraints({ advanced: [{ torch: isFlash }] }); } catch(e) { alert("Use Back Camera!"); }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    const track = localStream.getVideoTracks()[0]; track.stop();
    const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
    const newTrack = newStream.getVideoTracks()[0];
    peerConnection.getSenders().find(s => s.track.kind === 'video').replaceTrack(newTrack);
    localStream.removeTrack(track); localStream.addTrack(newTrack);
    document.getElementById('localVideo').srcObject = localStream;
}

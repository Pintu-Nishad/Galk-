const firebaseConfig = { 
    apiKey: "AIzaSyDMJHzj0g_sRYW2exwyVLZZs4Y_hnnrDNM", 
    authDomain: "p2kc-b0553.firebaseapp.com", 
    databaseURL: "https://p2kc-b0553-default-rtdb.firebaseio.com", 
    projectId: "p2kc-b0553" 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myName, myRoom, localStream, pc, ringtone = new Audio('ring.mp3');
ringtone.loop = true;

function enter() {
    myName = user.value.trim(); myRoom = pass.value.trim();
    if(!myName || !myRoom) return;
    loginDiv.classList.add('hidden'); appUI.classList.remove('hidden');
    db.ref(`rooms/${myRoom}/users/${myName}`).set(true);
    db.ref(`rooms/${myRoom}/users/${myName}`).onDisconnect().remove();
    db.ref(`rooms/${myRoom}/users`).on('value', s => userCounter.innerText = "ONLINE: " + s.numChildren());
    listenMsgs(); listenForCalls(); setupTyping();
}

// --- CALL LOGIC ---
async function initiateCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    pc.onicecandidate = e => { if(e.candidate) db.ref(`rooms/${myRoom}/rtc/ice/${myName}`).push(e.candidate.toJSON()); };
    pc.ontrack = e => { let a = new Audio(); a.srcObject = e.streams[0]; a.autoplay = true; document.body.appendChild(a); };
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    db.ref(`rooms/${myRoom}/rtc/call`).set({ offer, from: myName, status: 'ringing' });
    hangupBtn.classList.remove('hidden');
    callerLabel.innerText = "Calling...";
}

function listenForCalls() {
    db.ref(`rooms/${myRoom}/rtc/call`).on('value', async s => {
        const d = s.val();
        if(d && d.from !== myName) {
            if(d.status === 'ringing') { 
                callBar.style.display = "flex"; callerLabel.innerText = d.from;
                ringtone.play().catch(()=>{});
            }
            if(d.status === 'connected') stopRinging();
            if(d.status === 'ignored') leaveCall();
        }
        if(d && d.to === myName && d.answer && pc) await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
    });
    db.ref(`rooms/${myRoom}/rtc/ice`).on('child_added', s => {
        if(s.key !== myName) s.ref.on('child_added', c => { if(pc) pc.addIceCandidate(new RTCIceCandidate(c.val())); });
    });
}

async function acceptCall() {
    stopRinging();
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    pc.onicecandidate = e => { if(e.candidate) db.ref(`rooms/${myRoom}/rtc/ice/${myName}`).push(e.candidate.toJSON()); };
    pc.ontrack = e => { let a = new Audio(); a.srcObject = e.streams[0]; a.autoplay = true; document.body.appendChild(a); };

    const snap = await db.ref(`rooms/${myRoom}/rtc/call`).once('value');
    await pc.setRemoteDescription(new RTCSessionDescription(snap.val().offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    db.ref(`rooms/${myRoom}/rtc/call`).update({ answer, to: snap.val().from, status: 'connected' });
    hangupBtn.classList.remove('hidden');
}

function stopRinging() { ringtone.pause(); ringtone.currentTime = 0; callBar.style.display = "flex"; }
function leaveCall() { 
    localStream?.getTracks().forEach(t => t.stop()); pc?.close(); pc = null;
    db.ref(`rooms/${myRoom}/rtc`).remove();
    callBar.style.display = "none"; hangupBtn.classList.add('hidden');
    stopRinging();
}
function ignoreCall() { db.ref(`rooms/${myRoom}/rtc/call`).update({ status: 'ignored' }); }

// --- CHAT LOGIC ---
function sendMsg() {
    const val = msgInput.value.trim(); if(!val) return;
    const ref = db.ref(`rooms/${myRoom}/msgs`).push({ u: myName, val, type: 'text', time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) });
    if(ghostMode.checked) setTimeout(() => ref.remove(), 60000);
    msgInput.value = "";
}

function listenMsgs() {
    db.ref(`rooms/${myRoom}/msgs`).on("child_added", s => {
        const d = s.val(), id = s.key;
        const wrap = document.createElement("div");
        wrap.className = `msg-wrap ${d.u === myName ? 'out-wrap' : 'in-wrap'}`;
        wrap.id = "m-"+id;
        wrap.innerHTML = `<div class="msg ${d.u===myName?'out':'in'}"><div class="text-[9px] font-bold opacity-40 mb-1">${d.u}</div>${d.val}</div>`;
        chatBox.appendChild(wrap); chatBox.scrollTop = chatBox.scrollHeight;
    });
    db.ref(`rooms/${myRoom}/msgs`).on("child_removed", s => document.getElementById("m-"+s.key)?.remove());
}

function setupTyping() {
    msgInput.oninput = () => { db.ref(`rooms/${myRoom}/tp/${myName}`).set(true); setTimeout(()=>db.ref(`rooms/${myRoom}/tp/${myName}`).remove(),2000); };
    db.ref(`rooms/${myRoom}/tp`).on('value', s => { 
        let t=[]; s.forEach(u=>{ if(u.key!==myName) t.push(u.key); }); 
        typingInfo.innerText = t.length>0 ? t.join(",")+" typing..." : ""; 
    });
}

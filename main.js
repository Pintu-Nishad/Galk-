import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// आपका Firebase कॉन्फ़िगरेशन
const firebaseConfig = {
    apiKey: "AIzaSyD3HUZgZ1G2hN4BXnIbRV8eD0nPlWUaByM",
    authDomain: "galk-55f49.firebaseapp.com",
    projectId: "galk-55f49",
    databaseURL: "https://galk-55f49-default-rtdb.firebaseio.com",
    storageBucket: "galk-55f49.firebasestorage.app",
    messagingSenderId: "1005825050326",
    appId: "1:1005825050326:web:fda4271183b4c4ff106b77"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const peer = new Peer();
let localStream;
let isVideoOn = true;
let isAudioOn = true;

// 1. 1080p HD कैमरा सेटअप
async function initCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1920, height: 1080, frameRate: 30 },
            audio: { echoCancellation: true, noiseSuppression: true }
        });
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('status').innerText = "HD कैमरा तैयार है। 'Next' दबाएं।";
    } catch (e) {
        console.error("1080p फेल, नॉर्मल कैमरा शुरू हो रहा है", e);
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
    }
}

initCamera();

// 2. रैंडम अजनबी से जुड़ना
peer.on('open', (myId) => {
    document.getElementById('startBtn').onclick = () => {
        const waitingRef = ref(db, 'waitingUsers');
        document.getElementById('status').innerText = "अजनबी की तलाश...";

        onValue(waitingRef, (snap) => {
            const data = snap.val();
            if (data) {
                const partnerId = Object.values(data)[0];
                if (partnerId !== myId) {
                    const call = peer.call(partnerId, localStream);
                    handleCall(call);
                    remove(ref(db, 'waitingUsers/' + Object.keys(data)[0]));
                }
            } else {
                set(ref(db, 'waitingUsers/' + myId), myId);
                onDisconnect(ref(db, 'waitingUsers/' + myId)).remove();
            }
        }, { onlyOnce: true });
    };
});

// 3. कॉल संभालना
peer.on('call', (call) => {
    call.answer(localStream);
    handleCall(call);
});

function handleCall(call) {
    call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
        document.getElementById('status').innerText = "कनेक्टेड! (1080p)";
    });
}

// 4. कैमरा और माइक कंट्रोल
document.getElementById('toggleVideo').onclick = () => {
    isVideoOn = !isVideoOn;
    localStream.getVideoTracks()[0].enabled = isVideoOn;
    document.getElementById('toggleVideo').innerText = isVideoOn ? "📷 Video ON" : "🚫 Video OFF";
    document.getElementById('toggleVideo').style.background = isVideoOn ? "#34495e" : "#e74c3c";
};

document.getElementById('toggleAudio').onclick = () => {
    isAudioOn = !isAudioOn;
    localStream.getAudioTracks()[0].enabled = isAudioOn;
    document.getElementById('toggleAudio').innerText = isAudioOn ? "🎤 Mic ON" : "🔇 Mic OFF";
    document.getElementById('toggleAudio').style.background = isAudioOn ? "#34495e" : "#e74c3c";
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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
let facingMode = "user";

async function startMedia(mode) {
    if(localStream) localStream.getTracks().forEach(track => track.stop());
    localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: mode },
        audio: true
    });
    document.getElementById('localVideo').srcObject = localStream;
}

startMedia(facingMode);

peer.on('open', (id) => {
    document.getElementById('startBtn').onclick = () => {
        document.getElementById('callStatus').innerText = "Khoj rahe hain...";
        onValue(ref(db, 'waitingUsers'), (snap) => {
            const data = snap.val();
            if (data) {
                const partnerId = Object.values(data)[0];
                if (partnerId !== id) {
                    const call = peer.call(partnerId, localStream);
                    call.on('stream', s => document.getElementById('remoteVideo').srcObject = s);
                    remove(ref(db, 'waitingUsers/' + Object.keys(data)[0]));
                    document.getElementById('callStatus').innerText = "Connected";
                }
            } else {
                set(ref(db, 'waitingUsers/' + id), id);
                onDisconnect(ref(db, 'waitingUsers/' + id)).remove();
            }
        }, { onlyOnce: true });
    };
});

peer.on('call', call => {
    call.answer(localStream);
    call.on('stream', s => {
        document.getElementById('remoteVideo').srcObject = s;
        document.getElementById('callStatus').innerText = "Connected";
    });
});

// Controls
document.getElementById('muteBtn').onclick = () => {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
};
document.getElementById('videoBtn').onclick = () => {
    localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
};
document.getElementById('switchBtn').onclick = () => {
    facingMode = (facingMode === "user") ? "environment" : "user";
    startMedia(facingMode);
};

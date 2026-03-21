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

async function initCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1920, height: 1080 },
            audio: true
        });
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('status').innerText = "HD कैमरा तैयार है";
    } catch (e) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
    }
}

initCamera();

peer.on('open', (myId) => {
    document.getElementById('startBtn').onclick = () => {
        const waitingRef = ref(db, 'waitingUsers');
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

peer.on('call', (call) => {
    call.answer(localStream);
    handleCall(call);
});

function handleCall(call) {
    call.on('stream', (remoteStream) => {
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = remoteStream;
        remoteVideo.play();
        document.getElementById('status').innerText = "कनेक्टेड (1080p)";
    });
}

// कैमरा/माइक बटन लॉजिक
document.getElementById('toggleVideo').onclick = () => {
    localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
};
document.getElementById('toggleAudio').onclick = () => {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
};

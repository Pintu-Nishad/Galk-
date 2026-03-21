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
let currentFacingMode = "user"; // 'user' मतलब फ्रंट, 'environment' मतलब बैक

// 1. कैमरा शुरू करें (1080p)
async function getMedia(mode) {
    if(localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1920, height: 1080, facingMode: mode },
            audio: true
        });
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('callStatus').innerText = "तैयार (Ready)";
    } catch (e) {
        console.error(e);
        document.getElementById('callStatus').innerText = "कैमरा एरर!";
    }
}

getMedia(currentFacingMode);

// 2. कैमरा स्विच करें
document.getElementById('switchBtn').onclick = () => {
    currentFacingMode = (currentFacingMode === "user") ? "environment" : "user";
    getMedia(currentFacingMode);
};

// 3. म्यूट और वीडियो ऑन/ऑफ
document.getElementById('muteBtn').onclick = function() {
    const enabled = localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = !enabled;
    this.classList.toggle('off');
    document.getElementById('micIcon').innerText = !enabled ? "🎤" : "🔇";
};

document.getElementById('videoBtn').onclick = function() {
    const enabled = localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = !enabled;
    this.classList.toggle('off');
    document.getElementById('camIcon').innerText = !enabled ? "📷" : "🚫";
};

// 4. अजनबी खोजें (Firebase Logic)
peer.on('open', (id) => {
    document.getElementById('startBtn').onclick = () => {
        document.getElementById('callStatus').innerText = "खोज रहे हैं...";
        const waitingRef = ref(db, 'waitingUsers');
        onValue(waitingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const partnerId = Object.values(data)[0];
                if (partnerId !== id) {
                    const call = peer.call(partnerId, localStream);
                    handleStream(call);
                    remove(ref(db, 'waitingUsers/' + Object.keys(data)[0]));
                }
            } else {
                set(ref(db, 'waitingUsers/' + id), id);
                onDisconnect(ref(db, 'waitingUsers/' + id)).remove();
            }
        }, { onlyOnce: true });
    };
});

peer.on('call', (call) => {
    call.answer(localStream);
    handleStream(call);
});

function handleStream(call) {
    call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
        document.getElementById('callStatus').innerText = "कनेक्टेड (Live)";
    });
}

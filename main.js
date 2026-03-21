import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// आपका Firebase Config (वही जो आपने पहले दिया था)
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

// PeerJS को High Quality सेटिंग्स के साथ कॉन्फ़िगर करना
const peer = new Peer(undefined, {
    debug: 2
});

let localStream;

// 1. कैमरा और ऑडियो को 1080p पर सेट करना
async function startCamera() {
    const constraints = {
        video: {
            width: { ideal: 1920 }, // 1080p चौड़ाई
            height: { ideal: 1080 }, // 1080p ऊँचाई
            frameRate: { ideal: 30, max: 60 } // स्मूथ वीडियो के लिए
        },
        audio: {
            echoCancellation: true, // गूँज कम करने के लिए
            noiseSuppression: true, // शोर कम करने के लिए
            autoGainControl: true   // आवाज़ बराबर रखने के लिए
        }
    };

    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('status').innerText = "HD कैमरा और ऑडियो तैयार है।";
    } catch (err) {
        console.error("HD एक्सेस में समस्या: ", err);
        document.getElementById('status').innerText = "Error: कैमरा 1080p सपोर्ट नहीं कर रहा या परमिशन नहीं मिली।";
        
        // अगर 1080p फेल हो तो नॉर्मल क्वालिटी पर वापस जाएँ
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
    }
}

startCamera();

// 2. अजनबी खोजने का लॉजिक (Firebase के साथ)
peer.on('open', (id) => {
    document.getElementById('startBtn').onclick = () => {
        findPartner(id);
    };
});

function findPartner(myId) {
    const waitingRef = ref(db, 'waitingUsers');
    document.getElementById('status').innerText = "किसी अजनबी से कनेक्ट हो रहे हैं...";

    onValue(waitingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const keys = Object.keys(data);
            const partnerId = data[keys[0]];

            if (partnerId !== myId) {
                const call = peer.call(partnerId, localStream);
                setupCall(call);
                remove(ref(db, 'waitingUsers/' + keys[0]));
            }
        } else {
            set(ref(db, 'waitingUsers/' + myId), myId);
            onDisconnect(ref(db, 'waitingUsers/' + myId)).remove();
        }
    }, { onlyOnce: true });
}

// 3. कॉल रिसीव करना और स्ट्रीम सेट करना
peer.on('call', (call) => {
    call.answer(localStream); // अपना HD स्ट्रीम भेजें
    setupCall(call);
});

function setupCall(call) {
    call.on('stream', (remoteStream) => {
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = remoteStream;
        document.getElementById('status').innerText = "कनेक्टेड: 1080p क्वालिटी एक्टिव है।";
        
        // सुनिश्चित करें कि वीडियो सही से चले
        remoteVideo.onloadedmetadata = () => remoteVideo.play();
    });
    
    // अगर कॉल कट जाए
    call.on('close', () => {
        document.getElementById('status').innerText = "अजनबी ने कॉल काट दी।";
    });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD3HUZgZ1G2hN4BXnIbRV8eD0nPlWUaByM",
    authDomain: "galk-55f49.firebaseapp.com",
    projectId: "galk-55f49",
    storageBucket: "galk-55f49.firebasestorage.app",
    messagingSenderId: "1005825050326",
    appId: "1:1005825050326:web:fda4271183b4c4ff106b77"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

// DOM Elements
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');

// मैसेज भेजें
sendBtn.onclick = () => {
    const text = msgInput.value;
    if (text.trim() !== "") {
        push(messagesRef, {
            text: text,
            timestamp: Date.now(),
            sender: "User_" + Math.floor(Math.random() * 1000) // टेंपरेरी नाम
        });
        msgInput.value = "";
    }
};

// रीयल-टाइम में मैसेज प्राप्त करें
onChildAdded(messagesRef, (data) => {
    const msg = data.val();
    const div = document.createElement('div');
    div.classList.add('msg', 'msg-received'); // आप इसे sender के हिसाब से बदल सकते हैं
    div.innerText = msg.text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
// Call Logic Elements
const groupCallBtn = document.getElementById('group-call-btn');
const callPopup = document.getElementById('call-notification');
const acceptBtn = document.getElementById('accept-call');
const rejectBtn = document.getElementById('reject-call');
const attachBtn = document.getElementById('attach-btn');
const mediaMenu = document.getElementById('media-menu');

const callRef = ref(db, 'calls/currentCall');

// जब कोई कॉल शुरू करे
groupCallBtn.onclick = () => {
    set(callRef, {
        status: "ringing",
        caller: "Admin",
        type: "group"
    });
    alert("कॉल शुरू हो रही है...");
};

// रीयल-टाइम कॉल नोटिफिकेशन सुनना
onChildAdded(ref(db, 'calls'), (data) => {
    const callData = data.val();
    if(callData.status === "ringing") {
        callPopup.classList.remove('hidden');
    }
});

// बटन क्लिक्स
acceptBtn.onclick = () => {
    callPopup.classList.add('hidden');
    console.log("कॉल से जुड़ रहे हैं...");
    // यहाँ WebRTC का कोड जोड़ सकते हैं
};

rejectBtn.onclick = () => {
    callPopup.classList.add('hidden');
};

// अटैचमेंट मेनू खोलना/बंद करना
attachBtn.onclick = () => {
    mediaMenu.classList.toggle('hidden');
};

// वॉइस मैसेज (टेंपरेरी)
document.getElementById('mic-btn').onclick = () => {
    alert("रिकॉर्डिंग शुरू...");
};

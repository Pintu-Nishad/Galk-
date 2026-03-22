// script.js - Full Firebase Logic for P2K
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// आपकी Firebase कॉन्फ़िगरेशन
const firebaseConfig = {
    apiKey: "AIzaSyD3HUZgZ1G2hN4BXnIbRV8eD0nPlWUaByM",
    authDomain: "galk-55f49.firebaseapp.com",
    projectId: "galk-55f49",
    storageBucket: "galk-55f49.firebasestorage.app",
    messagingSenderId: "1005825050326",
    appId: "1:1005825050326:web:fda4271183b4c4ff106b77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// References
const messagesRef = ref(db, 'messages');
const callRef = ref(db, 'calls/currentStatus');

// DOM Elements
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const chatWindow = document.getElementById('chat-window');
const callPopup = document.getElementById('call-notification');
const groupCallBtn = document.getElementById('group-call-btn');
const acceptBtn = document.getElementById('accept-call');
const rejectBtn = document.getElementById('reject-call');

// --- 1. चैटिंग लॉजिक ---

// मैसेज भेजने का फंक्शन
const sendMessage = () => {
    const text = msgInput.value.trim();
    if (text !== "") {
        push(messagesRef, {
            text: text,
            timestamp: Date.now(),
            sender: "User_" + Math.floor(Math.random() * 100) // टेंपरेरी आईडी
        });
        msgInput.value = "";
    }
};

sendBtn.addEventListener('click', sendMessage);

// 'Enter' की दबाने पर मैसेज भेजें
msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// नए मैसेज रीयल-टाइम में लोड करना
onChildAdded(messagesRef, (data) => {
    const msg = data.val();
    const div = document.createElement('div');
    
    // यहाँ 'msg-sent' या 'msg-received' क्लास सेट करें
    div.classList.add('msg', 'msg-sent'); 
    div.innerText = msg.text;
    
    chatWindow.appendChild(div);
    
    // ऑटो स्क्रॉल नीचे की तरफ
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

// --- 2. ग्रुप कॉल लॉजिक ---

// कॉल शुरू करना
groupCallBtn.addEventListener('click', () => {
    set(callRef, {
        status: 'ringing',
        caller: 'Admin',
        time: Date.now()
    });
    console.log("कॉल सिग्नल भेजा गया...");
});

// कॉल नोटिफिकेशन सुनना (सबके पास पॉपअप आएगा)
onValue(callRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.status === 'ringing') {
        callPopup.classList.remove('hidden');
    } else {
        callPopup.classList.add('hidden');
    }
});

// कॉल उठाना या काटना
acceptBtn.addEventListener('click', () => {
    alert("कॉल कनेक्ट हो रही है... (WebRTC की ज़रूरत होगी)");
    callPopup.classList.add('hidden');
});

rejectBtn.addEventListener('click', () => {
    set(callRef, null); // डेटाबेस से कॉल स्टेटस हटाना
    callPopup.classList.add('hidden');
});

// --- 3. यूटिलिटी ---
console.log("P2K System Ready!");

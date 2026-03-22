import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const callRef = ref(db, 'calls/currentCall');

const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const chatWindow = document.getElementById('chat-window');
const callPopup = document.getElementById('call-notification');

// संदेश भेजें
const sendMsg = () => {
    const val = msgInput.value.trim();
    if (val !== "") {
        push(messagesRef, { text: val, time: Date.now() });
        msgInput.value = "";
    }
};

sendBtn.onclick = sendMsg;
msgInput.onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

// संदेश दिखाएँ
onChildAdded(messagesRef, (snap) => {
    const data = snap.val();
    const div = document.createElement('div');
    div.className = 'msg msg-sent'; // आप बाद में रिसीव्ड लॉजिक जोड़ सकते हैं
    div.innerText = data.text;
    messagesContainer.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

// कॉल लॉजिक
document.getElementById('group-call-btn').onclick = () => {
    set(callRef, { status: 'ringing', caller: 'Pintu' });
};

onValue(callRef, (snap) => {
    if (snap.val()?.status === 'ringing') {
        callPopup.classList.remove('hidden');
    } else {
        callPopup.classList.add('hidden');
    }
});

document.getElementById('reject-call').onclick = () => {
    set(callRef, null);
};

document.getElementById('accept-call').onclick = () => {
    alert("Joining Call...");
    callPopup.classList.add('hidden');
};

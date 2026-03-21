let localStream;
let peer;
let currentCall;

async function initChat() {
    document.getElementById('status').innerText = "कैमरा एक्सेस किया जा रहा है...";
    
    try {
        // कैमरा और माइक एक्सेस करना
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        
        // PeerJS आईडी बनाना (यह आपकी यूनिक आईडी होगी)
        peer = new Peer();

        peer.on('open', (id) => {
            document.getElementById('status').innerText = "आपकी ID: " + id + "। किसी से जुड़ने का इंतज़ार...";
            console.log('My peer ID is: ' + id);
        });

        // जब कोई आपको कॉल करे
        peer.on('call', (call) => {
            call.answer(localStream); // अपनी वीडियो भेजें
            call.on('stream', (remoteStream) => {
                document.getElementById('remoteVideo').srcObject = remoteStream;
                document.getElementById('status').innerText = "कनेक्टेड! बातचीत शुरू करें।";
            });
            currentCall = call;
        });

        // अजनबी से जुड़ने के लिए (डेमो के लिए आपको आईडी डालनी होगी या रैंडम लॉजिक बनाना होगा)
        let connID = prompt("अजनबी की ID डालें (या दूसरे टैब में खोलकर अपनी ID यहाँ पेस्ट करें):");
        if (connID) {
            const call = peer.call(connID, localStream);
            call.on('stream', (remoteStream) => {
                document.getElementById('remoteVideo').srcObject = remoteStream;
                document.getElementById('status').innerText = "कनेक्टेड!";
            });
            currentCall = call;
        }

    } catch (err) {
        console.error("कैमरा नहीं मिला: ", err);
        document.getElementById('status').innerText = "Error: कैमरा परमिशन दें।";
    }
}

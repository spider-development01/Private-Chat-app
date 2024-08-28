const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;
let peerConnection;

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

startButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangupCall);

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);
    
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send the candidate to the remote peer
            // e.g., through a WebSocket server
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer to the remote peer
    // e.g., through a WebSocket server
}

async function receiveCall(offer) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send the candidate to the remote peer
            // e.g., through a WebSocket server
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer to the remote peer
    // e.g., through a WebSocket server
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleCandidate(candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function hangupCall() {
    peerConnection.close();
    peerConnection = null;
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

const signalingServer = new WebSocket('ws://localhost:8080');

signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'offer') {
        await receiveCall(data);
    } else if (data.type === 'answer') {
        await handleAnswer(data);
    } else if (data.type === 'candidate') {
        await handleCandidate(data.candidate);
    }
};

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);
    
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate
            }));
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    signalingServer.send(JSON.stringify({
        type: 'offer',
        offer: peerConnection.localDescription
    }));
}

async function receiveCall(offer) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate
            }));
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    signalingServer.send(JSON.stringify({
        type: 'answer',
        answer: peerConnection.localDescription
    }));
}

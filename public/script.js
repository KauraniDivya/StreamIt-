const userVideo = document.getElementById('user-video');
const startButton = document.getElementById('start-btn');
const stopButton = document.getElementById('stop-btn');
const downloadButton = document.getElementById('download-btn');
const downloadLink = document.getElementById('download-link');
const streamForm = document.getElementById('stream-form');
const streamUrlInput = document.getElementById('stream-url');
const streamPasskeyInput = document.getElementById('stream-passkey');
const videoSection = document.getElementById('video-section');
const resetIcon = document.getElementById('reset-icon');
const transcriptContainer = document.getElementById('transcript');
const socket = io();

const state = { media: null, mediaRecorder: null, recordedChunks: [] };

streamForm.addEventListener('submit', async event => {
    event.preventDefault();
    const streamUrl = streamUrlInput.value;
    const streamPasskey = streamPasskeyInput.value;

    // Construct the RTMP URL with the provided stream URL and passkey
    const rtmpUrl = `${streamUrl}/live2/${streamPasskey}`;

    // Update the youtubeStreamOptions in your Node.js server with the constructed RTMP URL
    socket.emit('updateYoutubeStreamOptions', rtmpUrl);

    // Clear the input fields
    streamUrlInput.value = '';
    streamPasskeyInput.value = '';

    // Show the video section and hide the form
    videoSection.classList.add('active');
    streamForm.style.display = 'none';

    // Start video
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    userVideo.srcObject = media;
    state.media = media;
});

resetIcon.addEventListener('click', function() {
    location.reload();
});

startButton.addEventListener('click', () => {
    const mediaRecorder = new MediaRecorder(state.media, {
        mimeType: 'video/webm; codecs=vp9',
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        framerate: 25
    });

    state.mediaRecorder = mediaRecorder;
    state.recordedChunks = [];

    mediaRecorder.ondataavailable = ev => {
        if (ev.data.size > 0) {
            state.recordedChunks.push(ev.data);
            socket.emit('binarystream', ev.data);
        }
    };

    mediaRecorder.start(25); // Start recording and send data every 25ms
    startButton.disabled = true;
    stopButton.disabled = false;
    downloadButton.disabled = true;
});

stopButton.addEventListener('click', () => {
    if (state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.mediaRecorder = null;
    }
    socket.emit('stopstream');
    startButton.disabled = false;
    stopButton.disabled = true;

    const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = 'recording.webm';
    downloadLink.style.display = 'inline';
    downloadButton.disabled = false;
});

downloadButton.addEventListener('click', () => {
    downloadLink.click();
});

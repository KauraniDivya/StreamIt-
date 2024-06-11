import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { Server as SocketIO } from 'socket.io';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

const port = process.env.PORT || 3000;

let youtubeStreamProcess = null;
let recordingProcess = null;

const getYoutubeStreamOptions = (rtmpUrl) => [
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', '25',
    '-g', '50',
    '-keyint_min', 25,
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv',
    rtmpUrl
];

const recordingOptions = [
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', '25',
    '-g', '50',
    '-keyint_min', 25,
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp4',
    'recording.mp4'
];

const startFFmpegProcesses = (rtmpUrl) => {
    const youtubeStreamOptions = getYoutubeStreamOptions(rtmpUrl);
    youtubeStreamProcess = spawn('ffmpeg', youtubeStreamOptions);
    recordingProcess = spawn('ffmpeg', recordingOptions);

    youtubeStreamProcess.stdout.on('data', data => {
        console.log(`youtubeStreamProcess stdout: ${data}`);
    });

    youtubeStreamProcess.stderr.on('data', data => {
        console.error(`youtubeStreamProcess stderr: ${data}`);
    });

    youtubeStreamProcess.on('close', code => {
        console.log(`youtubeStreamProcess exited with code ${code}`);
        youtubeStreamProcess = null;
    });

    youtubeStreamProcess.stdin.on('error', err => {
        if (err.code === 'EPIPE') {
            console.error('FFmpeg process has been terminated');
            youtubeStreamProcess = null;
        } else {
            console.error('Error writing to youtubeStreamProcess stdin:', err);
        }
    });

    recordingProcess.stdout.on('data', data => {
        console.log(`recordingProcess stdout: ${data}`);
    });

    recordingProcess.stderr.on('data', data => {
        console.error(`recordingProcess stderr: ${data}`);
    });

    recordingProcess.on('close', code => {
        console.log(`recordingProcess exited with code ${code}`);
        recordingProcess = null;
    });

    recordingProcess.stdin.on('error', err => {
        if (err.code === 'EPIPE') {
            console.error('recordingProcess process has been terminated');
            recordingProcess = null;
        } else {
            console.error('Error writing to recordingProcess stdin:', err);
        }
    });
};

const publicPath = path.resolve('./public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

io.on('connection', socket => {
    console.log(`Socket connected`, socket.id);

    socket.on('updateYoutubeStreamOptions', rtmpUrl => {
        console.log('YouTube stream options updated:', rtmpUrl);
        if (youtubeStreamProcess || recordingProcess) {
            if (youtubeStreamProcess) {
                youtubeStreamProcess.stdin.end();
            }
            if (recordingProcess) {
                recordingProcess.stdin.end();
            }
        }
        startFFmpegProcesses(rtmpUrl);
    });

    socket.on('binarystream', stream => {
        console.log(`Binary stream incoming...`);
        if (youtubeStreamProcess && recordingProcess) {
            youtubeStreamProcess.stdin.write(stream);
            recordingProcess.stdin.write(stream);
        }
    });

    socket.on('stopstream', () => {
        if (youtubeStreamProcess) {
            youtubeStreamProcess.stdin.end();
        }
        if (recordingProcess) {
            recordingProcess.stdin.end();
        }
    });
});

app.get('/download', (req, res) => {
    const file = path.resolve(__dirname, 'recording.mp4');
    res.download(file, err => {
        if (err) {
            console.error('Error downloading file:', err);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

server.listen(port, () => console.log(`Listening on port ${port}`));

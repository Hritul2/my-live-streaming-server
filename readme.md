# StreamYard Clone

This is a simple StreamYard clone that captures video from the user's camera and microphone, streams it over a TCP connection using Socket.io, and allows the user to record and playback the streamed video.

## Table of Contents

- [StreamYard Clone](#streamyard-clone)
  - [Table of Contents](#table-of-contents)
  - [Technologies Used](#technologies-used)
  - [How It Works](#how-it-works)
    - [Fetching Video Data](#fetching-video-data)
    - [Converting Video to Binary](#converting-video-to-binary)
    - [TCP Transfer Using Socket.io](#tcp-transfer-using-socketio)
    - [FFmpeg](#ffmpeg)

## Technologies Used

- HTML
- JavaScript
- Socket.io
- MediaRecorder API
- Tailwind CSS

## How It Works

### Fetching Video Data

The `navigator.mediaDevices.getUserMedia()` method is used to fetch video and audio streams from the user's camera and microphone. This method returns a Promise that resolves to a `MediaStream` object.

```javascript
const media = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
});
```

The `media` object contains the video and audio streams that are then assigned to the `srcObject` property of the `userVideo` element.

```javascript
userVideo.srcObject = media;
```

### Converting Video to Binary

The `MediaRecorder` API is used to record the media streams fetched from the user's camera and microphone. The recorded data is in the form of `Blob` objects.

```javascript
const mediaRecorder = new MediaRecorder(state.media, {
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 250000,
  framerate: 25,
});

mediaRecorder.ondataavailable = (ev) => {
  state.recordedChunks.push(ev.data);
  socket.emit("binarystream", ev.data);
};
```

In the above code:

- `mediaRecorder` is the instance of `MediaRecorder` used to record the media streams.
- `state.recordedChunks` is an array that stores the recorded data in `Blob` format.
- `socket.emit("binarystream", ev.data);` sends the binary data to the server using Socket.io.

### TCP Transfer Using Socket.io

Socket.io is used to establish a TCP connection between the client and server for real-time communication. When the binary data is available from the `MediaRecorder`, it is sent to the server using Socket.io.

```javascript
const socket = io();

socket.on("connection", (socket) => {
  socket.on("binarystream", (stream) => {
    ffmpegProcess.stdin.write(stream);
  });
});
```

In the above code:

- A Socket.io server is created and listens for incoming connections.
- When the `binarystream` event is emitted from the client, the server writes the binary data to the FFmpeg process through its `stdin`.

### FFmpeg

FFmpeg is a powerful multimedia framework that can encode, decode, transcode, mux, demux, stream, filter, and play both audio and video files.

In this project, FFmpeg is used to convert the received binary video data to a format suitable for streaming (FLV in this case) and stream it to a specified RTMP server (in this example, a YouTube Live stream).

```javascript
const options = [
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-r",
  `${25}`,
  "-g",
  `${25 * 2}`,
  "-keyint_min",
  "25",
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-sc_threshold",
  "0",
  "-profile:v",
  "main",
  "-level",
  "3.1",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-ar",
  128000 / 4,
  "-f",
  "flv",
  `rtmp://a.rtmp.youtube.com/live2/${process.env.RTMPC_KEY}`,
];

const ffmpegProcess = spawn("ffmpeg", options);
```

In the above code:

- `options` array contains the FFmpeg command-line options to specify the input (`-i -` for stdin), video and audio codecs, bitrate, format, and output URL.
- `spawn("ffmpeg", options)` spawns a new FFmpeg process with the specified options.

---

This `README.md` provides an overview of how the StreamYard clone works, explaining the process of fetching video data, converting it to binary, transferring it over TCP using Socket.io, and using FFmpeg for video encoding and streaming.

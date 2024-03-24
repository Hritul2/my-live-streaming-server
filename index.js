import http from "http";
import path from "path";
import express from "express";
import { Server } from "socket.io";
import { spawn } from "child_process";

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

let ffmpegProcess;

const startStreaming = () => {
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

  ffmpegProcess = spawn("ffmpeg", options);

  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`FFmpeg Error: ${data}`);
  });

  ffmpegProcess.on("exit", (code, signal) => {
    console.log(`FFmpeg process exited with code ${code} and signal ${signal}`);
  });
};

const stopStreaming = () => {
  if (ffmpegProcess) {
    ffmpegProcess.stdin.end();
    ffmpegProcess.kill();
    ffmpegProcess = null;
  }
};

app.use(express.static(path.resolve("./public")));

// Start streaming endpoint
app.post("/start-streaming", (req, res) => {
  startStreaming();
  res.status(200).send("Streaming started");
});

// Stop streaming endpoint
app.post("/stop-streaming", (req, res) => {
  stopStreaming();
  res.status(200).send("Streaming stopped");
});

server.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);

  socket.on("binarystream", (stream) => {
    console.log("Binary Stream incoming");

    if (ffmpegProcess && !ffmpegProcess.killed) {
      ffmpegProcess.stdin.write(stream, (err) => {
        if (err) {
          console.error("Error writing to FFmpeg stdin: ", err);
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected", socket.id);
    stopStreaming();
  });
});

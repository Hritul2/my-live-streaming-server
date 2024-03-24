import http from "http";
import path from "path";
import express from "express";
import { Server } from "socket.io";
import { spawn } from "child_process";

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
  25,
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

app.use(express.static(path.resolve("./public")));

server.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);
  socket.on("binarystream", (stream) => {
    console.log("Binary Stream inomming");
    ffmpegProcess.stdin.write(stream, (err) => {
      console.log("Error: ", err);
    });
  });
});

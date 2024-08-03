import { Request, Response } from "express";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 8080;

app.get("/", function (req: Request, res: Response) {
  res.send("Hello world!");
});

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

io.on("connection", (socket) => {
  console.log("connected", socket.id);

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
  });
});

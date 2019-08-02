const fs = require('fs');
const express = require('express');
const app = express();
let broadcaster;
let broadcasters = {};
let viewers = {};
let server;
let socketIdMap = {};
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

var credentials = {
  key: fs.readFileSync('localhost.includesprivatekey.pem'),
  cert: fs.readFileSync('localhost.includesprivatekey.pem')
};

app.route("/statistics").get([onStatistics]);
app.route("/").get([onHome]);

//HTTPS
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  // port = 443;
  startServer(server, port);
}

//HTTP
// const http = require('http');
// server = http.createServer(app);
// startServer(server, port);

function startServer(server, port) {
  const io = require('socket.io')(server);
  app.use(express.static(__dirname + '/public'));

  io.sockets.on('error', e => console.log(e));
  io.sockets.on('connection', function (socket) {
    onSocketConnected(io, socket);
  });
  server.listen(port, () => console.log(`Server is running on port ${port}`));
}

function onSocketConnected(io, socket) {
  let payload = socket.handshake.query.payload;

  let json = JSON.parse(payload);
  let userName = json["userName"];
  let title = json["title"];

  socketIdMap[socket.id] = userName;

  socket.on('broadcaster', function () {


    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');

    let newDetails = {};
    newDetails["userName"] = userName;
    newDetails["title"] = title;

    broadcasters[socket.id] = newDetails;
    viewers[socket.id] = [];

    console.log("newDetails=[" + JSON.stringify(newDetails) + "] BROADCASTING...");

  });
  socket.on('message', function (id, message) {
    console.log("new message: ", message);
    io.emit("message", message);
  });
  socket.on('available', function () {
    console.log("socketId=[" + socket.id + "] REQUESTING LIVE STREAMS...");
    io.emit("available", JSON.stringify(broadcasters));
  });
  socket.on('view', function (socketId) {
    // console.log("socketId=[" + socket.id + "] REQUESTING LIVE STREAMS...");
    // io.emit('available', JSON.stringify(broadcasters));
    // socket.to(socket.id).emit('available', JSON.stringify(broadcasters));
  });
  socket.on('watcher', function (socketId) {
    socket.to(socketId).emit('watcher', socket.id);
    socket.to(socketId).emit('viewer', userName);
    console.log("socketId=[" + socket.id + "] userName=[" + userName + "] VIEWING BROADCAST [" + socketId + "]");

    let array = viewers[socketId];
    array.push(socket.id);
    viewers[socketId] = array;
  });
  socket.on('offer', function (id /* of the watcher */, message) {
    socket.to(id).emit('offer', socket.id /* of the broadcaster */, message);
  });
  socket.on('answer', function (id /* of the broadcaster */, message) {
    socket.to(id).emit('answer', socket.id /* of the watcher */, message);
  });
  socket.on('candidate', function (id, message) {
    socket.to(id).emit('candidate', socket.id, message);
  });
  socket.on('disconnect', function() {
    var userDisconnected = socketIdMap[socket.id];
    console.log("socketId=[" + socket.id + "] userName=[" + userName + "] DISCONNECTED...");
    broadcaster && socket.to(broadcaster).emit('bye', userDisconnected);
    delete socketIdMap[socket.id];
    delete broadcasters[socket.id];

    for(allViewers in viewers[socket.id]) {
        delete allViewers[socket.id];
    }
    delete viewers[socket.id];
  });
}

function onStatistics(req, res) {
  let json = {};
  json["broadcasters"] = broadcasters;
  json["viewers"] = viewers;

  res.contentType('application/json');
  res.status(200);
  res.send(JSON.stringify(json) + "\n");
  res.end();
}

function onHome(req, res) {
  res.contentType('application/json');
  res.status(200);
  res.send("Hi! This actually works!!");
  res.end();
}

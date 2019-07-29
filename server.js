const fs = require('fs');
const express = require('express');
const app = express();
let broadcaster;
let broadcasters = {};
let server;
let port;
let socketIdMap = {};
let broa

var credentials = {
  key: fs.readFileSync('localhost.includesprivatekey.pem'),
  cert: fs.readFileSync('localhost.includesprivatekey.pem')
};

//HTTPS
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 443;
  startServer(server, port);
} 

//HTTP
const http = require('http');
server = http.createServer(app);
port = 3001;
startServer(server, port);

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

  console.log("payload=" + payload);
  let json = JSON.parse(payload);
  let userName = json["userName"];
  let title = json["title"];
  
  socketIdMap[socket.id] = userName;
  
  console.log("socketId=[" + socket.id + "] userName=[" + userName + "] title=[" + title + "]");

  socket.on('broadcaster', function () {
    console.log("socketId=[" + socket.id + "] userName=[" + userName + "] BROADCASTING...");
    broadcaster = socket.id;
    broadcasters[socket.id] = {
      "userName" : userName,
      "title" : title,
      "viewers": {}
    };
    socket.broadcast.emit('broadcaster');
    console.log("broadcasters: " + Object.keys(broadcasters));
  });
  socket.on('message', function (message) {
    console.log("new message: ", message);
    io.emit("message", message);
  });
  socket.on('watcher', function (socketId) {
    if(broadcaster != null) {
      socket.to(broadcaster).emit('watcher', socket.id);
      socket.to(broadcaster).emit('viewer', userName);
      console.log("socketId=[" + socket.id + "] userName=[" + userName + "] VIEWING BROADCAST [" + broadcaster + "]");
    }
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
  });
}

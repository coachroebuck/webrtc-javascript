const fs = require('fs');
const express = require('express');
const app = express();
let broadcaster;
let broadcasters = {};
let viewers = {};
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
    newDetails["viewers"] = [];
    
    broadcasters[socket.id] = newDetails;
    viewers[socket.id] = {};

    console.log("newDetails=[" + JSON.stringify(newDetails) + "] BROADCASTING...");
    
  });
  socket.on('message', function (id, message) {
    console.log("new message: ", message);
    io.emit("message", message);
  });
  socket.on('available', function () {
    console.log("socketId=[" + socket.id + "] REQUESTING LIVE STREAMS...");
    io.emit("available", JSON.stringify(broadcasters));
    // socket.to(socket.id).emit('available', JSON.stringify(broadcasters));
    // socket.to(socket.id).emit('available', JSON.stringify(broadcasters));
  });
  socket.on('view', function (socketId) {
    // console.log("socketId=[" + socket.id + "] REQUESTING LIVE STREAMS...");
    // io.emit('available', JSON.stringify(broadcasters));
    // socket.to(socket.id).emit('available', JSON.stringify(broadcasters));
  });
  socket.on('watcher', function (socketId) {
    if(broadcaster != null) {
      console.log("socketId=[" + socket.id + "] parentWocketId=[" + socketId + "] WATCHING...");
      socket.to(socketId).emit('watcher', socket.id);
      socket.to(socketId).emit('viewer', userName);
      console.log("socketId=[" + socket.id + "] userName=[" + userName + "] VIEWING BROADCAST [" + socketId + "]");
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
    delete viewers[socket.id]
  });
}

const credentials = require('./credentials');
const express = require('express');
const app = express();
let broadcaster;
let server;
let port;
let socketIdMap = {};

if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 443;
} else {
  const http = require('http');
  server = http.createServer(app);
  port = 3001;
}
const io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));

io.sockets.on('error', e => console.log(e));
io.sockets.on('connection', function (socket) {

  let userName = socket.handshake.query.userName;
  
  socketIdMap[socket.id] = userName;
  
  console.log("New userName=[" + userName + "] socketId=[" + socket.id + "]");

  socket.on('broadcaster', function () {
    console.log("new broadcaster: ", userName);
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });
  socket.on('message', function (message) {
    console.log("new message: ", message);
    io.emit("message", message);
  });
  socket.on('watcher', function () {
    broadcaster && socket.to(broadcaster).emit('watcher', socket.id);
    broadcaster && socket.to(broadcaster).emit('viewer', userName);
    console.log("new watcher: ", userName);
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
    console.log("disconnect: ", userDisconnected);
    broadcaster && socket.to(broadcaster).emit('bye', userDisconnected);
    delete socketIdMap[socket.id];
  });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));

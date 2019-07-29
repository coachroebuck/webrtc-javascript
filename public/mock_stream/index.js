let now = new Date();
let timestamp = "recording-"
      + now.getFullYear() + "-"
      + (now.getMonth() + 1).toString().padStart(2, '0') + "-"
      + now.getDay().toString().padStart(2, '0') + "--"
      + now.getHours().toString().padStart(2, '0') + "-"
      + now.getMinutes().toString().padStart(2, '0') + "-"
      + now.getSeconds().toString().padStart(2, '0');
const userColor = "#0041C2"
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const browseButton = document.getElementById("browseButton");
const userName = document.getElementById("userName");
const socketIdSelection = document.getElementById("socketId");
const watchButton = document.getElementById("watchButton");

var socket = null;
var activeStream = null;
var peerConnections = {};

startButton.addEventListener("click", function() {
	connect(userName.value, timestamp);
}, false);

browseButton.addEventListener("click", function() {
	browse();
}, false);

watchButton.addEventListener("click", function() {
	watch(socketIdSelection.value);
}, false);

stopButton.addEventListener("click", function() {
	disconnect();
}, false);

function connect(userName, timestamp) {
		try {
		var json = {};
		json["userName"] = userName;
		json["title"] = timestamp;
		let payload = JSON.stringify(json);
		
		socket = io.connect(window.location.origin + "?payload=" + payload);
		socket.emit('available');
	
	    socket.on('available', function(message) {
	    	alert(message);
		});
	
	    socket.on('answer', function(id, description) {
	    	peerConnections[id].setRemoteDescription(description);
		});

		socket.on('watcher', function(id) {
			const peerConnection = new RTCPeerConnection(config);
			peerConnections[id] = peerConnection;
			peerConnection.addStream(videoView.srcObject);
			peerConnection.createOffer()
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(function () {
				socket.emit('offer', id, peerConnection.localDescription);
			});
			peerConnection.onicecandidate = function(event) {
				if (event.candidate) {
					socket.emit('candidate', id, event.candidate);
				}
			};
		});

		socket.on('candidate', function(id, candidate) {
			peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
		});

		socket.on('viewer', function(id) {
		});

		socket.on('message', function(message) {
		});

		socket.on('broadcaster', function() {
		});

		socket.on('bye', function(id) {
			// peerConnections[id] && peerConnections[id].close();
			// delete peerConnections[id];
		});
	}
	catch (e) {
		alert(e.message);
	}
}

function browse() {
	socket.emit('available');
}

function watch(socketId) {
	socket.emit('watcher', socketId);
	alert("socket selected: " + socketIdSelection.value);
}

function disconnect() {
	socket.disconnect();
}
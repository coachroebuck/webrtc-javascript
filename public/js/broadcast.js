var broadcastVideo = function () {
    socket = io.connect(window.location.origin);
    socket.emit('broadcaster');

    socket.on('answer', function(id, description) {
		peerConnections[id].setRemoteDescription(description);
		log("id:" + id + "; description: " + description);
	});

	socket.on('watcher', function(id) {
		log("New watcher...");
		const peerConnection = new RTCPeerConnection(config);
		peerConnections[id] = peerConnection;
		peerConnection.addStream(previewView.srcObject);
		peerConnection.createOffer()
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(function () {
			socket.emit('offer', id, peerConnection.localDescription);
		});
		peerConnection.onicecandidate = function(event) {
		log("New Per Connection candidate: " + event.candidate);
			if (event.candidate) {
				socket.emit('candidate', id, event.candidate);
			}
		};
	});

	socket.on('candidate', function(id, candidate) {
		log("New candidate: " + event.candidate);
		peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
	});

	socket.on('message', function(message) {
		chatView.innerHTML += message + "<br />\n";
	});

	socket.on('bye', function(id) {
		log("Peer left: " + id);
		peerConnections[id] && peerConnections[id].close();
		delete peerConnections[id];
	});
}

function stopBroadcasting() {
	socket.close();
}
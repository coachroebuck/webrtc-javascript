const userId = "beautyofpoetry";

/*global socket, video, config*/
let peerConnection;

// streamButton.addEventListener("click", function() {
	startStreaming();
// }, false);

streamButton.addEventListener("click", function() {
	stopStreaming();
}, false);

function startStreaming() {
    socket = io.connect("http://192.168.29.137:3001");	//window.location.origin
	socket.on('offer', function(id, description) {
		peerConnection = new RTCPeerConnection(config);
		peerConnection.setRemoteDescription(description)
		.then(() => peerConnection.createAnswer())
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(function () {
			chatView.innerHTML += "id=[" + id + "] Local description: " + peerConnection.localDescription + "<br />\n";
			socket.emit('answer', id, peerConnection.localDescription);
		});
		peerConnection.onaddstream = function(event) {
			streamingView.srcObject = event.stream;
		};
		peerConnection.onicecandidate = function(event) {
			if (event.candidate) {
				chatView.innerHTML += "new ice candidate: " + candievent.candidatedate + "<br />\n";
				socket.emit('candidate', id, event.candidate);
			}
		};
	});

	socket.on('candidate', function(id, candidate) {
		chatView.innerHTML += "candidate: " + candidate + "<br />\n";
	  	peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
	  .catch(e => console.error(e));
	});

	socket.on('connect', function() {
		chatView.innerHTML += "Connected to broadcast.<br />\n";
		socket.emit('watcher');
	});

	socket.on('message', function(message) {
		chatView.innerHTML += message + "<br />\n";
	});

	socket.on('broadcaster', function() {
		chatView.innerHTML += "Streaming broadcast.<br />\n";
	  	socket.emit('watcher');
	});

	socket.on('bye', function() {
		chatView.innerHTML += "Broadcast ended.<br />\n";
		peerConnection.close();
	});	
}

function stopStreaming() {
	socket.disconnect();
}
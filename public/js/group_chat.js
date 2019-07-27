// var Broadcaster = (function(myVideoView) {

// 	var isBroadcasting = false;

// 	function Broadcaster() {

// 	}

// 	Broadcaster.prototype.isBroadcasting = function() {
//         // It has access to the private space and it's children!
//         return this.isBroadcasting;
//     };
// })();

var VideoBroadcaster = (function(myVideoView) { // immediate function
	var videoView = null;
    var isBroadcasting = false;
	var socket = null;
	var activeStream = null;
	var peerConnections = {};
	var stream = null;

	/** @type {RTCConfiguration} */
	var config = { // eslint-disable-line no-unused-vars
	  'iceServers': [{
	    'urls': [
	    		'stun:stun.l.google.com:19302',
	    	]
	  }]
	};
	
	/** @type {MediaStreamConstraints} */
	var constraints = {
		audio: true,
		video: {facingMode: "user"}
	};

    // create the constructor
    function VideoBroadcaster(myVideoView) {
        videoView = myVideoView;
    }

    VideoBroadcaster.prototype.isBroadcasting = function() {
        return isBroadcasting;
    };

    VideoBroadcaster.prototype.start = function() {
		navigator.mediaDevices.getUserMedia(constraints).then(stream => {
			videoView.srcObject = stream;
			startVideoBroadcast();
			videoView.captureStream = videoView.captureStream || videoView.mozCaptureStream;
			return new Promise(resolve => {
        		videoView.onplaying = resolve;
        	});
		}).then(() => {
			activeStream = stream;
			createWebSocket(videoView.captureStream());
		})
    };

    VideoBroadcaster.prototype.pause = function() {
    	pauseVideoBroadcast();
        isBroadcasting = false;
    };

    VideoBroadcaster.prototype.resume = function() {
    	resumeVideoBroadcast();
        isBroadcasting = true;
    };

    VideoBroadcaster.prototype.stop = function() {
    	stopVideoBroadcast();
    	closeWebSocket();
        isBroadcasting = false;
    };

    function startVideoBroadcast() {
    	socket = io.connect("http://192.168.29.137:3001");	//window.location.origin
	    socket.emit('broadcaster');

	    socket.on('answer', function(id, description) {
			onMessageReceived("New Answer: id=[" + id + "] description=[" + description + "]");
	    	peerConnections[id].setRemoteDescription(description);
		});

		socket.on('watcher', function(id) {
			onMessageReceived("New Watcher: " + id);
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

		socket.on('message', function(message) {
			onMessageReceived(message);
		});

		socket.on('bye', function(id) {
			onMessageReceived("Peer Disconnected: id=[" + id + "]");
			peerConnections[id] && peerConnections[id].close();
			delete peerConnections[id];
		});

        isBroadcasting = true;
    };

    function onMessageReceived(text) {
    	var node = document.createElement("LI");                 // Create a <li> node
    	var textnode = document.createTextNode(text);         // Create a text node
		node.classList.add("server");
		node.appendChild(textnode);                              // Append the text to <li>
		document.getElementById("messages").appendChild(node);     // Append <li> to <ul> with id="myList"
    }

    function createWebSocket(stream) {
    }

    function closeWebSocket() {
		socket.close();
    }

    function stopVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.stop());
	}

	function pauseVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.pause());
	}

	function resumeVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.resume());
	}

    return VideoBroadcaster;
})();

const myVideoView = document.getElementById("my_video");
let videoBroadcaster = new VideoBroadcaster(myVideoView);

myVideoView.addEventListener("click", function() {
	if(videoBroadcaster.isBroadcasting()) {
		videoBroadcaster.stop();
	}
	else {
		videoBroadcaster.start();
	}
}, false);

// function Broadcast(myVideoView) {
// 	//public member property
//   	this.isBroadcasting = false;

//   	//private member property
  	


// 	this.start = function() {
// 	  this.isBroadcasting = true;
// 	  startRecording();
// 	};

// 	this.stop = function() {
// 		stopRecording();
// 	  	this.isBroadcasting = false;
// 	};

// 	var startRecording = function() {
// 	}

// 	var broadcastVideo = function () {

// 	}

// 	var stopRecording = function() {

// 	}

// 	var stopVideoBroadcast = function() {
// 		socket.close();
// 	}
// }

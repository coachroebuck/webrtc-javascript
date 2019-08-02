var VideoStreamer = (function(myVideoView) { // immediate function
	var videoView = null;
    var isStreaming = false;
	var streamingSocket = null;
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
    function VideoStreamer(myVideoView) {
    	videoView = myVideoView;
    }

    VideoStreamer.prototype.isStreaming = function() {
        return isStreaming;
    };

    VideoStreamer.prototype.start = function() {
    	startVideoStream()
		createWebSocket(videoView.captureStream());
    };

    VideoStreamer.prototype.pause = function() {
    	pauseVideoStream();
        isStreaming = false;
    };

    VideoStreamer.prototype.resume = function() {
    	resumeVideoStream();
        isStreaming = true;
    };

    VideoStreamer.prototype.stop = function() {
    	stopVideoStream();
    	closeWebSocket();
    	onMessageReceived("Ended Stream.");
        isStreaming = false;
    };

	VideoStreamer.prototype.sendNewMessage = function(message) {
		var json = {};
		json["userName"] = userName;
		json["color"] = userColor;
		json["message"] = message;
  		streamingSocket.emit('message', JSON.stringify(json));
    };

    function startVideoStream() {
	    var json = {};
		json["userName"] = userName;
		json["title"] = timestamp;
		let payload = JSON.stringify(json);
		
		streamingSocket = io.connect(window.location.origin + "?payload=" + payload);
		streamingSocket.on('offer', function(id, description) {
			peerConnection = new RTCPeerConnection(config);
			peerConnection.setRemoteDescription(description)
			.then(() => peerConnection.createAnswer())
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(function () {
				onMessageReceived("peer answered...");
				streamingSocket.emit('answer', id, peerConnection.localDescription);
			});
			peerConnection.onaddstream = function(event) {
				onMessageReceived("Adding peer stream...");
				if(videoView.srcObject == null) {
					videoView.srcObject = event.stream;
				}
			};
			peerConnection.onicecandidate = function(event) {
				onMessageReceived("onIceCandiate()...");
				if (event.candidate) {
					streamingSocket.emit('candidate', id, event.candidate);
				}
			};
		});

		streamingSocket.on('candidate', function(id, candidate) {
			onMessageReceived("received candidate()...");
			peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
		  .catch(e => console.error(e));
		});

		streamingSocket.on('connect', function() {
			onMessageReceived("Connected to broadcast.");
			streamingSocket.emit('watcher');
		});

		streamingSocket.on('message', function(message) {
			onPeerMessageReceived(message);
		});

		streamingSocket.on('live', function(message) {
			onPeerMessageReceived(message);
		});

		streamingSocket.on('broadcaster', function() {
			onMessageReceived("Streaming broadcast.");
		  	streamingSocket.emit('watcher');
		});

		streamingSocket.on('bye', function() {
			onMessageReceived('Stream ended.');
			peerConnection.close();
		});	

        isStreaming = true;
    };

    function onWatcherConnected(id) {
    	// <li class="their_info">
     //    <b id="their_name_00001" class="their_name">Mary</b><br />
     //    <video id="theirVideo_00001" class="their_video" poster="/img/video_not_available.png" autoplay muted></video>
     //    </li>
    	var li = document.createElement("LI");
    	var b = document.createElement("B");
    	var video = document.createElement("VIDEO");
    	var ul = document.getElementById("their_videos");
	//http://localhost:3001/watch.html
		li.setAttribute("id", id);
    	li.setAttribute("class", "their_info");
    	b.setAttribute("id", id + "_UserName");
    	b.setAttribute("class", "their_name");
    	video.setAttribute("class", "their_video");
    	video.setAttribute("poster", "/img/video_not_available.png");
    
    	video.autoplay;
    	video.muted;
    
    	b.innerHTML = id;
    
    	li.appendChild(b);
    	li.appendChild(video);

    	ul.appendChild(li);
    }

    function onWatcherDisconnected(id) {
    	var element = document.getElementById(id);
	    element.parentNode.removeChild(element);
    }

    function onMessageReceived(text) {
    	var node = document.createElement("LI");
    	var textnode = document.createTextNode(text);
		node.classList.add("server");
		node.appendChild(textnode);
		document.getElementById("messages").appendChild(node);
    }

    function onPeerMessageReceived(text) {
    	var node = document.createElement("LI");
    	var b = document.createElement("B");
    	var span = document.createElement("SPAN");
    	var json = JSON.parse(text);

    	b.setAttribute("style", "color:" + json["color"]);
    	span.setAttribute("style", "color:" + json["color"]);

    	b.innerHTML = json["userName"] + ": ";
    	span.innerHTML = json["message"];

    	node.appendChild(b);
		node.appendChild(span);
		document.getElementById("messages").appendChild(node);
    }

    function createWebSocket(stream) {
    }

    function closeWebSocket() {
		streamingSocket.close();
    }

    function stopVideoStream() {
	  videoView.srcObject.getTracks().forEach(track => track.stop());
	  videoView.srcObject = null;
	}

	function pauseVideoStream() {
	  videoView.srcObject.getTracks().forEach(track => track.pause());
	}

	function resumeVideoStream() {
	  videoView.srcObject.getTracks().forEach(track => track.resume());
	}

    return VideoStreamer;
})();
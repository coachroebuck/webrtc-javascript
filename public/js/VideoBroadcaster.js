var VideoBroadcaster = (function(myVideoView) { // immediate function
	var videoView = null;
    var isBroadcasting = false;
	var socket = null;
	var activeStream = null;
	var peerConnections = {};
	var stream = null;
	var isExpectingViewers = true;
	var videoStreamers = {};

	/** @type {RTCConfiguration} */
	var config = { // eslint-disable-line no-unused-vars
	  'iceServers': [{
	    'urls': [
	    		'stun:stun.l.google.com:19303',
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

    VideoBroadcaster.prototype.setExpectingViewers = function(isEnabled) {
        isExpectingViewers = isEnabled;
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
    	onMessageReceived("Ended Broadcast.");
        isBroadcasting = false;
    };

	VideoBroadcaster.prototype.sendNewMessage = function(message) {
		var json = {};
		json["userName"] = userName;
		json["color"] = userColor;
		json["message"] = message;
  		socket.emit('message', JSON.stringify(json));
    };

    function startVideoBroadcast() {
    	try {
    		var json = {};
			json["userName"] = userName;
			json["title"] = timestamp;
			let payload = JSON.stringify(json);
			
    		socket = io.connect(window.location.origin + "?payload=" + payload);
			socket.emit('broadcaster');
		    onMessageReceived("Started broadcast");

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
				if(isExpectingViewers) {
					onWatcherConnected(id);
					onMessageReceived("New Viewer: " + id);
				}
			});

			socket.on('message', function(message) {
				onPeerMessageReceived(message);
			});

			socket.on('broadcaster', function() {
				onMessageReceived("Streaming viewer.");
			});

			socket.on('bye', function(id) {
				if(isExpectingViewers) {
					onMessageReceived("Peer Disconnected: " + id);
					onWatcherDisconnected(id);
				}
				peerConnections[id] && peerConnections[id].close();
				delete peerConnections[id];
			});

	        isBroadcasting = true;
    	}
    	catch (e) {
    		onMessageReceived(e.message);
    	}
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
    	video.setAttribute("autoplay", null);
    	video.setAttribute("muted", null);
    	video.autoplay;
    	video.muted;
    
    	b.innerHTML = id;
    
    	li.appendChild(b);
    	li.appendChild(video);

    	ul.appendChild(li);

    	let videoStreamer = new VideoStreamer(video);
    	videoStreamers[id] = videoStreamer;

		video.onclick = function() { 
			if(videoStreamer.isStreaming()) {
				videoStreamer.stop();
			}
			else {
				videoStreamer.start();
			}
		};
    }

    function onWatcherDisconnected(id) {
    	var element = document.getElementById(id);
    	// var videoStreamer = videoStreamers[id];
	    element.parentNode.removeChild(element);
	    // videoStreamer.stop();
	    // delete videoStreamers[id];
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
		socket.close();
    }

    function stopVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.stop());
	  videoView.srcObject = null;
	}

	function pauseVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.pause());
	}

	function resumeVideoBroadcast() {
	  videoView.srcObject.getTracks().forEach(track => track.resume());
	}

    return VideoBroadcaster;
})();
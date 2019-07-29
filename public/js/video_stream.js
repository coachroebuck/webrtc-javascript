let now = new Date();
let timestamp = "recording-"
      + now.getFullYear() + "-"
      + (now.getMonth() + 1).toString().padStart(2, '0') + "-"
      + now.getDay().toString().padStart(2, '0') + "--"
      + now.getHours().toString().padStart(2, '0') + "-"
      + now.getMinutes().toString().padStart(2, '0') + "-"
      + now.getSeconds().toString().padStart(2, '0');
const userName = "jacob";
const userColor = "#0041C2"
const broadcastVideoView = document.getElementById("broadcast_video");
const myVideoView = document.getElementById("my_video");
const newMessageTextField = document.getElementById("newMessageTextField");
const postMessageButton = document.getElementById("postMessageButton");
let videoBroadcaster = new VideoBroadcaster(myVideoView);
let videoStreamer = new VideoStreamer(broadcastVideoView);
videoStreamer.start();

broadcastVideoView.addEventListener("click", function() {
	if(videoStreamer.isStreaming()) {
		videoStreamer.stop();
	}
	else {
		videoStreamer.start();
	}
}, false);


myVideoView.addEventListener("click", function() {
	if(videoBroadcaster.isBroadcasting()) {
		videoBroadcaster.stop();
	}
	else {
		videoBroadcaster.setExpectingViewers(false);
		videoBroadcaster.start();
	}
}, false);

postMessageButton.addEventListener("click", function(event) {
  	event.preventDefault()
    videoStreamer.sendNewMessage(newMessageTextField.value);
    newMessageTextField.value = "";
}, false);

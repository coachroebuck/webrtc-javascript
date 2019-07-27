const userName = "coachroebuck"
const userColor = "#C28100"
const myVideoView = document.getElementById("my_video");
const newMessageTextField = document.getElementById("newMessageTextField");
const postMessageButton = document.getElementById("postMessageButton");
const chatView = document.getElementById("chat");

let videoBroadcaster = new VideoBroadcaster(myVideoView);

myVideoView.addEventListener("click", function() {
	if(videoBroadcaster.isBroadcasting()) {
		videoBroadcaster.stop();
	}
	else {
		videoBroadcaster.start();
	}
}, false);

postMessageButton.addEventListener("click", function(event) {
  	event.preventDefault()
    videoBroadcaster.sendNewMessage(newMessageTextField.value);
    newMessageTextField.value = "";
}, false);

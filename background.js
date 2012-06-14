background = {};

background.timeout = 5000;
background.url = "http://www.jugevents.org/jugevents/event/showParticipants.html?id=";
background.eventId 	= "event.id";
background.inscritsId 	= "event.inscrits";
background.currentTask;

background.start = function(){
	background.currentTask = setInterval(background.check, background.timeout);
}

background.stop = function(){
	if(background.currentTask){
		clearInterval(background.currentTask);
	}
}

background.updateBadge = function(){
	if(chrome.browserAction){
		chrome.browserAction.setBadgeText({text:localStorage[background.inscritsId]+""});
	}
}

background.clearBadge = function(){
	if(chrome.browserAction){
		chrome.browserAction.setBadgeText({text:""});
	}
}

background.check = function(){
	var id = localStorage[background.eventId];
	if(id){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
		  if (xhr.readyState == 4) {
			var matches = xhr.responseText.match(/<div.class="participant">/mgi);
			var inscrits;
			if(matches){
				inscrits = matches.length;
			}
			localStorage[background.inscritsId]=inscrits;
			background.updateBadge();
		  }
		}
		xhr.open("GET", background.url+id, false);
		xhr.send();
	}else{
		background.clearBadge();
	}
}

background.onRequestReceived = function(request, sender, sendResponse){
	if (request.action == "update"){
		background.stop();
		background.check();
		background.start();
	}
	sendResponse();
}


background.init = function() {
	chrome.extension.onRequest.addListener(background.onRequestReceived);
}

background.updateBadge();
background.start();

window.addEventListener("DOMContentLoaded", background.init, false);
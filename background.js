background = {};

background.timeout = 5000;
background.eventurl = "http://www.jugevents.org/jugevents/event/";
background.url = "http://www.jugevents.org/jugevents/event/showParticipants.html?id=";
background.eventId 	= "event.id";
background.inscritsId = "event.inscrits";
background.titleId = "event.title";
background.descId = "event.desc";
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
			chrome.extension.sendRequest({action: "eventUpdated"}, function(response) {
			  console.log("Event updated for all extension");
			});
		  }
		}
		xhr.open("GET", background.url+id, false);
		xhr.send();
		
		var xhr2 = new XMLHttpRequest();
		xhr2.onreadystatechange = function() {
		  if (xhr2.readyState == 4) { 
			var matches = xhr2.responseText.match(/<div.class=.eventTitle.>.*<.div>/mgi);
			var title;
			if(matches){
				title = matches[0].replace('<div class="eventTitle">','').replace('</div>','');
			}
			localStorage[background.titleId]=title;
			
			var matches = xhr2.responseText.match(/<div.class=.preview.>.*<.div>/mgi);
			var desc;
			if(matches){
				desc = matches[0].replace('<div class="preview">','').replace('</div>','');
			}
			localStorage[background.descId]=desc;
		  }
		}
		xhr2.open("GET", background.eventurl+id, false);
		xhr2.send();
	}else{
		background.clearBadge();
	}
}

background.onRequestReceived = function(request, sender, sendResponse){
	if (request.action == "optionsSaved"){
		console.log("Received an update on options");
		setTimeout(function(){
			background.stop();
			background.check();
			background.start();
		},10);
	}
	sendResponse();
}


background.init = function() {
	chrome.extension.onRequest.addListener(background.onRequestReceived);
}

background.updateBadge();
background.start();

window.addEventListener("DOMContentLoaded", background.init, false);
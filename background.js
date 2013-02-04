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
		var inscrits = localStorage[background.inscritsId];
		var label = "";
		if(inscrits){
			label = inscrits+"";
		}
		chrome.browserAction.setBadgeText({text:label});
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
			if(localStorage[background.inscritsId] != inscrits){
				localStorage[background.inscritsId]=inscrits;
				background.updateBadge();
				chrome.extension.sendMessage({action: "eventUpdated"}, function(response) {
				  console.log("Updated participants number");
				});
			}
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
			if(localStorage[background.titleId]!=title){
				localStorage[background.titleId]=title;
				chrome.extension.sendMessage({action: "eventUpdated"}, function(response) {
					console.log("Updated next event title");
				});
			}
			
			
			var matches = xhr2.responseText.match(/<div.class=.preview.>.*<.div>/mgi);
			var desc;
			if(matches){
				desc = matches[0].replace('<div class="preview">','').replace('</div>','');
			}
			
			if(localStorage[background.descId]!=desc){
				localStorage[background.descId]=desc;
				chrome.extension.sendMessage({action: "eventUpdated"}, function(response) {
					console.log("Updated next event description");
				});
			}
		  }
		}
		xhr2.open("GET", background.eventurl+id, false);
		xhr2.send();
	}else{
		background.clearBadge();
	}
}

background.follow = function(eventId){
	if(localStorage[background.eventId] != eventId){
		localStorage[background.eventId] = eventId;
		localStorage.removeItem(background.titleId);
		localStorage.removeItem(background.descId);
		localStorage.removeItem(background.inscritsId);
		if(eventId){
			var notification = webkitNotifications.createNotification(
			  'logo.jpeg',  // icon url - can be relative
			  'Following '+eventId,  // notification title
			  'You are now following event '+eventId  // notification body text
			);
			notification.show();
		}
	}
}


background.onRequestReceived = function(request, sender, sendResponse){
	if(request.action == "eventFollow"){
	    console.log("Received an update on options");
		setTimeout(function(){
			background.stop();
			background.follow(request.event);
			background.updateBadge();
			background.check();
			background.start();
		},10);
	}
	sendResponse();
}


background.init = function() {
	chrome.extension.onMessage.addListener(background.onRequestReceived);
}

background.updateBadge();
background.start();

window.addEventListener("DOMContentLoaded", background.init, false);
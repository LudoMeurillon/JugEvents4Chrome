options = {};

options.Math = {};	

options.Math.median = function (values) {
	values.sort( function(a,b) {return a - b;} );
	var half = Math.floor(values.length/2);
	if(values.length % 2)
		return values[half];
	else
		return (values[half-1] + values[half]) / 2.0;
}

options.Math.avg = function (values) {
	var sum = 0;
	values.forEach(function(v){sum=sum+v});
	return Math.round(sum/values.length);
}

options.http = {};
options.http.JUGEVENTS_ROOT_URL = "http://www.jugevents.org/jugevents/event/";
options.http.SHOW_PARTICIPANTS_URL = options.http.JUGEVENTS_ROOT_URL+"showParticipants.html?id=";

options.localStorage={};
options.localStorage.jugnameid 	= "event.jugname";
options.localStorage.eventid 	= "event.id";
options.localStorage.incrits 	= "event.inscrits";
options.localStorage.title 		= "event.title";
options.localStorage.desc 		= "event.desc";

options.showAndHide = function(selector, timeout, message){
	$(selector).html("");
	$(selector).show();
	if(message){
		$(selector).html(message);
	}
	if(timeout != 0){
		setTimeout(function(){ $(selector).fadeOut() }, timeout);
	}
}

options.store = function (storageid, input){
	var value = $("#"+input).val();
	options.storeValue(storageid, value);
}

options.storeValue = function(storageid, value){
	localStorage[storageid]=value;
	console.log("stored "+value+" into localStorage['"+storageid+"']");
} 

options.autoFollow = function(jugName){
    var url = options.http.JUGEVENTS_ROOT_URL+"search.form?continent=&country=&jugName="+jugName+"&pastEvents=true&_pastEvents=on&orderByDate=desc"
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) { 
			var regex = new RegExp("<a.href=\".jugevents.event.([0-9]+)\".*>","mgi");
			var matches = xhr.responseText.match(regex);
			if(matches.length > 0){
				var lastEvent = matches[0];
				var eventID = regex.exec(lastEvent)[1];
				chrome.extension.sendMessage({action: "eventFollow", event: eventID}, function(response) {
					console.log("call to background.js done");
				});
			}
		}
	}
	xhr.open("GET", url, false);
	xhr.send();
}


options.save = function(){
	options.store(options.localStorage.jugnameid,'jugName');
	options.showAndHide('#saved', 2000, "Options saved !");

	setTimeout(function (){
		chrome.extension.sendMessage(
			{action: "optionsSaved"}, 
			function(response) {
				console.log("call to background.js done");
			}
		);
	},10);
	if($("#jugName").val()){
		options.refreshEvents();
	}
	setTimeout(function(){
		options.autoFollow(localStorage[options.localStorage.jugnameid]);
	}, 10);
}

options.restore = function(initFields){
	var eventid = localStorage[options.localStorage.eventid];
	if(initFields){
		$('#id').val(eventid);
	}
	if(eventid){
		$('#detailsEvent').show();
		$('#details').attr("href",options.http.JUGEVENTS_ROOT_URL+eventid);
		$('#participants').attr("href",options.http.SHOW_PARTICIPANTS_URL+eventid);
	}else{
		$('#detailsEvent').hide();
	}
	
	var jugName = localStorage[options.localStorage.jugnameid];
	console.log("Found jugname="+jugName+" in localStorage");
	if(initFields && $('#jugName').val() != jugName && !$('#jugName').is(":focus")){
		$('#jugName').val(jugName);
		if(jugName && jugName.trim() != ""){
			$('#stats').show();
			$('#updatestatsbutton').removeClass('disabled');
		}else{
			$('#updatestatsbutton').addClass('disabled');
		}
	}
	
	var nbParticipants = localStorage[options.localStorage.incrits];
	console.log("Found nbParticipants="+nbParticipants+" in localStorage");
	var previousValue = $('#nbparticipants').text();
	if(nbParticipants){
		$('#nbparticipants').show();
		if(parseInt(previousValue) != parseInt(nbParticipants) && !$('#nbparticipants').is(":focus")){
			$('#nbparticipants').text(nbParticipants);
			$('#nbParticipantsContainer').toggleClass("normal");
			$('#nbParticipantsContainer').toggleClass("returned");
		}
	}else{
		$('#nbparticipants').hide();
	}
	
	var title = localStorage[options.localStorage.title];
	console.log("Found title="+title+" in localStorage");
	if(title){
		$('#eventtitle').text(title);
		$('#detailsAuthor').text(jugName);
		$('#detailsTitle').text(title);
		$('#detailsDesc').popover({placement:'bottom', title:title, content:localStorage[options.localStorage.desc]});
	}else{
		$('#eventtitle').text("");
	}
}

options.refreshEvents = function(){
	setTimeout(function(){
		$('#updatestatsbutton').button('loading');
		/*
		var eventsUrls = JUGEVENTS_ROOT_URL+"json.html?jugName="+jugname+"&pastEvents=true&order=desc";
		*/
		var jugname = localStorage[options.localStorage.jugnameid];
		if(jugname != "undefined" && jugname != ""){
			var eventsXMLUrl = options.http.JUGEVENTS_ROOT_URL+"search.form?d-148316-p=2&6578706f7274=1&orderByDate=asc&_pastEvents=on&d-148316-e=3&pastEvents=true&jugName="+jugname;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
			  if (xhr.readyState == 4) {
				if(xhr.responseXML){
					var events = xhr.responseXML.getElementsByTagName('row');
					//$('#chart').hide();
					
					var nbEvents = events.length;
					
					jugevents.indexedDB.deleteEventsAndThen(function(){
						for (i = 0; i < nbEvents; i++) {
							var eventRow = events[i];
							
							//Select different fonction for last element (need for asynchronous refresh)
							if(i == events.length-1){
								var addEvent = options.addLastEvent;
							}else{
								var addEvent = options.addEvent;
							}
							
							if(eventRow.childNodes){
								var title = eventRow.childNodes[3].childNodes[0].nodeValue.trim();
								var startDate = eventRow.childNodes[5].childNodes[0].nodeValue.trim();
								var nbParticipants = parseInt(eventRow.childNodes[7].childNodes[0].nodeValue.trim());
								console.log("addind event : title = "+title+" date = "+startDate+", nb="+nbParticipants);
								addEvent(startDate, title, nbParticipants);
							}
						}
					});
				}else{
					var alert = "<div class=\"alert alert-error\">"
								+ "<button type=\"button\" class=\"close\" data-dismiss=\"alert\">×</button>" 
								+ "<h4 class=\"alert-heading\">Mise à jour impossible</h4>"
								+ "Une erreur est survenue lors de la mise à jour des données pour le ["
								+ jugname
								+"] peut être le JUG se nomme-t-il autrement sur jugevents ?"
								+ "</div>"
					
					options.showAndHide('#errorPanel', 0, alert);
					$('#updatestatsbutton').button('reset');
					console.error("No XML found for "+jugname);
				}
			  }
			}
			xhr.open("GET", eventsXMLUrl, false);	
			xhr.send();
		}
	},10);
}

options.addLastEvent = function(date, title, nb){
	jugevents.indexedDB.addEvent(date, title, nb, function(){
		console.log("Refreshing chart");
		$('#updatestatsbutton').button('reset');
		options.loadEvents();
	});
}

options.addEvent = function(date, title, nb){
	jugevents.indexedDB.addEvent(date, title, nb);
}

options.loadEvents = function(){
	var events =[];
	
	jugevents.indexedDB.foreachEvents(
		function (event){
			var dateFields = event.date.split('/');
			var relativeYearText = dateFields[2];
			var year 	= parseInt(relativeYearText,10)+2000;
			var month 	= parseInt(dateFields[1], 10)-1;
			var day 	= dateFields[0];
			var date 	= new Date(year, month, day);
			console.debug("Translated "+event.date+" to "+date+" with values relativeYear="+relativeYearText+" year="+year+" month="+month+" day="+day);
			events.push({date:date,audience:event.nbParticipants, title:event.title});
		}, 
		function(){
			var comparator = function(eventA, eventB){
				return eventA.date.getTime() - eventB.date.getTime()
			};
			events.sort(comparator);
			options.drawChart(events);
		}
	);
}

options.drawChart = function(events){
	var graph = new Dygraph(document.getElementById("canvaschart"),
						events.map(function (event){ return [event.date,event.audience] }),
						{colors:["rgb(81,163,81)"], 
						fillGraph:true,
						fillAlpha:0.5, 
						displayAnnotations:true,
						labels:["date","Participants"],
						labelsDiv: document.getElementById('chartLabels'),
						highlightCircleSize: 5,
						strokeWidth: 2});   
						
	var convert = function(date){
		var d = date.getDate();
		var m = date.getMonth()+1;
		var y = date.getFullYear();
		return '' + y +''+ (m<=9?'0'+m:m) +''+ (d<=9?'0'+d:d);
	}
						
	var annotations = graph.annotations();
	events.forEach(function (event){
		var x = convert(event.date);
		var annotation = {
			series : "Participants",
			x : event.date.getTime(),
			shortText : "",
			text : event.title,
			cssClass: "icon-flag event-annotation",
			tickHeight:0
		};
		
		annotations.push(annotation);
		console.log("Added "+annotation+" x="+x);
	});
	graph.setAnnotations(annotations);
	
	//Display tooltip of chart with Bootstrap Tooltips
	$('#canvaschart *[title]').tooltip();
	
	var audiences = events.map(function (event){ return event.audience });
	$('#medparticipants').text(options.Math.median(audiences));
	$('#maxparticipants').text(Math.max.apply( Math, audiences));
	$('#minparticipants').text(Math.min.apply( Math, audiences));
	$('#avgparticipants').text(options.Math.avg(audiences));
}
options.onRequestReceived = function(request, sender, sendResponse){
	if (request.action == "eventUpdated"){
		console.log("Received an update on event values");
		setTimeout(options.restore,10);
	}
	sendResponse();
}

options.init = function(){
	jugevents.indexedDB.onOpen = options.loadEvents;
	jugevents.indexedDB.open();
	$('*[rel="tooltip"]').tooltip();
	options.restore(true);

	options.addClickListener('#saveButton', options.save);
	options.addClickListener('#updatestatsbutton', options.refreshEvents);
	
	chrome.extension.onMessage.addListener(options.onRequestReceived);
}

options.addClickListener = function(selector, listener){
	var component = document.querySelector(selector);
	if(component){
		component.addEventListener('click',listener);
	}
}

document.addEventListener('DOMContentLoaded', options.init);
 
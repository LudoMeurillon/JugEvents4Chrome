jugevents = {};

jugevents.Math = {};	

jugevents.Math.median = function (values) {
	values.sort( function(a,b) {return a - b;} );
	var half = Math.floor(values.length/2);
	if(values.length % 2)
		return values[half];
	else
		return (values[half-1] + values[half]) / 2.0;
}

jugevents.Math.avg = function (values) {
	var sum = 0;
	values.forEach(function(v){sum=sum+v});
	return Math.round(sum/values.length);
}

jugevents.http = {};
jugevents.http.jugevents_ROOT_URL = "http://www.jugevents.org/jugevents/event/";
jugevents.http.SHOW_PARTICIPANTS_URL = jugevents.http.jugevents_ROOT_URL+"showParticipants.html?id=";

jugevents.localStorage={};
jugevents.localStorage.jugnameid 	= "event.jugname";
jugevents.localStorage.eventid 	= "event.id";
jugevents.localStorage.incrits 	= "event.inscrits";
jugevents.localStorage.title 		= "event.title";
jugevents.localStorage.desc 		= "event.desc";

jugevents.showAndHide = function(selector, timeout, message){
	$(selector).html("");
	$(selector).show();
	if(message){
		$(selector).html(message);
	}
	if(timeout != 0){
		setTimeout(function(){ $(selector).fadeOut() }, timeout);
	}
}

jugevents.store = function (storageid, input){
	var value = $("#"+input).val();
	jugevents.storeValue(storageid, value);
}

jugevents.storeValue = function(storageid, value){
	localStorage[storageid]=value;
	console.log("stored "+value+" into localStorage['"+storageid+"']");
} 

jugevents.autoFollow = function(jugName){
    var url = jugevents.http.jugevents_ROOT_URL+"search.form?continent=&country=&jugName="+jugName+"&pastEvents=true&_pastEvents=on&orderByDate=desc"
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


jugevents.save = function(){
	jugevents.store(jugevents.localStorage.jugnameid,'jugName');
	jugevents.showAndHide('#saved', 2000, "Options saved !");

	setTimeout(function (){
		chrome.extension.sendMessage(
			{action: "optionsSaved"}, 
			function(response) {
				console.log("call to background.js done");
			}
		);
	},10);
	if($("#jugName").val()){
		jugevents.refreshEvents();
	}
	setTimeout(function(){
		jugevents.autoFollow(localStorage[jugevents.localStorage.jugnameid]);
	}, 10);
}

jugevents.restore = function(initFields){
	var eventid = localStorage[jugevents.localStorage.eventid];
	if(initFields){
		$('#id').val(eventid);
	}
	if(eventid){
		$('#detailsEvent').show();
		$('#details').attr("href",jugevents.http.jugevents_ROOT_URL+eventid);
		$('#participants').attr("href",jugevents.http.SHOW_PARTICIPANTS_URL+eventid);
	}else{
		$('#detailsEvent').hide();
	}
	
	var jugName = localStorage[jugevents.localStorage.jugnameid];
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
	
	var nbParticipants = localStorage[jugevents.localStorage.incrits];
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
	
	var title = localStorage[jugevents.localStorage.title];
	console.log("Found title="+title+" in localStorage");
	if(title){
		$('#eventtitle').text(title);
		$('#detailsAuthor').text(jugName);
		$('#detailsTitle').text(title);
		$('#detailsDesc').popover('destroy');
		$('#detailsDesc').popover({placement:'bottom', html:true, trigger:'hover', title:title, content:localStorage[jugevents.localStorage.desc]});
	}else{
		$('#eventtitle').text("");
	}
}

jugevents.refreshEvents = function(){
	setTimeout(function(){
		$('#updatestatsbutton').button('loading');
		/*
		var eventsUrls = jugevents_ROOT_URL+"json.html?jugName="+jugname+"&pastEvents=true&order=desc";
		*/
		var jugname = localStorage[jugevents.localStorage.jugnameid];
		if(jugname != "undefined" && jugname != ""){
			var eventsXMLUrl = jugevents.http.jugevents_ROOT_URL+"search.form?d-148316-p=2&6578706f7274=1&orderByDate=asc&_pastEvents=on&d-148316-e=3&pastEvents=true&jugName="+jugname;
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
			  if (xhr.readyState == 4) {
				if(xhr.responseXML){
					var events = xhr.responseXML.getElementsByTagName('row');
					//$('#chart').hide();
					
					var nbEvents = events.length;
					
					jugeventsdb.indexedDB.deleteEventsAndThen(function(){
						for (i = 0; i < nbEvents; i++) {
							var eventRow = events[i];
							
							//Select different fonction for last element (need for asynchronous refresh)
							if(i == events.length-1){
								var addEvent = jugevents.addLastEvent;
							}else{
								var addEvent = jugevents.addEvent;
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
								+ "<button type=\"button\" class=\"close\" data-dismiss=\"alert\">�</button>" 
								+ "<h4 class=\"alert-heading\">Mise � jour impossible</h4>"
								+ "Une erreur est survenue lors de la mise � jour des donn�es pour le ["
								+ jugname
								+"] peut �tre le JUG se nomme-t-il autrement sur jugevents ?"
								+ "</div>"
					
					jugevents.showAndHide('#errorPanel', 0, alert);
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

jugevents.addLastEvent = function(date, title, nb){
	jugeventsdb.indexedDB.addEvent(date, title, nb, function(){
		console.log("Refreshing chart");
		$('#updatestatsbutton').button('reset');
		jugevents.loadEvents();
	});
}

jugevents.addEvent = function(date, title, nb){
	jugeventsdb.indexedDB.addEvent(date, title, nb);
}

jugevents.loadEvents = function(){
	var events =[];
	
	jugeventsdb.indexedDB.foreachEvents(
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
			jugevents.drawChart(events);
		}
	);
}

jugevents.drawChart = function(events){
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
			text : event.title + " ("+event.audience+" registered)",
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
	$('#medparticipants').text(jugevents.Math.median(audiences));
	$('#maxparticipants').text(Math.max.apply( Math, audiences));
	$('#minparticipants').text(Math.min.apply( Math, audiences));
	$('#avgparticipants').text(jugevents.Math.avg(audiences));
}
jugevents.onRequestReceived = function(request, sender, sendResponse){
	if (request.action == "eventUpdated"){
		console.log("Received an update on event values");
		setTimeout(jugevents.restore,10);
	}
	sendResponse();
}

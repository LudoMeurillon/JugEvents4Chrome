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
	return "N/A";
}

options.http = {};
options.http.JUGEVENTS_ROOT_URL = "http://www.jugevents.org/jugevents/event/";
options.http.SHOW_PARTICIPANTS_URL = options.http.JUGEVENTS_ROOT_URL+"showParticipants.html?id=";

options.localStorage={};
options.localStorage.jugnameid = "event.jugname";
options.localStorage.eventid = "event.id";
options.localStorage.incrits = "event.inscrits";
options.localStorage.title = "event.title";

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
	localStorage[storageid]=value;
	console.log("stored "+value+" into localStorage['"+storageid+"']");
}

options.save = function(){
	options.store(options.localStorage.eventid,'id');
	options.store(options.localStorage.jugnameid,'jugName');
	chrome.extension.sendRequest({action: "update"}, function(response) {
	  console.log("call to background.js done");
	});
	options.restore();
	options.showAndHide('#saved', 2000, "Options saved !");
}

options.restore = function(){
	var eventid = localStorage[options.localStorage.eventid];
	var text = $('#id').val(eventid);
	if(eventid){
		$('#event').show();
		$('#details').attr("href",options.http.JUGEVENTS_ROOT_URL+eventid);
		$('#participants').attr("href",options.http.SHOW_PARTICIPANTS_URLSHOW_PARTICIPANTS_URL+eventid);
	}else{
		$('#event').hide();
	}
	
	var jugName = localStorage[options.localStorage.jugnameid];
	$('#jugName').val(jugName);
	if(jugName && jugName.trim() != ""){
		$('#stats').show();
		$('#updatestatsbutton').removeClass('disabled');
	}else{
		$('#updatestatsbutton').addClass('disabled');
	}
	
	var nbParticipants = localStorage[options.localStorage.incrits];
	if(nbParticipants){
		$('#nbparticipants').show();
		$('#nbparticipants').text(nbParticipants);
	}else{
		$('#nbparticipants').hide();
	}
	
	var title = localStorage[options.localStorage.title];
	if(title){
		$('#eventtitle').text(title);
	}else{
		$('#eventtitle').text("");
	}
}

options.refreshEvents = function(){
	setTimeout(function(){
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
					$('#chart').hide();
					$('#progressModal').modal();
					
					var progressStep = 100 / events.length;
					$('#progressbar').width("0%");
					
					var nbEvents = events.length;
					
					jugevents.indexedDB.deleteEventsAndThen(function(){
						for (i = 0; i < nbEvents; i++) {
							var eventRow = events[i];
							
							//Select different fonction for last element (need for asynchronous refresh)
							if(i == events.length-1){
								var addEvent = options.addEventAndRefresh;
							}else{
								var addEvent = options.addEvent;
							}
							
							if(eventRow.childNodes){
								var title = eventRow.childNodes[3].childNodes[0].nodeValue.trim();
								var startDate = eventRow.childNodes[5].childNodes[0].nodeValue.trim();
								var nbParticipants = parseInt(eventRow.childNodes[7].childNodes[0].nodeValue.trim());
								console.log("addind event : title = "+title+" date = "+startDate+", nb="+nbParticipants);
								addEvent(startDate, title, nbParticipants, progressStep);
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
					console.error("No XML found for "+jugname);
				}
			  }
			}
			xhr.open("GET", eventsXMLUrl, false);	
			xhr.send();
		}
	},10);
}

options.progress = function(increment){
	var progresstest = document.getElementById('progressbar');
	var widthtext = progresstest.style.width;
	var width = parseInt(widthtext.replace('%',''));
	progresstest.style.width=(width+Math.round(increment))+"%";
}

options.addEventAndRefresh = function(date, title, nb, increment){
	jugevents.indexedDB.addEvent(date, title, nb, function(){
		options.progress(increment);
		console.log("Refreshing chart");
		$('#progressModal').modal('hide');
		options.loadEvents();
	});
}

options.addEvent = function(date, title, nb, increment){
	jugevents.indexedDB.addEvent(date, title, nb, function(){
		options.progress(increment);
	});
}

options.loadEvents = function(){
	var data = new google.visualization.DataTable();
	data.addColumn('date', 'Date');	
	data.addColumn('number', 'Participants');
	data.addColumn('string', 'title1');
	data.addColumn('string', 'text1');
	var nbParticipantsValues =[];
	
	jugevents.indexedDB.foreachEvents(
		function (event){
			var dateFields = event.date.split('/');
			var relativeYearText = dateFields[2];
			var year 	= parseInt(relativeYearText,10)+2000;
			var month 	= dateFields[1];
			var day 	= dateFields[0];
			var date 	= new Date(year, month, day);
			console.debug("Translated "+event.date+" to "+date+" with values relativeYear="+relativeYearText+" year="+year+" month="+month+" day="+day);
			nbParticipantsValues.push(event.nbParticipants);
			data.addRows([
				[date, event.nbParticipants, event.title, event.title]
			]);
		}, 
		function(){
			options.drawChart(data,nbParticipantsValues);
		}
	);
}

options.drawChart = function(chartdata, values){
	$('#medparticipants').text(options.Math.median(values));
	$('#maxparticipants').text(Math.max.apply( Math, values));
	$('#minparticipants').text(Math.min.apply( Math, values));
	$('#avgparticipants').text(options.Math.avg(values));
	$('#chart').show();
	var chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
	chart.draw(chartdata, {'colors': ['green'], fill:30, displayAnnotations: true, displayZoomButtons:false});
}

options.onLoad = function(){
	jugevents.indexedDB.onOpen = options.loadEvents;
	jugevents.indexedDB.open();
	$('*[rel="tooltip"]').tooltip();
	$('.modal').modal('hide');
	options.restore();
}

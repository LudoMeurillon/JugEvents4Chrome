var options = {
	init : function(){
		jugevents.subscribe(jugevents.eventsLoaded, options.drawChart);
		jugevents.subscribe(jugevents.eventsLoading, options.eventsLoading);
		jugevents.subscribe(jugevents.eventsLoadFailed, options.eventsLoadFailed);
		jugevents.subscribe(jugevents.eventsStored, options.eventsStored);
	
		jugeventsdb.indexedDB.open(jugevents.loadEvents);
		$('*[rel="tooltip"]').tooltip();
		
		jugeventsdb.indexedDB.onOpenJUGs = function(){
			var jugsNames = [];
			jugeventsdb.indexedDB.foreachJUGs(function(jug){
				jugsNames.push(jug.name);
			},
			function(){
				$('#jugName').typeahead({source:jugsNames});	
			});
		};
		jugeventsdb.indexedDB.openJUGs();
		
		
		jugevents.restore(true);

		options.addClickListener("#showParticipantTips", options.showTips);
		options.addClickListener('#saveButton', jugevents.save);
		options.addClickListener('#updatestatsbutton', jugevents.refreshEvents);
		
		chrome.extension.onMessage.addListener(jugevents.onRequestReceived);
	},
	
	
	eventsLoading : function(){
		$('#updatestatsbutton').button('loading');
	},
	
	eventsLoadFailed : function(e, jugName){
		var alert = "<div class=\"alert alert-error\">"
					+ "<button type=\"button\" class=\"close\" data-dismiss=\"alert\">×</button>" 
					+ "<h4 class=\"alert-heading\">Can't update</h4>"
					+ "An error occured during data update ["
					+ jugname
					+"] maybe jug name is different on jugevents.org ?"
					+ "</div>"
		
		jugevents.showAndHide('#errorPanel', 0, alert);
		$('#updatestatsbutton').button('reset');
	},
	
	eventsStored : function(){
		$('#updatestatsbutton').button('reset');
	},

	addClickListener : function(selector, listener){
		var component = document.querySelector(selector);
		if(component){
			component.addEventListener('click',listener);
		}
	},
	
	drawChart : function(e, events){
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
	},
	
	showTips : function(){
		$("#nbParticipantsJugLeader").modal();
	}
}

document.addEventListener('DOMContentLoaded', options.init);



var jugeventpopup = {

	init : function(){	
		//jugevents.subscribe(jugevents.eventsLoaded, jugeventpopup.drawChart);
		
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
		chrome.extension.onMessage.addListener(jugevents.onRequestReceived);
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
	}
}

document.addEventListener('DOMContentLoaded', jugeventpopup.init);
 
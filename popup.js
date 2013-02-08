var jugeventpopup = {

	init : function(){	
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
	}
}

document.addEventListener('DOMContentLoaded', jugeventpopup.init);
 
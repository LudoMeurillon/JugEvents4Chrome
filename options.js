var options = {
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

		options.addClickListener('#saveButton', jugevents.save);
		options.addClickListener('#updatestatsbutton', jugevents.refreshEvents);
		
		chrome.extension.onMessage.addListener(jugevents.onRequestReceived);
	},
	addClickListener : function(selector, listener){
		var component = document.querySelector(selector);
		if(component){
			component.addEventListener('click',listener);
		}
	}
}

document.addEventListener('DOMContentLoaded', options.init);
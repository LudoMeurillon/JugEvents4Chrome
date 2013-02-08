var indexedDB = window.webkitIndexedDB;
window.IDBTransaction = window.webkitIDBTransaction;
window.IDBKeyRange = window.webkitIDBKeyRange;

var jugeventsdb = {
	version : "2.0",	
	
	db : {
		events :{
			name: "events",
			store : "event"
		},
		jugs : { 
			name: "jugs", 
			store:"jug"
		}
	},
	
	indexedDB : {

		events : null,
		jugs : null,
		
		onerror : function(e){
			console.log(e);
		},
		
		/* Open JUGs Database */
		openJUGs : function() {
			var request = indexedDB.open(jugeventsdb.db.jugs.name, jugeventsdb.version);
			request.onupgradeneeded = function (e) {
				db = e.target.result;
				if (!db.objectStoreNames.contains(jugeventsdb.db.jug.store)) {
					console.log('Create objectstore');
					db.createObjectStore(jugeventsdb.db.jug.store, {keyPath: "name"});
				}
			};

			request.onsuccess = function(e) {
				jugeventsdb.indexedDB.jugs = e.target.result;
				if(jugeventsdb.indexedDB.onOpenJUGs){
					jugeventsdb.indexedDB.onOpenJUGs();
				}
			};

			request.onerror = jugeventsdb.indexedDB.onerror;
		},
		
		/* Open Events database */
		open : function(onOpen) {
			var request = indexedDB.open(jugeventsdb.db.events.name, jugeventsdb.version);
			request.onupgradeneeded = function (e) {
				db = e.target.result;
				if (!db.objectStoreNames.contains(jugeventsdb.db.events.store)) {
					console.log('Create objectstore');
					db.createObjectStore(jugeventsdb.db.events.store, {keyPath: "date"});
				}
			};

			request.onsuccess = function(e) {
				jugeventsdb.indexedDB.events = e.target.result;
				var db = jugeventsdb.indexedDB.events;
				if(onOpen){
					onOpen();
				}
			};

			request.onerror = jugeventsdb.indexedDB.onerror;
		},
		
		deleteEventsAndThen : function(then) {
			var db = jugeventsdb.indexedDB.events;
			var trans = db.transaction([jugeventsdb.db.events.store], "readwrite");
			var store = trans.objectStore(jugeventsdb.db.events.store);
			var request = store.clear();
			
			// onsuccess is the only place we can create Object Stores
			request.onerror = jugeventsdb.indexedDB.onerror;
			request.onsuccess = function(e) {
				then();
			};
		},
		
		addJug : function(name, desc, coordinates, onsuccess) {
			var db = jugeventsdb.indexedDB.jugs;
			var trans = db.transaction([jugeventsdb.db.jugs.store], "readwrite");
			var store = trans.objectStore(jugeventsdb.db.jugs.store);

			var data = {"name": name, "desc": desc, "coordinates": coordinates};

			var request = store.put(data);
			request.onsuccess = onsuccess;

			request.onerror = function(e) {
				console.log("Error Adding: ", e);
			};
		},
		
		addEvent : function(date, title, audience, onsuccess) {
			var db = jugeventsdb.indexedDB.events;
			var trans = db.transaction([jugeventsdb.db.events.store], "readwrite");
			var store = trans.objectStore(jugeventsdb.db.events.store);

			var data = {"date": date, "title": title, "nbParticipants": audience};

			var request = store.put(data);

			request.onsuccess = onsuccess;

			request.onerror = function(e) {
				console.log("Error Adding: ", e);
			};
		},
		
		foreach : function(db, storename, doSomething, onFinished){
			var trans = db.transaction([storename], "readwrite");
			var store = trans.objectStore(storename);

			// Get everything in the store;
			var keyRange = IDBKeyRange.lowerBound(0);
			var cursorRequest = store.openCursor(keyRange);

			cursorRequest.onsuccess = function(e) {
				var result = e.target.result;
				if(!!result == false){
					onFinished();
					return;
				}

				doSomething(result.value);
				result.continue();
			};

			cursorRequest.onerror = jugeventsdb.indexedDB.onerror;
		},
		
		foreachJUGs : function(doSomething, onFinished) {
			jugeventsdb.indexedDB.foreach(jugeventsdb.indexedDB.jugs, jugeventsdb.db.jugs.store,  doSomething, onFinished);
		},
		
		foreachEvents : function(doSomething, onFinished) {
			jugeventsdb.indexedDB.foreach(jugeventsdb.indexedDB.events, jugeventsdb.db.events.store,  doSomething, onFinished);
			
		}
	}		
};
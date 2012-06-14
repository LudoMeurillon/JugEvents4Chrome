var jugevents = {};
var indexedDB = window.webkitIndexedDB;
window.IDBTransaction = window.webkitIDBTransaction;
window.IDBKeyRange = window.webkitIDBKeyRange;

jugevents.version = "1.0";
jugevents.dbname = "events";
jugevents.storename = "event";
jugevents.indexedDB = {};
jugevents.indexedDB.db = null;

jugevents.indexedDB.onerror = function(e) {
  console.log(e);
};

jugevents.indexedDB.recreateStore = function(){
	var db = jugevents.indexedDB.db;
	if(db.objectStoreNames.contains(jugevents.storename)) {
        db.deleteObjectStore(jugevents.storename);
    }

    var store = db.createObjectStore(jugevents.storename,{keyPath: "date"});
}

jugevents.indexedDB.open = function() {
  var request = indexedDB.open(jugevents.dbname);

  request.onsuccess = function(e) {
    jugevents.indexedDB.db = e.target.result;
    var db = jugevents.indexedDB.db;
    // We can only create Object stores in a setVersion transaction;
    if (jugevents.version != db.version) {
      var setVrequest = db.setVersion(jugevents.version);

      // onsuccess is the only place we can create Object Stores
      setVrequest.onerror = jugevents.indexedDB.onerror;
      setVrequest.onsuccess = function(e) {
        jugevents.indexedDB.recreateStore();
      };
    }
    
	if(jugevents.indexedDB.onOpen){
		jugevents.indexedDB.onOpen();
	}
  };

  request.onerror = jugevents.indexedDB.onerror;
}

jugevents.indexedDB.deleteEventsAndThen = function(then) {
	var db = jugevents.indexedDB.db;
	// We can only create Object stores in a setVersion transaction;
	var request = db.setVersion(jugevents.version);
	
	// onsuccess is the only place we can create Object Stores
	request.onerror = jugevents.indexedDB.onerror;
	request.onsuccess = function(e) {
		jugevents.indexedDB.recreateStore();
		then();
	};
	request.onerror = jugevents.indexedDB.onerror;
}

jugevents.indexedDB.addEvent = function(date, title, audience, onsuccess) {
  var db = jugevents.indexedDB.db;
  var trans = db.transaction([jugevents.storename], "readwrite");
  var store = trans.objectStore(jugevents.storename);

  var data = {"date": date, "title": title, "nbParticipants": audience};

  var request = store.put(data);

  request.onsuccess = onsuccess;

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
  };
};

jugevents.indexedDB.foreachEvents = function(doSomething, after) {
  var db = jugevents.indexedDB.db;
  var trans = db.transaction([jugevents.storename], "readwrite");
  var store = trans.objectStore(jugevents.storename);

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false){
		console.log("result == false");
		after();
        return;
	}

    doSomething(result.value);
    result.continue();
  };

  cursorRequest.onerror = jugevents.indexedDB.onerror;
};

function init() {
  jugevents.indexedDB.open();
}

//window.addEventListener("DOMContentLoaded", init, false);
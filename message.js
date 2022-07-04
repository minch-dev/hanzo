function nothing(){
	//nothing!
}
var bro = chrome || browser;

//just execute whatever part of the extension told you to execute
bro.runtime.onMessage.addListener(
	function(request, sender, callback) {
		if(typeof this[request.action] === 'function'){
			this[request.action](request.params,callback);
		}
		callback(); //needed for buggy chrome to shut up
	}
);
function message(action,params,callback){
	if(typeof callback !== 'function'){
		callback = nothing;
	}
	if(typeof params === 'undefined'){
		params = {};
	}
	bro.runtime.sendMessage({action:action,params:params},function(response){
		if (bro.runtime.lastError) { //needed for bro to shut up
			console.log('establishing extension connections');
		} else {
			callback(response);
		}
	});
}
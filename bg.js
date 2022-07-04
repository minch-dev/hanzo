//teh service workers - because initialisation every minute or so is for teh performance and twice the memory occupied is for teh safety of your battery's life
//oh and don't even get me started on IndexedDB's performance VS a ready to use object loaded in memory
importScripts("kanjidic2.js","message.js");

function dictionary(params,callback){
	callback(kanjidic2[params.string] || null);
}

if(!厶) var 厶 = function(){}; //入兦厶囚囜𡆢
const config0 = { childList: true, subtree: true, attributes: false, characterData:false };
const config1 = { childList: true, subtree: false, attributes: false, characterData:false };
const MutationObserver = window.MutationObserver;
var idb;
const idb_open = indexedDB.open('translation',1);
//initialising the db's
//cache key: ja|en|克服切
//usage key: ja|克服切
idb_open.onerror = function(event) {
  // Handle errors.
};
idb_open.onupgradeneeded = function(event) {
  idb = event.target.result;
  idb.createObjectStore("cache");
  idb.createObjectStore("usage");
};

idb_open.onsuccess = function(event) {
	idb = event.target.result;
	idb.onerror = function(event) {
		console.log("cache idb error: " + event.target.errorCode);
	};
};

const db = function(store){
	return idb.transaction([store], 'readwrite').objectStore(store);
}

const onElementInserted = function(containerSelector, elementSelector, callback) {
    var onMutationsObserved = function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
				if(node.matches && node.matches(elementSelector)){
					callback(node);
				}
			});
        });
    };
    var target = document.querySelector(containerSelector);
    var observer = new MutationObserver(onMutationsObserved);
    observer.observe(target, config0);
}
const onWordInserted = function(line, callback) {
    var onMutationsObserved = function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
				if(node.nodeType == Node.TEXT_NODE){
					callback(node);
				}
			});
        });
    };
    var observer = new MutationObserver(onMutationsObserved);
    observer.observe(line, config1);
}
const fetch_get_raw = function(uri,callback,times){
	if(typeof(times) === 'undefined') times = 0;
	const xhr = new XMLHttpRequest();
	xhr.open('GET', uri);
	xhr.onloadend = function(event) {
		if (event.loaded && xhr.response) {
			if (xhr.status === 200) {
				callback(xhr.responseText);
			} else if (xhr.status === 404){
				logger('\n 404 \n');
				callback(null);
			} else if (xhr.status === 429){
				logger('\n Too many requests... :( \n');
				callback(429);
			} else {
				times++;
				if(times<1){
					setTimeout(fetch_get_raw,1000,uri,callback,times);
					console.log("LOADING AGAIN GET "+xhr.status);
				} else {
					callback(null);
				}
			}
		} else {
			callback(null);
		}
	}
	xhr.send();
}

var sl = 'ja';
var tl = 'ru';
var hl = 'en-US';
var base_gtx_url = 'https://translate.googleapis.com/translate_a/single?client=gtx';

const fetch_gtx_translation = function(txt,callback){
	
	var tk_str = generate_token_for(txt);
	var request_url = base_gtx_url+'&sl='+sl+'&tl='+tl+'&hl='+hl+'&dt=t&dt=bd&dj=1&source=bubble'+tk_str+'&q='+encodeURIComponent(txt);
	//request_url += '&dt=at&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=sos&dt=ss';
	request_url += '&dt=rm';	//translit/pronunciation
	request_url += '&dt=at';	//alternative_translations
	fetch_get_raw(request_url,function(json){
		//console.log(json);
		json = JSON.parse(json);
		//console.log(json);
		callback(json);
	})
}
const obtain_translation = function(txt,callback,online){
	if(typeof(online) === 'undefined') var online = true;
	txt = clean_text(txt);
	var cache_key = sl+'|'+tl+'|'+txt;
	var usage_key = txt;
	db('cache').get(cache_key).onsuccess = function(event) {
		var json = event.target.result;
		var usage = db('usage');
		//console.log(json);
		usage.get(usage_key).onsuccess = function(event) {
			var usage_count = event.target.result;
			if(usage_count === undefined){
				usage_count = 0;
			}
			//console.log(usage_count);
			usage.put(usage_count+1,usage_key).onsuccess = function(event) {
				if(json === undefined && online){
					fetch_gtx_translation(txt,function(json){
						//console.log('online:',json);
						db('cache').put(json,cache_key).onsuccess = function(event) {
							callback(json);
						};
					});
				} else {
					//console.log('cached:',json);
					callback(json);
				}
			};
		}
	};
}
const romaji_katakana= function(txt){
	return txt;
}
const romaji_hiragana= function(txt){
	return txt;
}
const clean_text = function(txt){
	txt = txt.trim();
	return txt;
}
const cut_kanji = function(txt,callback){
	//console.log(txt);
	var comp = 厶.composition[txt];
	var cuts = [];
	if(comp){
		for(var c=0;c<comp.length;c++){
			cuts.push(Array.from(comp[c]));
		}
	} else {
		cuts.push(Array.from(txt));  //in case we don't have a composition
	}
	console.log(cuts);
	callback(cuts);
}
const break_phrase = function(txt,callback){
	//just simple break this time
	//later we'll need to differentiate kanji from kana and other stuff
	txt = clean_text(txt);
	console.log(txt);
	if(txt.length>0){
		if(txt.length>1){
			//phrase
			callback([Array.from(txt)]); //[['単','戈']]
		} else {
			//single kanji
			cut_kanji(txt,callback);
		}
	} else callback('');
}
const create_node = function(parent,tag){
	return parent.appendChild(document.createElement(tag));
}
const create_text = function(parent,data){
	return parent.appendChild(document.createTextNode(data));
}
const create_tooltip = function(tooltip,json){
	if(typeof(json) === 'undefined') return;
	var original = create_node(tooltip,'original');
	break_phrase(json.sentences[0].orig,function(kanji){
		for(var k=0;k<kanji.length;k++){
			for(var kk=0;kk<kanji[k].length;kk++){
				create_text(original,kanji[k][kk]);
			}
		}
		if(kanji.length > 0){
			wrap_line(original);
		}
		create_text(create_node(tooltip,'meaning'),json.sentences[0].trans);
		create_text(create_node(tooltip,'pronunciation'),json.sentences[1].src_translit);
		//html += '<alternative>'+json.alternative_translations[0].alternative.+'</alternative>';
		//html += '<hiragana>'+pronunciation+'</hiragana>';
		//html += '<katakana>'+pronunciation+'</katakana>';
	});

}
const word_hover = function(event){
	var tr = event.target.parentNode.getElementsByTagName('info')[0];
	if(tr.children.length  ==  0){
		//console.log(event.target.innerText);
		obtain_translation(event.target.innerText,function(json){
			if(json) create_tooltip(tr,json);
		},false);
	}
}
const word_click = function(event){
	event.stopPropagation();
	var tr = event.target.parentNode.getElementsByTagName('info')[0];
	if(tr.children.length  ==  0){
		obtain_translation(event.target.innerText,function(json){
			if(json) create_tooltip(tr,json);
		});
	}
}
const word_down = function(event){
	event.stopPropagation();
}
const info_hover = function(event){

}
const info_click = function(event){
	event.stopPropagation();
}
const info_down = function(event){
	event.stopPropagation();
}
const info_drag = function(event){
	event.stopPropagation();
}
const info_selection = function(event){
	event.stopPropagation();
}
const info_move = function(event){
	event.stopPropagation();
}
const disable_propaganda = function(node){
    const events = ["dblclick", "mousedown", "contextmenu",  "mouseenter", "mouseleave", "mousemove",
        "mouseout", "mouseup", "keydown", "keypress", "keyup", "blur", "change", "focus", "focusin",
        "focusout", "input", "invalid", "reset", "search", "select", "submit", "drag", "dragend", "dragenter",
        "dragleave", "dragover", "dragstart", "drop", "copy", "cut", "paste", "mousewheel", "wheel", "touchcancel",
        "touchend", "touchmove", "touchstart"]; //"click", "mouseover", 

    const stop = function(event){
        event.stopPropagation();
    };

    for (let i = 0, l = events.length; i < l; i++) {
        node.addEventListener(events[i], stop, true);
    }
	
}
const wrap_word = function(node){
	var txt = clean_text(node.nodeValue);
	//っ ッ　。・「」゛゜
	//っ ッ shouldn't be the last
	//。・「」゛゜ should be separate elements
	var wrap = document.createElement("wrap");
	disable_propaganda(wrap);
	var word = document.createElement("word");
	var info = document.createElement("info");
	word.onmouseover = word_hover;
	word.onmousedown = word_down;
	word.onclick = word_click;
	//info.onmouseover = info_hover;
	//info.onmousedown = info_down;
	//info.onmousemove = info_move;
	//info.onclick = info_click;
	//info.ondrag = info_drag;
	//info.onselectionchange  = info_selection;
	node.parentNode.insertBefore(wrap, node);
	wrap.appendChild(word);
	wrap.appendChild(info);
	word.appendChild(node);
}
const wrap_sub = function(node){
	//console.log(node.parentNode); //word by word
	var parent = node.parentNode;
	if(parent.matches('.ytp-caption-segment')){
		wrap_word(node);
	}
}
const wrap_line = function(line){
	line.childNodes.forEach(function(word) {
		if(word.nodeType == Node.TEXT_NODE){
			wrap_word(word);
		}
	});
}
onElementInserted('body', '.caption-window', function(win) {
	document.querySelectorAll('.ytp-caption-segment').forEach(function(line) {
		wrap_line(line);
		onWordInserted(line, function(word) {
			wrap_sub(word);
		});
	});
	onElementInserted('.caption-window', '.ytp-caption-segment', function(line) {
		wrap_line(line);
		onWordInserted(line, function(word) {
			wrap_sub(word);
		});
	});
});
//google's  generator
var salt = null;
const constant = function(a) {
	return function() {
	  return a
	}
};
const cypher = function(num, char_list) {
  for (var c = 0; c < char_list.length - 2; c += 3) {
	var d = char_list.charAt(c + 2);
	d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d);
	d = "+" == char_list.charAt(c + 1) ? num >>> d : num << d;
	num = "+" == char_list.charAt(c) ? num + d & 4294967295 : num ^ d
  }
  return num
};
const generate_token_for = function(str) {
  //debugger;
  if (null !== salt) var s = salt;
  else {
	s = constant(String.fromCharCode(84));
	var token_string = constant(String.fromCharCode(75));
	s = [s(), s()];
	s[1] = token_string();
	s = (salt = window[s.join(token_string())] || "") || "";
  }
  var param_name = constant(String.fromCharCode(116));
  token_string = constant(String.fromCharCode(107));
  param_name = [param_name(), param_name()];
  param_name[1] = token_string();
  token_string = "&" + param_name.join("") +
	"=";
  param_name = s.split(".");
  s = Number(param_name[0]) || 0;
  for (var seq = [], f = 0, g = 0; g < str.length; g++) {
	var c = str.charCodeAt(g);
	128 > c ? seq[f++] = c : (2048 > c ? seq[f++] = c >> 6 | 192 : (55296 == (c & 64512) && g + 1 < str.length && 56320 == (str.charCodeAt(g + 1) & 64512) ? (c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++g) & 1023), seq[f++] = c >> 18 | 240, seq[f++] = c >> 12 & 63 | 128) : seq[f++] = c >> 12 | 224, seq[f++] = c >> 6 & 63 | 128), seq[f++] = c & 63 | 128)
  }
  str = s;
  for (f = 0; f < seq.length; f++) str += seq[f], str = cypher(str, "+-a^+6");
  str = cypher(str, "+-3^+b+-f");
  str ^= Number(param_name[1]) || 0;
  0 > str && (str = (str & 2147483647) + 2147483648);
  str %= 1E6;

  return token_string + (str.toString() + "." +
	(str ^ s))
};


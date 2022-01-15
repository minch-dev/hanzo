/*
cd /D tools
(npm install xml2js)
node kanjidic_to_json.js
*/

const xml2js = require('xml2js');
const fs = require('fs');
fs.readFile('edict/kanjidic2.xml','utf8',function(error,xml_string){
	if(error) return console.log(error);
	//console.log(xml_string.length);
	xml2js.parseString(xml_string, {explicitArray:true,strict:false,normalizeTags:true}, function(error,obj) {
		if(error) return console.log(error);
		var chunk = 500;
		var step = 0;
		var dict = {};
		var dict_raw = obj.kanjidic2.character;
		for(var k=0;k<dict_raw.length;k++){
			step = k/chunk;
			if(Number.isInteger(step)){
				console.log(k+' entries done');
			}
			var entry = dict_raw[k];
			var kanji = entry.literal;
			if(!dict[kanji]){
				dict[kanji] = {};
			}
			if(entry.radical){
				//codepoint
				if(entry.codepoint){
					if(!dict[kanji].codepoint){
						dict[kanji].codepoint = {};
					}
					var cp_value = entry.codepoint[0].cp_value;
					for(var r=0;r<cp_value.length;r++){
						dict[kanji].codepoint[cp_value[r]['$'].CP_TYPE] = cp_value[r]['_'];
					}
				}
				
				//radical
				if(entry.radical){
					if(!dict[kanji].radical){
						dict[kanji].radical = {};
					}
					var rad_value = entry.radical[0].rad_value;
					for(var r=0;r<rad_value.length;r++){
						dict[kanji].radical[rad_value[r]['$'].RAD_TYPE] = rad_value[r]['_'];
					}
				}
				//misc
				if(entry.misc){
					if(!dict[kanji].misc){
						dict[kanji].misc = {};
					}
					var misc = entry.misc[0];
					if(misc.grade) dict[kanji].misc.grade = misc.grade[0];
					if(misc.stroke_count) dict[kanji].misc.stroke_count = misc.stroke_count[0];
					if(misc.freq) dict[kanji].misc.freq = misc.freq[0];
					if(misc.jlpt) dict[kanji].misc.jlpt = misc.jlpt[0];
					if(misc.rad_name){
						dict[kanji].misc.rad_name = misc.rad_name.join(';');
					}
					if(misc.variant){
						var variant = misc.variant;
						if(!dict[kanji].misc.variant){
							dict[kanji].misc.variant = {};
						}
						
						for(var r=0;r<variant.length;r++){
							dict[kanji].misc.variant[variant[r]['$'].VAR_TYPE] = variant[r]['_'];
						}
					}
				}
				
				//dic_number
				if(entry.dic_number){
					if(!dict[kanji].dic_number){
						dict[kanji].dic_number = {};
					}
					var dic_number = entry.dic_number[0].dic_ref;
					for(var r=0;r<dic_number.length;r++){
						var dr_val = dic_number[r]['$'];
						var dr_type = dr_val.DR_TYPE;
						if(dr_type == 'moro'){
							//can be 0, we exclude that
							if(dic_number[r]['_'] != 0){
								dict[kanji].dic_number[dr_type] = dic_number[r]['_'];
								if(dr_val.M_VOL){
									dict[kanji].dic_number[dr_type] += ';'+dr_val.M_VOL;
								}
								if(dr_val.M_PAGE){
									dict[kanji].dic_number[dr_type] += ';'+dr_val.M_PAGE;
								}
								
							}
						} else {
							dict[kanji].dic_number[dr_type] = dic_number[r]['_'];
						}
					}
				}
				
				//query_code
				if(entry.query_code){
					if(!dict[kanji].query_code){
						dict[kanji].query_code = {};
					}
					var query_code = entry.query_code[0].q_code;
					for(var r=0;r<query_code.length;r++){
						var qc_val = query_code[r]['$'];
						var qc_type = qc_val.QC_TYPE;
						if(qc_type == 'skip'){
							if(!dict[kanji].query_code.skip){
								dict[kanji].query_code.skip = {};
							}
							qc_type = qc_val.SKIP_MISCLASS || "correct";
							if(dict[kanji].query_code.skip[qc_type]){
								dict[kanji].query_code.skip[qc_type] += ';'+query_code[r]['_'];
							} else {
								dict[kanji].query_code.skip[qc_type] = query_code[r]['_'];
							}
							
						} else {
							dict[kanji].query_code[qc_type] = query_code[r]['_'];
						}
					}
				}
				
				if(entry.reading_meaning){
					//nanori
					var nanori = entry.reading_meaning[0].nanori;
					if(nanori){
						dict[kanji].nanori = nanori.join(';');
					}
					
					
					//reading_meaning
					//to do
					var rmgroup = entry.reading_meaning[0].rmgroup;
					if(rmgroup){
						rmgroup = rmgroup[0];
						if(rmgroup.reading){
							if(!dict[kanji].reading){
								dict[kanji].reading = {};
								for(var r=0;r<rmgroup.reading.length;r++){
									var r_type = rmgroup.reading[r].$.R_TYPE;
									if(dict[kanji].reading[r_type]){
										dict[kanji].reading[r_type] += ';'+rmgroup.reading[r]['_'];
									} else {
										dict[kanji].reading[r_type] = rmgroup.reading[r]['_'];
									}
								}
							}
							
						}
						if(rmgroup.meaning){
							if(!dict[kanji].meaning){
								dict[kanji].meaning = {};
								for(var r=0;r<rmgroup.meaning.length;r++){
									if(typeof rmgroup.meaning[r] === 'object'){
										m_lang = rmgroup.meaning[r].$.M_LANG;
										m_value = rmgroup.meaning[r]['_'];
									} else {
										m_lang = 'en';
										m_value = rmgroup.meaning[r];
									}
									if(dict[kanji].meaning[m_lang]){
										dict[kanji].meaning[m_lang] += ';'+m_value;
									} else {
										dict[kanji].meaning[m_lang] = m_value;
									}
								}
							}
							
						}
					}
					
					
				}
				
				
			}
		}
		const json_string = JSON.stringify(dict);
		//const json_string = JSON.stringify(dict_raw);
		//console.log(obj.kanjidic2.header);
		fs.writeFile('../kanjidic2.json', json_string, function (error) {
			if(error) return console.log(error);
			console.log('JOB WELL DONE');
		});
	});
});
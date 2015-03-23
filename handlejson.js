//i use this script manually to generate emotions.json, script not included in store version of vKappa



var twitchEmotesAPI = "https://twitchemotes.com/api_cache/v2/global.json";
var twitchEmotesSubAPI = "https://twitchemotes.com/api_cache/v2/subscriber.json";
var obj =  {
	defaultTwitch: {},
	subTwitch: {}
	}
var twitchChannels = ["lirik", "sodapoppin", "nightblue3", "imaqtpie", "trick2g", "witwix", "nl_kripp", "amazhs", "forsenlol",  "uselessmouth", "thetydyshtv", "igromania", "gufovicky", "gnumme", "morphia666", "etozhemad", "khovanskytoday"];

$.getJSON(twitchEmotesAPI, function(data){
	var emotions = data.emotes;
	$.getJSON(twitchEmotesSubAPI, function(subData){
		for (var keyword in emotions){
			obj.defaultTwitch[keyword] = {
				"id": emotions[keyword].image_id
			}
		}

		for (var i = 0; i<twitchChannels.length; i++){
			var t = twitchChannels[i];
			var subEmotions = subData.channels;
			var whatever = subEmotions[t].emotes;
			obj.subTwitch[t] = (emotes = {});
			obj.subTwitch[t].emotes = (emo = []);

			for (var KW in whatever){
				obj.subTwitch[t].emotes.push({
					"name": whatever[KW].code,
					"id": whatever[KW].image_id
				});
			}
		}

	var data = JSON.stringify(obj);
	//console.log(data);
	//createURL();
	function createURL(){
		$.ajax({
			url: "https://api.myjson.com/bins",
			type: "POST",
			data: data,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				var json = JSON.stringify(data);
				console.log(json);
			}
		});
	}

	});

});

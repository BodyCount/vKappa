var pathToEmotions = chrome.extension.getURL('emotions/');
var pathToIcons = chrome.extension.getURL('icons/');

var recentEmotions = [];
var recentEmotionsCompare= [];

//chrome.storage.sync.clear();
var elementsCount = 0;
var clickCount = 1;
var visited = false;
var emotes = new Array();

var listeningClasses = ['im_msg_text', 'im_editable', 'dialogs_msg_text', 'wall_reply_text', 'wall_post_text', 'fc_msg'];

//parsing emotes json
var xhr = new XMLHttpRequest();
var twitchEmotes = pathToEmotions + "emotions.json";
xhr.open('GET', twitchEmotes);
xhr.send();
xhr.onload = function() {
  var data = JSON.parse(xhr.responseText);
	var emotions = data.defaultTwitch;
	var subEmotions = data.subTwitch;
	var subEmotionsArray = new Array();

  for (var subKeyWord in subEmotions) //pushing channels names into array
		subEmotionsArray.push(subKeyWord);

  get_emotes();
  emotionsUI(emotions, subEmotions, subEmotionsArray);//sending all info about emotes to create emotes window in dialogs

  function get_emotes(){
    for (var keyWord in emotions) //for every usual twitch emote
      emotes[keyWord] = {name:keyWord, id:emotions[keyWord].id};// replace keyword with image

      for (var z = 0; z<subEmotionsArray.length; z++){ //for every sub twitch emote
        var s = subEmotionsArray[z];
        var e = subEmotions[s].emotes;
        for (var y = 0; y<e.length; y++)
          emotes[e[y].name] = {name:e[y].name, id:e[y].id}
      }
    doReplace();
  }

}

function doReplace(){
  static_replace(); //static replace works only after page load
  dynamic_replace();//dynamic replace works with new dom elements
}

function static_replace(){
  for (var l = 0; l<listeningClasses.length; l++){
    var element = document.getElementsByClassName(listeningClasses[l]);
    var length = element.length;
    if (element){
      for (var i = 0; i<length; i++){
        for (key in emotes){  //for every  twitch emote
          if ((wordInString(element[i], key)) === true) //if we found emote keyword  in text
            replaceEmotions(element[i]);// replace keyword with image
        }
      }
    }
  }
}

function dynamic_replace(){
  for (var i = 0; i<listeningClasses.length; i++){ //for every class where we replace emotes
    document.arrive(('.'+listeningClasses[i]), function(event){ // arrive - little lib to help with Mutation observers coz im lazy
      var elem = this;
      for (key in emotes){
        if ((wordInString(elem, key)) === true)
          replaceEmotions(elem);
      }
    });
  }
}

function wordInString(s, word){
  var pureS = s.innerHTML;
  var check = new RegExp(word + '\\b', 'm').test(pureS);
  if (check === true)
    return true;
  return false;
}

function replaceEmotions(element){
  var img = "<img class='vKappaEmotion' ename='"+key+"'src='https://static-cdn.jtvnw.net/emoticons/v1/"+emotes[key].id+"/1.0'>";
  var tempRegEx = new RegExp(key+"\\b", "g");
  element.innerHTML = element.innerHTML.replace(tempRegEx, img);
}

function emotionsUI(emotions, subEmotions, subEmotionsArray){
var currentEmotionPosition;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	var currentUrl = request.data.url;
	sendResponse({response: "got it"});

	var idPattern = /(?:sel)=(\d.+)\s*/;
	var idConversationPattern = /(?:sel)=c(.+)\s*/
	var urlPattern = /https?:\/\/vk.com\/.[im][?]([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
	var ignoreNumbersPattern = /(\.)(.*)$/m;

	if (currentUrl.match(idPattern)){
		var currentPageID = currentUrl.match(idPattern)[1];
		var chatboxClass = $('#im_editable'+currentPageID);
	}

	if (currentUrl.match(idConversationPattern)){
		var currentPageID = currentUrl.match(idConversationPattern)[1];
		var chatboxClass = $('#im_editable20000000'+currentPageID);
	}

	var currentPageUrl = currentUrl.match(urlPattern);
	var emotionsPosition = $('#im_peer_holders');
	var value = 0;

	if (currentPageUrl == currentUrl)
		insertEmotions(currentPageID);

	if ((currentPageID != null) && (visited === false )) { // fixing scroll bug
		$('html, body').animate({scrollTop: $(document).height()}, 'fast');
		visited = true;
	}

	function insertEmotions(pageID){
		if (currentEmotionPosition !=null){
			$('.emotionsHub').remove();
		}
		var emotionHTMLLook = "<div class='emotionsHub'>"+
									"<img src='https://s.jtvnw.net/jtv_user_pictures/hosted_images/GlitchIcon_purple.png' style='width:25px;height:25px'></img>"+
										"<div class='emotionsContainer'>"+
											"<div class='tab'>"+
												"<div id='recentEmotions' class='tab-content'></div>"+
												"<div id='allEmotions' class='tab-content'></div>"+
												"<div id='subEmotions' class='tab-content'><ul class ='subSection'></ul></div>"+
											"</div>"+
											"<ul class='tabs-menu'>"+
												"<li class='current'><a href='#recentEmotions'><img src='"+pathToIcons+"recent.png"+"'></img></a></li>"+
												"<li><a href='#allEmotions'><img src='"+pathToIcons+"all.png"+"'></img></a></li>"+
												"<li><a href='#subEmotions'> <img src='"+pathToIcons+"sub.png"+"'></img></a></li>"+
											"</ul>"+
										"</div>"+
								    "</div>";
		currentEmotionPosition = emotionsPosition.after(emotionHTMLLook);
		appendEmotionsToContainer();
		appendRecentToContainer();
	}

	function appendEmotionsToContainer(){
		var allEmotionsContainer = $('#allEmotions');
		var subEmotionsContainer = $('.tab-content .subSection');

		for (var keyWord in emotions){
			allEmotionsContainer.append("<div class='col' id="+keyWord+"><img src='https://static-cdn.jtvnw.net/emoticons/v1/"+emotions[keyWord].id+"/1.0'></img></div>");
			elementToClick(keyWord);
			createRecent(keyWord,emotions[keyWord].id);
		}
		for (var subKeyWord in subEmotions){
			subEmotionsContainer.append("<li value='"+value+"'><a href ='#"+subKeyWord+"'>"+subKeyWord+"</a></li><div id='"+subKeyWord+"' class='subSectionContent'></div>");
			value++;
		}

		for (var i = 0; i<subEmotionsArray.length; i++){
			var s = subEmotionsArray[i];
			var e = subEmotions[s].emotes;
			for (var y = 0; y<e.length; y++){
				$('#'+s).append("<div class='col' id="+e[y].name+"><img src='https://static-cdn.jtvnw.net/emoticons/v1/"+e[y].id+"/1.0'></img></div>");
				elementToClick(e[y].name);
				createRecent(e[y].name, e[y].id);
			}
		}
	}

	function appendRecentToContainer(){
		chrome.storage.sync.get(null, function(result){
			if (result.storedRecentEmotions != null){
				chrome.storage.sync.set({ "storedElementsCount": sElementsCount});
				var sRecentEmotions = result.storedRecentEmotions;
				var sElementsCount = result.storedElementsCount;
				sRecentEmotions.sort(function(a,b) {
					return parseFloat(b.key) - parseFloat(a.key)
				});
				for (var i = 0; i < sRecentEmotions.length; i++){
					var KeyWord = sRecentEmotions[i].key;
					var cleanKeyWord = KeyWord.match(ignoreNumbersPattern)[2];
					var img = sRecentEmotions[i].value;
					$('#recentEmotions').append("<div class='col' id="+cleanKeyWord+"><img src='https://static-cdn.jtvnw.net/emoticons/v1/"+img+"/1.0'></img></div>");
					elementToClick(cleanKeyWord);
				}
			}
		});
	}

	function createRecent(elt, image){
		var recentKey = elementsCount+"."+elt;
		$('#'+elt).click(function(){
			chrome.storage.sync.get(null, function(result){
				var storedRecentEmotions = result.storedRecentEmotions;
				var storedElementsCount = result.storedElementsCount;
				var recentKeyNew = storedElementsCount+"."+elt;
				var simpleKey = recentKey.match(ignoreNumbersPattern)[2];
				var containerLimit = 25;
				if (storedRecentEmotions != null){
					for (var i = 0; i < storedRecentEmotions.length; i++){
						var KeyWord = storedRecentEmotions[i].key;
						var cleanKeyWord = KeyWord.match(ignoreNumbersPattern)[2];
						recentEmotionsCompare.push(cleanKeyWord);
					}
					var positionInArray = $.inArray(simpleKey, recentEmotionsCompare);
					if (positionInArray === -1){
						recentEmotionsCompare = [];
						storedElementsCount++;
						if (storedElementsCount>containerLimit){
							recentKeyNew = storedElementsCount+"."+elt;
							storedRecentEmotions.splice(0, 1);
							storedRecentEmotions.push({
								key: recentKeyNew,
								value: image
							});
							chrome.storage.sync.set({"storedRecentEmotions": storedRecentEmotions, "storedElementsCount": storedElementsCount});
						} else {
							storedRecentEmotions.push({
								key: recentKeyNew,
								value: image
							});
							chrome.storage.sync.set({"storedRecentEmotions": storedRecentEmotions, "storedElementsCount": storedElementsCount});
						}
					}
					appendRecentToContainer();
				} else {
					recentEmotions.push({
							key: recentKey,
							value: image
					});
					recentEmotionsCompare.push(simpleKey);
					elementsCount++;
					chrome.storage.sync.set({"storedRecentEmotions": recentEmotions, "storedElementsCount": elementsCount});
					appendRecentToContainer();
				}
			});
		$('#recentEmotions').empty();
		});
	}

	function elementToClick(element){
		$('#'+element).click(function(){
			$('.input_back_wrap').css('display', 'none');
			chatboxClass.append(element+' ');
		});
	}

	$('.emotionsHub').hover(
	function () {
		$(this).css('cursor', 'pointer');
		$(this).find("div.emotionsContainer").stop(true,false).delay('50').fadeIn();
	},
	function () {
		$(this).find("div.emotionsContainer").delay('250').fadeOut();
	});

	$('.tabs-menu li').click(function(e) {
		e.preventDefault();
		$(this).addClass("current");
		$(this).siblings().removeClass("current");
		var tab = $(this).find('a').attr("href");
		$(".tab-content").not(tab).css("display", "none");
		$(tab).fadeIn();
	});

	$('.tab-content .subSection li').click(function(e) {
		e.preventDefault();
		var element = $(this).find('a').attr("href");
		if (($(this).attr("class"))=== "current"){
			$(this).removeClass("current");
			$(element).stop().fadeTo(300,0, function() {$(this).hide()});
		} else {
			var v = $(this).val();
			var position = v * 25;
			$(this).addClass("current");
			$(this).siblings().removeClass("current");

			$(".subSectionContent").not(element).css("display", "none");
			$(element).stop().show().fadeTo(300,1);
			$('.tab-content').animate({
				scrollTop: position
			}, 'slow');
		}
	});

	$('.tab-content').bind( 'mousewheel DOMMouseScroll', function (e) {
		var e0 = e.originalEvent,
		delta = e0.wheelDelta || -e0.detail;
		this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
		e.preventDefault();

	});

});
}

emotionInfo('.vKappaEmotion');
emotionInfo('.col');

function emotionInfo(selector){
	$(document).on('mouseenter', selector, function(){
		var y = $(this).height();
		var p = $(this).position();
		if (selector === '.vKappaEmotion'){
			var eN = $(this).attr("ename");
			var x = $(this).width()/2;
			var t = p.top+y;
			var l = p.left+x;
		} else {
			var eN = $(this).attr("id");
			var x = $(this).width();
			var t = p.top+48;
			var l = p.left+25;
		}
		$(this).after("<div class='eInfo' style='position:absolute; top:"+t+"px; left:"+l+"px;'>" + eN + "</div>");
		$('.eInfo').delay(500).queue(function(){
			var temp = ($(this).width()/2)+5;
			$(this).css("margin-left", "-"+temp+"px");
			$(this).css("display","inline-block").dequeue();
		});
	});

	$(document).on('mouseleave', selector, function(){
		$('.eInfo').remove();
	});
}

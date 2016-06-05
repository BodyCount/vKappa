"use strict";

var pathToIcons = chrome.extension.getURL('icons/')
	, pathToOptions = chrome.extension.getURL("options/");

var emotes = {"global" : {}, "sub" : {}, "bttv" : {}}; // only emotes (global+sub+bttv)

var channels = new Array() //channels with emotes for ui
	, _channels = new Array(); // list of channels without emotes

var selectedChannels = new Array() // user selected channels with emotes
	, _selectedChannels = new Array(); // list of user's channels to show in ui

var favoriteEmotes = new Array()
	, _favoriteEmotes = new Array();

var currentChatbox, selectedStartPage, enableGlobal, enableSub, enableBTTV;

var VERSION;

//chrome.storage.sync.clear();

getOptions();

function getOptions()
{
	chrome.storage.sync.get({"enableAll": config.enableAll, "enableSub": config.enableSub, "enableBTTV": config.enableBTTV, 
													 "favEmotes": config.favEmotes, 
													 "subChannels": config.subChannels, "startPage": config.startPage}, 
	function(items)
	{
		enableGlobal = items.enableAll;
		enableSub = items.enableSub;
		enableBTTV = items.enableBTTV;
		selectedStartPage = items.startPage;
		var _f = items.favEmotes.split(",");
		var _s = items.subChannels.split(",");
		for (var k in _f)
		{
			_f[k] = _f[k].replace(/\s+/g, "");
			_favoriteEmotes.push(_f[k]);
		}

		for (var k in _s)
		{
			_s[k] = _s[k].toLowerCase();
			_s[k] = _s[k].replace(/\s+/g, "");
			_selectedChannels.push(_s[k]);
		}
		init();
	});
}

function init()
{

  if (window.location.host === 'new.vk.com') 
    VERSION = 2; 
  else
    VERSION = 1;

  console.log('Init vKappa for vk version %s', VERSION);

  var isReady = {
    global: false,
    bttv: false,
    sub: false
  }

  if (enableGlobal)
    getGlobalEmotes(function(err, data)
    {
      if (err) return console.log(err);
      emotes['global'] = data;
      isReady.global = true;
      start();
    });

  if (enableBTTV)
    getBTTVEmotes(function(err, data)
    {
      if (err) return console.log(err);  
      emotes["bttv"] = data;  
      isReady.bttv = true;  
      start();
    });

  if (enableSub)
    getSubEmotes(function(err, data)
    {
      if (err) 
      {
        console.log(err);
        emotes["sub"] = {};
        isReady.sub = true; 
        start();
      }
      else 
      {
        emotes["sub"] = data;
        isReady.sub = true; 
        start();        
      }

    });

  function start()
  {
    if (enableGlobal === isReady.global && enableBTTV === isReady.bttv && enableSub === isReady.sub)
    {

      startReplace();
      emotionInfo('.vkappa_emotion');
      createListOfChannels();
      createListOfFav();

      window.onLoad = createEmotionsUi();
      setInterval(locationChange.bind(null, createEmotionsUi), 1000);
      emotionInfo('.col');     
    }
  }
}

var currentLocation = window.location.search;
function locationChange(callback)
{
  if (window.location.search === currentLocation)
    return;
  currentLocation = window.location.search;
  callback();
}

function getGlobalEmotes(callback)
{
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '//twitchemotes.com/api_cache/v2/global.json', true);
  xhr.send();
  xhr.onreadystatechange = function()
  {
    if (this.readyState != 4) return;
    if (this.status != 200) 
    {
      console.log('xhr error:')
      return console.log(this.status? this.statusText: 'no statusText error')
    }

    try {
      var data = JSON.parse(this.responseText);
    } catch (err) {
      console.log('Ошибка в обработке данных:')
      return callback(err);
    }

    callback(null, data.emotes);
  }

}

function getSubEmotes(callback)
{
  var t = new Object();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "//twitchemotes.com/api_cache/v2/subscriber.json", true);
  xhr.send();
  xhr.onreadystatechange = function()
  {
    if (this.readyState != 4) return;
    if (this.status != 200) 
    {
      console.log('xhr error:')
      return callback(this.status? this.statusText: 'no statusText error');
    }

    try {
      var data = JSON.parse(this.responseText);
    } catch (err) {
      console.log('Ошибка в обработке данных:')
      return callback(err);
    }

    for(var channel in data.channels)
    {
      var c = data.channels[channel];
      channels[channel] = {"title": c.title, "badge": c.badge,  "emotes": c['emotes']};
      var emotions = data.channels[channel]['emotes'];
      for (var e in emotions)
        t[emotions[e].code] = {"code":emotions[e].code, "image_id" : emotions[e].image_id, "channel": c.title}; // saving emotes without channel name to use in replace

      _channels.push(channel);
    }
    callback(null, t);
  }

}

function getBTTVEmotes(callback)
{
	var t = new Object();
  var xhr = new XMLHttpRequest();
  xhr.open('GET','//api.betterttv.net/2/emotes/', true);
  xhr.send();
  xhr.onreadystatechange = function()
  {
    if (this.readyState != 4) return;
    if (this.status != 200) 
    {
      console.log('xhr error:')
      return callback(this.status? this.statusText: 'no statusText error');
    }

    try {
      var data = JSON.parse(this.responseText);
    } catch (err) {
      console.log('Ошибка в обработке данных:')
      return callback(err);
    }

    var e = data.emotes;
    for (var i = 0; i < e.length; i++)
    {
    	var url = "//cdn.betterttv.net/emote/"+e[i].id+"/1x";
    	t[e[i].code] = ({"title": e[i].code, "url": url, "channel": "Better Twitch TV"});
    }
    callback(null, t);
  }

}

function createListOfFav()
{
  for (var f in _favoriteEmotes)
  {
    var emoteId = _favoriteEmotes[f];
    if (emoteId in emotes.global)
    {
      var emote = emotes.global[emoteId];
      favoriteEmotes[emoteId] = emote;
    }
  }
}

function createListOfChannels()
{
  for (var k in _selectedChannels)
    for (var c in _channels)
      if (_selectedChannels[k] === _channels[c])
        selectedChannels[_channels[c]] = channels[_channels[c]];
}

function startReplace()
{
	var l = config.trackingList.length
		, alreadyReplaced = false; 
  for (var i = 0; i<l; i++)
  {
    document.arrive(('.'+config.trackingList[i]), function(event){parseElement(this);}); // using this lib to work with mutation observers in easy way
    
    var elements = document.getElementsByClassName(config.trackingList[i]);
    if (elements.length != 0)
      for (var k in elements)
      	if (elements[k].textContent)
      		parseElement(elements[k]);
  }
}

function parseElement(element)
{
	if (element.nodeType != 3)
	{
		var child = element.firstChild, nextElt;
		while (child)
		{
			parseElement(child);
			nextElt = child.nextSibling;
			child = nextElt;
		}
	}
	else 
		replaceEmotions(element.parentNode);
}

var isValid = (word) => !(word.length < 4);

function replaceEmotions(element)
{
	if(!element.querySelector(".vkappa_emotion"))
	{
			var words = element.innerHTML.split(/\b/)
			, modifiedWords = words
	    , length = words.length, temp;
	  
	  for (var i = 0; i < length; i++)
	  {
	    var word = words[i];

	    if (isValid(word))
			{

	      if (word in emotes.global || word in emotes.sub || word in emotes.bttv)
	      {
	        var emote = emotes.global[word] || emotes.sub[word] || emotes.bttv[word]
	           , img = document.createElement("img"), url;

	        url = emote.url || "//static-cdn.jtvnw.net/emoticons/v1/"+emote.image_id+"/1.0";
	        img.className = "vkappa_emotion";
	        img.setAttribute("emote", word);
	        img.setAttribute("channel", emote.channel)
	        img.src = url

	        temp = document.createElement("div");
	        temp.appendChild(img);
	        modifiedWords.splice(i, 1, temp.innerHTML);
	      }
	    }
		}

		var s = new String();
		length = modifiedWords.length;
		for (var i = 0; i < length; i++)
			s += modifiedWords[i];

		if (s != element.innerHTML)
			element.innerHTML = s;
	}
}

function createEmotionsUi()
{
  var idRegexp = /(?:sel)=(\d.+)\s*/
    , idConvRegexp = /(?:sel)=c(.+)\s*/;

  if (currentLocation.match(idRegexp) || currentLocation.match(idConvRegexp))
  {
    var currentId =  (currentLocation.match(idRegexp))? currentLocation.match(idRegexp)[1] : currentLocation.match(idConvRegexp)[1]
      , chatboxes = document.getElementsByClassName("im_editable")
      , l = chatboxes.length, currentChatboxId, exist = false;

    for (var i = 0; i < l; i++)
      if (chatboxes[i].id.indexOf(currentId) > -1)
        currentChatbox = chatboxes[i];

    if (!document.getElementsByClassName("vkappa_emotions_hub")[0]) // preventing hub duplicate
      createEmotionsHub();
  }
}

function createEmotionsHub()
{
  var emotionsHub, emotionsContainer, twitchIcon, hubLocation, tabsMenu, startPageLi, startPageDiv, tabsContainer, allEmotionsLi;



  emotionsHub = document.createElement("div"), emotionsHub.className = "vkappa_emotions_hub";
  emotionsContainer = document.createElement("div"), emotionsContainer.className = "emotions_container";

  emotionsContainer.innerHTML ="<div class='tabs_container'>"+
                                "<div id='fav_emotions' class='tab_content'></div>"+
                                "<div id='recent_emotions' class='tab_content'></div>"+
                                "<div id='all_emotions' class='tab_content'></div>"+
                                "<div id='sub_emotions' class='tab_content'><ul class='sub_section'></ul></div>"+
                              "</div>"+
                              "<ul class='tabs_menu'>"+
                                "<li><a id='fav_emotions'><img src='"+pathToIcons+"fav.png"+"' style = 'opacity: 0.7'></img></a></li>"+
                                "<li><a id='recent_emotions'><img src='"+pathToIcons+"recent.png"+"' style = 'opacity: 0.7'></img></a></li>"+
                                "<li><a id='all_emotions'><img src='"+pathToIcons+"all.png"+"' style = 'opacity: 0.7'></img></a></li>"+
                                "<li><a id='sub_emotions'> <img src='"+pathToIcons+"sub.png"+"' style = 'opacity: 0.7'></img></a></li>"+
                                "<li id ='options'><a> <img src='"+pathToIcons+"options.png"+"' style = 'opacity: 0.7'></img></a></li>"+
                              "</ul>";

  twitchIcon = document.createElement("img");
  twitchIcon.src = "//s.jtvnw.net/jtv_user_pictures/hosted_images/GlitchIcon_purple.png";
  twitchIcon.style.width = 20+"px";
  twitchIcon.style.height = 20+"px";
  twitchIcon.style.opacity = 0.7;

  emotionsHub.appendChild(twitchIcon);
  emotionsHub.appendChild(emotionsContainer);

  if (VERSION === 2)
  {
    hubLocation = document.getElementsByClassName("im-chat-input--textarea")[0];
    hubLocation.appendChild(emotionsHub);  
    document.getElementsByClassName('vkappa_emotions_hub')[0]
            .setAttribute("style", "position: absolute; margin-left: 94.4%; bottom: 54px;") 
  }

  if (VERSION === 1)
  {
    hubLocation = document.getElementById("im_peer_holders");
    hubLocation.parentNode.appendChild(emotionsHub);
  }

  tabsMenu = document.getElementsByClassName("tabs_menu")[0];
  //set up start page from options
  startPageLi = tabsMenu.querySelectorAll("li")[selectedStartPage];
  startPageLi.className = "current";

  tabsContainer = document.getElementsByClassName("tabs_container")[0];
  startPageDiv = tabsContainer.querySelectorAll("div")[selectedStartPage];
	startPageDiv.setAttribute("style", "display: block; overflow-y: hidden;");
	//

  appendEmotes();
  appendRecent();
  initJqueryEffects();
}

function appendEmotes()
{
  var favEmotionsContainer = document.getElementById("fav_emotions")
    , subEmotionsContainer = document.getElementsByClassName('sub_section')[0], value = 0
    , emote, col, img;

  for (var f in favoriteEmotes)
  {
    emote = favoriteEmotes[f], col = document.createElement("div"), img = document.createElement("img");

    img.id = emote.image_id;
    img.src = "//static-cdn.jtvnw.net/emoticons/v1/"+emote.image_id+"/1.0";

    col.className = "col";
    col.id = f;
    col.appendChild(img);
    col.onclick = onClickHandler;

    favEmotionsContainer.appendChild(col);
  }

  for (var c in selectedChannels)
  {
    var channel = selectedChannels[c]
    	, cHeader = document.createElement("li")
      , cLink = document.createElement("a")
      , subSectionContent = document.createElement("div")
      , channelLogo = document.createElement("img")
      , l = channel.emotes.length;

    channelLogo.src = channel.badge;
    channelLogo.style.width = 13+"px";
    channelLogo.style.height = 13+"px";

    cHeader.value = value;
    cHeader.onclick = loadSubEmotes;
    cHeader.appendChild(channelLogo);
    cLink.appendChild(document.createTextNode(channel.title));

    subSectionContent.id = channel.title;
    subSectionContent.className = "sub_section_content";

    cHeader.appendChild(cLink);
    subEmotionsContainer.appendChild(cHeader);

    subEmotionsContainer.appendChild(subSectionContent);

    value ++;
  }
}

function loadEmotes()
{
	var emote, col, img
		, allEmotionsContainer = document.getElementById("all_emotions");

	allEmotionsContainer.innerHTML = "";
	for (var k in emotes.global)
  {
    emote = emotes.global[k], col = document.createElement("div"), img = document.createElement("img");

    img.id = emote.image_id
    img.src = "//static-cdn.jtvnw.net/emoticons/v1/"+emote.image_id+"/1.0";

    col.className = "col";
    col.id = k;
    col.appendChild(img);
    col.onclick = onClickHandler;

    allEmotionsContainer.appendChild(col);
  }
}

function loadSubEmotes()
{
	var channel = this.childNodes[1].textContent
		, _channel = channel.toLowerCase()
		, emotes = selectedChannels[_channel].emotes
		, l = emotes.length
		, emote, col, img;

	var subSectionContent = document.getElementById(channel);
	subSectionContent.innerHTML = "";
  for (var i = 0; i < l; i++)
  {
  	emote = emotes[i], col = document.createElement("div"), img = document.createElement("img");

  	img.id = emote.image_id;
    img.src = "//static-cdn.jtvnw.net/emoticons/v1/"+emote.image_id+"/1.0";

    col.className = "col";
    col.id = emote.code;
    col.appendChild(img);
    col.onclick = onClickHandler;

    subSectionContent.appendChild(col);
  }
}

function onClickHandler()
{
	spawnEmote(this);
	createRecent(this);
}

function createRecent(that)
{
	var thisEmote = {"emote": that.id, "image_id": that.firstChild.id, "channel": that.parentNode.id}
		, recentEmotionsNode = document.getElementById("recent_emotions")
		, recentEmotions = new Array();
	chrome.storage.sync.get({"recentEmotions":[]}, function(items)
	{
		var limit = 29, alreadyExists = false, storedElements;

		storedElements = items.recentEmotions.length;

		if (storedElements > 0)
		{
			recentEmotions = items.recentEmotions;

			for (var i = 0; i < storedElements; i++)
				if (recentEmotions[i].emote === thisEmote.emote)
					alreadyExists = true;

			if (!alreadyExists)
			{			
				if (storedElements > limit)
					recentEmotions.splice(0, 1);

				recentEmotions.push({"emote": thisEmote.emote, "image_id": thisEmote.image_id, "channel": thisEmote.channel});
				chrome.storage.sync.set({"recentEmotions": recentEmotions});
			}
		} 
		else 
		{
			recentEmotions.push({"emote": thisEmote.emote, "image_id": thisEmote.image_id, "channel": thisEmote.channel});
			chrome.storage.sync.set({"recentEmotions": recentEmotions});
		}
		recentEmotionsNode.innerHTML = "";
		appendRecent();
	});
}

function appendRecent()
{
	chrome.storage.sync.get({"recentEmotions": []}, function(items)
	{
		var storedRecentEmotions = items.recentEmotions
			, length = storedRecentEmotions.length;

		if (length > 0)
		{
			for (var i = length - 1; i >= 0; i--)
			{
				var emote = {"emote": storedRecentEmotions[i].emote, "image_id": storedRecentEmotions[i].image_id, "channel": storedRecentEmotions[i].channel}
					, recentEmotions = document.getElementById("recent_emotions")
					, col = document.createElement("div")
					, img = document.createElement("img");

				img.id = emote.image_id;
				img.src = "//static-cdn.jtvnw.net/emoticons/v1/"+emote.image_id+"/1.0";

				col.className = "col";
				col.id = emote.emote;
				col.setAttribute("channel", emote.channel)
				col.onclick = onClickHandler;
				col.appendChild(img);

				recentEmotions.appendChild(col);
			}
		}
	});
}

function spawnEmote(that)
{
  var inputPlaceholder = (VERSION == '1')?document.getElementsByClassName("input_back_wrap"):document.getElementsByClassName("placeholder")
    , l = inputPlaceholder.length;
  for (var i = 0; i < l; i++)
    inputPlaceholder[i].style.cssText = "display: none;";
  currentChatbox.innerHTML += that.id + " ";
}

function initJqueryEffects() //вероятно, в этой функции написан полный бред
{
  $('.vkappa_emotions_hub').hover(  //show content
  function ()
  {
  	loadEmotes();
    $(this).css('cursor', 'pointer');
    $(this).find("div.emotions_container").stop(true,false).delay('50').fadeIn();
  },
  function ()
  {
    $(this).find("div.emotions_container").delay('250').fadeOut();
  });

  $('.tabs_menu li').click(function(e) { // change active tab
   // e.preventDefault();
    if (this.id === "options")
    	chrome.runtime.sendMessage({msg: "openOptions"});
    else 
    {
	    $(this).addClass("current");
	    $(this).siblings().removeClass("current");
	    var tab = $(this).find('a').attr("id");
	    $(".tab_content").not(tab).css("display", "none");
	    $('#'+tab).fadeIn();
    }
  });

  $('.tab_content .sub_section li').click(function(e) 
  { // show specific sub channel emotes
    e.preventDefault();
    var element = $(this).find('a').html();
    element = '#' + element;
    if (($(this).attr("class")) === "current")
    {
      $(this).removeClass("current");
      $(element).stop().fadeTo(300,0, function() {$(this).hide()});
    } 
    else 
    {
      var v = $(this).val();
      var position = v * 25;
      $(this).addClass("current");
      $(this).siblings().removeClass("current");

      $(".sub_section_content").not(element).css("display", "none");
      $(element).stop().show().fadeTo(300,1);
      $('.tab_content').animate({
        scrollTop: position
      }, 'slow');
    }
  });

	$('.tab_content').bind( 'mousewheel DOMMouseScroll', function (e) 
	{
		var e0 = e.originalEvent,
		delta = e0.wheelDelta || -e0.detail;
		this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
		e.preventDefault();
	});
}

function emotionInfo(selector)
{
	$(document).on('mouseenter', selector, function()
	{
		var y = $(this).height()
			, p = $(this).position();
		if (selector === '.vkappa_emotion')
		{
			var eN = $(this).attr("emote")
				, eC = $(this).attr("channel")
				, x = $(this).width()/2
				, t = p.top+y
				, l = p.left+x;
		} 
		else 
		{
			var eN = $(this).attr("id")
				, eC = $(this).attr("channel")
				, x = $(this).width()
				, t = p.top+52
				, l = p.left+27;
		}
		if (eC && eC != "undefined")
			$(this).after("<div class='e_info' style='position:absolute; top:"+t+"px; left:"+l+"px;'> Channel: "+ eC + "<br/> Emote: " + eN + "</div>");
		else
			$(this).after("<div class='e_info' style='position:absolute; top:"+t+"px; left:"+l+"px;'>"+ eN + "</div>");

		$('.e_info').delay(500).queue(function()
		{
			var temp = ($(this).width()/2)+5;
			$(this).css("margin-left", "-"+temp+"px");
			$(this).css("display","inline-block").dequeue();
		});
	});

	$(document).on('mouseleave', selector, function()
	{
		$('.e_info').remove();
	});
}
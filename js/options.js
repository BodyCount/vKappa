
var storage = chrome.storage.sync;

function saveOptions()
{
	var enableAll = document.getElementById("enable_all").checked
		,	enableSub = document.getElementById("enable_sub").checked
		, enableBTTV = document.getElementById("enable_bttv").checked
		,	favEmotes = document.getElementById("fav_emotes").value
		,	subChannels = document.getElementById("sub_channels").value
		, startPage = document.getElementById("start_page").value


	storage.set({"enableAll": enableAll, "enableSub": enableSub, "enableBTTV": enableBTTV, "favEmotes": favEmotes, "subChannels": subChannels, "startPage": startPage}, function()
	{
	  var status = document.getElementById("status");
	  status.textContent = "Опции сохранены";
	  setTimeout(function() {status.textContent = "";}, 1000);
	});
}

function restoreOptions()
{
	storage.get({"enableAll": "true", "enableSub": true, "enableBTTV": true, "favEmotes": "Kappa, Keepo", "subChannels": "lirik, sodapoppin, nightblue3, imaqtpie, trick2g, witwix, nl_kripp, guit88man, amazhs, forsenlol, manvsgame, monstercat, uselessmouth, thetydyshtv, igromania, morphia666, etozhemad, sliffylol, sjow, happasc2, shaboozey, khovanskytoday, gufovicky, gnumme", 
							"startPage": 0}, 
	function(items)
	{
		document.getElementById("enable_all").checked = items.enableAll;
		document.getElementById("enable_sub").checked = items.enableSub;
		document.getElementById("enable_bttv").checked = items.enableBTTV;
		document.getElementById("fav_emotes").value = items.favEmotes;
		document.getElementById("sub_channels").value = items.subChannels;
		document.getElementById("start_page").value = items.startPage;
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);


document.getElementById("enable_all").addEventListener("click", saveOptions);
document.getElementById("enable_sub").addEventListener("click", saveOptions);
document.getElementById("enable_bttv").addEventListener("click", saveOptions);

document.getElementById("start_page").addEventListener("click", saveOptions);

document.getElementById('fav_emotes').addEventListener('keyup', saveOptions);
document.getElementById('sub_channels').addEventListener('keyup', saveOptions);
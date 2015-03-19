chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
    if(info && info.status === "complete"){
        chrome.tabs.sendMessage(tabId, {data: tab}, function(response) {

        });

    }
});
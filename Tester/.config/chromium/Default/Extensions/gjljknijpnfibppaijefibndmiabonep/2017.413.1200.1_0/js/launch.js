var LAUNCH = (function () {
    
    function _initialize() {
        document.getElementById("title").innerHTML = chrome.i18n.getMessage("system_ready");
        document.getElementById("message").innerHTML = chrome.i18n.getMessage("invite_friend");
        
        document.getElementById("action-button").value = chrome.i18n.getMessage("close");
        document.getElementById('action-button').addEventListener('click', function(){ 
            chrome.runtime.sendMessage({type:'close_window'});
        });
        document.getElementById("copyright").innerHTML = chrome.i18n.getMessage("copyright2") + " | ";
        document.getElementById("legal-information").innerHTML = chrome.i18n.getMessage("legal_information") + " | ";
        document.getElementById("privacy-policy").innerHTML = chrome.i18n.getMessage("privacy_policy");
    }
    
    document.addEventListener('DOMContentLoaded', function () {
        console.log("content loaded");
        _initialize();
    });
    
})();
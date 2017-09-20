var FEEDBACK = (function() {

    var _feedbackDisplay;
    var _starRating = '0';
    var feedback;
    var _commentsText = "";
    var _additionalDetails = [];

    function _onStarRatingSelected() {
        _starRating = ($('input[name=rating]:checked').val());
    }
    
    function _onSendButtonClicked() {
        consoleLog("_onSendButtonClicked");
        
        consoleLog("Star Rating: " + _starRating);
        
        consoleLog("Additional Details: ");
        var checkboxes = document.querySelectorAll('input[name=addDetails]');
        var i;
        _additionalDetails = [];
        for (i = 0; i < checkboxes.length; i++) {
            consoleLog("Value: " + checkboxes[i].value + " " + checkboxes[i].checked);
            if (checkboxes[i].checked) {
                _additionalDetails.push(checkboxes[i].value);
            }
        }
        _commentsText = document.getElementById('commentsTextArea').value;
        consoleLog("Comments : " + _commentsText);
        
        var gadataObj = {};
        gadataObj["category"] = "Feedback";
        gadataObj["action"] = "StarRating";
        gadataObj["label"] = _starRating;
        gadataObj["value"] = 0;
        chrome.runtime.sendMessage({
            type: 'ga_event',
            data: gadataObj
        })
        
        gadataObj["action"] = "Comments";
        gadataObj["label"] = _commentsText;
        chrome.runtime.sendMessage({
            type: 'ga_event',
            data: gadataObj
        })
        
        gadataObj["action"] = "Details";
        for (var i = 0; i < _additionalDetails.length; i++)
        {
            gadataObj["label"] = _additionalDetails[i];
            chrome.runtime.sendMessage({
                type: 'ga_event',
                data: gadataObj
            })
        }
        
        var feedbackdata = {
            "errorupload": false,
            "userrating": parseInt(_starRating),
            "additionaldetails": _additionalDetails,
            "usercomment" : _commentsText,
        };
        
        chrome.runtime.sendMessage({
            type: 'send_user_feedback',
            msg: feedbackdata
        });
            
    }
    
    function _onSkipButtonClicked() {
        consoleLog("_onSkipButtonClicked");
        chrome.runtime.sendMessage({type:'close_window'});
        
    }

    function pShow() {
        _feedbackDisplay.style.visibility = "visible";
        _feedbackDisplay.focus();
    }

    function pHide() {
        _feedbackDisplay.style.visibility = "hidden";
    }

    function pSkip() {
        _onSkipButtonClicked();
    }
        
    function _initialize() {
        _feedbackDisplay = document.getElementById("feedbackDisplay");
        document.getElementById('streamTileText').innerHTML = chrome.i18n.getMessage("stream");
        document.getElementById('streamTileImage').src = "img/btn_co_play_white_120x120.png";
        document.getElementById('streamTileBottomText').innerHTML = chrome.i18n.getMessage("feedback");
        
        document.getElementById('headingText').innerHTML = chrome.i18n.getMessage("rate");
        // Star ratings
        document.getElementById('rating_selection_id').addEventListener('change', _onStarRatingSelected);
        
        // Additional Details
        document.getElementById('addDetailsText_id').innerHTML = chrome.i18n.getMessage("additional_detail");
        
        document.getElementById('label_PoorAudioVideo').innerHTML = chrome.i18n.getMessage("audio_video_quality");
        document.getElementById('label_NetworkConnectionLost').innerHTML = chrome.i18n.getMessage("disconnected");
        document.getElementById('label_LaggyGamePlay').innerHTML = chrome.i18n.getMessage("game_play_laggy");
        document.getElementById('label_VoiceChatNotWorking').innerHTML = chrome.i18n.getMessage("chat_not_working");
        document.getElementById('label_ControllerNotWorking').innerHTML = chrome.i18n.getMessage("controller_not_working");
        
        // Comments
        document.getElementById('commentsTitleText').innerHTML = chrome.i18n.getMessage("comments");
        $("#commentsTextArea").on("mouseover focusin mouseup", function () {
            $(this).focus();
        });
        
        // Buttons
        document.getElementById('send').value = chrome.i18n.getMessage("send");
        document.getElementById('skip').value = chrome.i18n.getMessage("skip");
        document.getElementById('send').addEventListener('click', _onSendButtonClicked);
        document.getElementById('skip').addEventListener('click', _onSkipButtonClicked);
        /*
        $(".feedback_button").on("mouseover focusin", function () {
            $(this).addClass("active");
            $(this).focus();
        });
        $(".feedback_button").on("focusout", function () {
            $(this).removeClass("active");
        });
        */
        
        _feedbackDisplay.style.visibility = "hidden";
    }
    
    document.addEventListener('DOMContentLoaded', function () {
        _initialize();
    });
        
    return {
        show: pShow,
        hide: pHide,
        skip: pSkip
    };
})();
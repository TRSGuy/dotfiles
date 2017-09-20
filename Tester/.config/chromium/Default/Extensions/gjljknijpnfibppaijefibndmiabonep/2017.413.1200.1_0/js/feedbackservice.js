var FEEDBACKSERVICE = (function () {

    var FEEDBACK_PROTOCOL_VERSION = "1.0";
    var FEEDBACK_JSON_DATA_VERSION = "1.1";
    var FEEDBACK_SERVER_URL = config.feedbackserver;
    var FEEDBACK_BODY_LENGTH = (1024 * 1024) + (1024 * 512);  // 1.5MB, when zipped the feedback size will be less than 1MB.

    // Below function is copied from : http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    function generateGuid() {
        var buf = new Uint16Array(8);
        window.crypto.getRandomValues(buf);
        var S4 = function(num) {
        var ret = num.toString(16);
            while(ret.length < 4){
               ret = "0"+ret;
            };
            return ret;
        };
        return (S4(buf[0])+S4(buf[1])+S4(buf[2])+"4"+S4(buf[3]).substring(1)+"y"+S4(buf[4]).substring(1)+S4(buf[5])+S4(buf[6])+S4(buf[7]));
    }

    var _feedbackParams = {
        errorupload : false,
        sessionid: "",
        userrating: 0,
        additionaldetails: [],
        usercomment: "",
        errorcategory: "",
        errorstring: "",
        errorcode: "",
        errordetail: "",
    };
    
    var _systemInfo = {
        cpumodel: "",
        noofprocessors: 0,
        glvendor: "",
        glrenderer: "",
        glversion: "",
    }

    function getJSONData(feedBackData)
    {
        var feedbackParams = {};
        
        // copy all the default feedback paramters to a local variable.
        for(var attrname in _feedbackParams) {
            feedbackParams[attrname] = _feedbackParams[attrname];
        }
        
        // Update the feedback parameters with the input values.
        for( var attrname in feedBackData) {
            feedbackParams[attrname] = feedBackData[attrname];
        }

        var jsonObj = {};

        var currentDateTime = new Date();
        jsonObj["timestamp"] = currentDateTime.toISOString();

        var sourceInfo = {};
        sourceInfo["name"] = "STREAM_CLIENT";
        var manifest = chrome.runtime.getManifest();
        sourceInfo["version"] = manifest.version;

        jsonObj["source"] = sourceInfo;

        jsonObj["sessionID"] = feedbackParams.sessionid;
        jsonObj["isAutomatic"] = feedbackParams.errorupload ? 1 : 0 ;
        
        if( feedbackParams.errorupload ) {
            var errorInfoObject = {};

            if( feedbackParams.errorcode ) {
                errorInfoObject["errorCode"] = feedbackParams.errorcode;
            }

            if( feedbackParams.errorstring ) {
                errorInfoObject["errorString"] = feedbackParams.errorstring;
            }

            if( feedbackParams.errordetail ) {
                errorInfoObject["errorDetail"] = feedbackParams.errordetail;
            }

            jsonObj["category"] = feedbackParams.errorcategory;
            jsonObj["errorInfo"] = errorInfoObject;
        }
        else {
            var userCommentObject = {};
            userCommentObject["rating"] = feedbackParams.userrating;
            userCommentObject["additionalDetail"] = feedbackParams.additionaldetails;
            userCommentObject["message"] = feedbackParams.usercomment;

            jsonObj["category"] = "NA";
            jsonObj["userComment"] = userCommentObject;
        }
        
        
        var cpuInfoObject = {};
        cpuInfoObject["model"] = _systemInfo.cpumodel;
        cpuInfoObject["numberOfProcessors"] = _systemInfo.noofprocessors;
        
        var gpuInfoObject = {};
        gpuInfoObject["vendor"] = _systemInfo.glvendor;
        gpuInfoObject["glRenderer"] = _systemInfo.glrenderer;
        gpuInfoObject["glVersion"] = _systemInfo.glversion;
        
        var chromeSystemInfoObject = {
            cpuInfo: cpuInfoObject,
            gpuInfo: gpuInfoObject
        };
        
        jsonObj["chromeSystemInfo"] = chromeSystemInfoObject;

        return JSON.stringify(jsonObj);
    }

    function pSubmit(feedBackData, callback)
    {
        try {
            var jsonData = getJSONData(feedBackData);
            consoleLog("Feedback JSON data: " + jsonData);
            
            var feedbackHttp;
            feedbackHttp = new XMLHttpRequest();
            feedbackHttp.onreadystatechange = function() {
                if (XMLHttpRequest.DONE == feedbackHttp.readyState)
                {
                    var gaData = {};
                    gaData["category"] = "Feedback";
                    gaData["action"] = feedBackData.errorupload ? "AutomaticUpload" : "UserUpload";
                    gaData["sessionid"] = feedBackData.sessionid;
                    
                    if(200 == feedbackHttp.status)
                    {
                        consoleLog("Successfully uploaded feedback.");
                        gaData["label"] = "Success";
                    }
                    else
                    {
                        consoleLog("Failed to send feedback to the server. Error: "+ feedbackHttp.status + " Server Response: "+ feedbackHttp.responseText);
                        gaData["label"] = "Failure_" + feedbackHttp.status;
                    }
                    
                    GOOGLEANALYTICS.trackEvent(gaData);
                }
            }

            var FEEDBACK_SEPARATOR = generateGuid();

            var httpContent = "--" + FEEDBACK_SEPARATOR + "\r\n";
            httpContent = httpContent + "Content-Type: application/json\r\n";
            httpContent = httpContent + "X-Feedback-Version: " + FEEDBACK_JSON_DATA_VERSION + "\r\n\r\n";
            
            httpContent = httpContent + jsonData + "\r\n";
     
            httpContent = httpContent + "--" + FEEDBACK_SEPARATOR + "\r\n";
            httpContent = httpContent + "Content-Type: text/plain\r\n";
            httpContent = httpContent + "Content-Disposition: attachment; filename=\"" + btoa("StreamClient.log") +"\"\r\n\r\n";
            httpContent = httpContent + LOGGER.getLog(GRIDBACKGROUNDSERVICE.getLogId());
            
            // Trim the feedback data size here since Logger provides 1MB of data but the whole feedback data should not exceed 1MB.
            // Leave space for the ending seperators.
            if( httpContent.length > (FEEDBACK_BODY_LENGTH - 100)) {
                httpContent = httpContent.substring(0, (FEEDBACK_BODY_LENGTH - 100));
            }
            
            httpContent = httpContent + "\r\n--" + FEEDBACK_SEPARATOR + "--" ;

            feedbackHttp.open("POST", FEEDBACK_SERVER_URL, true);
            feedbackHttp.setRequestHeader("Content-Type", "multipart/mixed; boundary=\"" + FEEDBACK_SEPARATOR + "\"");
            feedbackHttp.setRequestHeader("X-Feedback-Protocol", FEEDBACK_PROTOCOL_VERSION);
            feedbackHttp.setRequestHeader("Content-Encoding", "zip");
            
            // Uncommenting the below line causes the server to just verify the data sent and not store it in database.
            //feedbackHttp.setRequestHeader("X-Test-Data-Token", "1");

            var zip = new JSZip();
            zip.file("feedback", httpContent);
            var zipdata = zip.generate({type:'uint8array', compression: 'deflate'});

            feedbackHttp.send(zipdata.buffer);
        } catch(err) {
            consoleLog("Exception in Feedback.submit: " + err.message);
        }

        if (callback)
            callback();
    }

    function pUpdateSystemInfo(systemInfoArg) {
        for(var attrname in systemInfoArg) {
            if( _systemInfo[attrname] != 'undefined' ){
                _systemInfo[attrname] = systemInfoArg[attrname];
            }
        }
    }
    
    return {
        submit:           pSubmit,            /*!< Sends feedback to the server. */
        updateSystemInfo: pUpdateSystemInfo   /*!< Updates the system information which will be sent to the server.*/
    };

})();

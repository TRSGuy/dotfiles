var GRIDBACKGROUNDSERVICE = (function () {

    /*! \brief Initialize parameters */
    var _initializeParams = {
        serverAddress: "",                     //address of the server
    };

    /*! \brief Cleanup parameters */
    var _cleanupParams = {
        streamingStartTime: "",                //streaming start time
        streamingEndTime: "",                  //streaming end time
        clientUniqueId: "",                    //client unique id
        clientSessionId: "",                   //client session id
        logId: "",                             //log id
    };

    /*! \brief Current controller mapping */
    var _currentControllerMapping = "";

    /*! \brief Controller mapping durations */
    var _controllerMappingDuration = {};

    /*! \brief Round trip delay data */
    var _rtdData = {
        "total" : 0,    //Sum of all the rtd's received
        "count" : 0,    //Count of all the rtd's received
    };

    /*! \brief Round trip delay bucketized data */
    var _rtdBucketData = {};

    // Below two functions are temporarily added here to print the timestamps.
    // As part of refactoring they move will be moved to common file.
    function TwoDigits(x) {
        return (x < 10 ? '0' : '') + x;
    }

    // This function returns the timestamp in the format "Day Month Date HH:MM:SS YYYY"
    // The format is similar to the timestamp format present in the logs received from native client.
    function getTimeStamp() {
        // Append timestamp to the message.
        var days = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
        var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var curDate = new Date();
        var timestamp = days[curDate.getUTCDay()] + " " + months[curDate.getUTCMonth()] + " " + TwoDigits(curDate.getUTCDate()) + " " + TwoDigits(curDate.getUTCHours()) + ":" + TwoDigits(curDate.getUTCMinutes()) + ":" + TwoDigits(curDate.getUTCSeconds()) + " " + curDate.getUTCFullYear();
        return timestamp;
    }

    /*!
     * \brief
     * Initializes the background servicew
     * \param initializeParams - params needed to initialize the background service
     */
    function pInitialize(initializeParams) {
        if(typeof initializeParams == 'undefined') {
            return;
        }

        for (var attrname in _initializeParams) {
            if(typeof initializeParams[attrname] != 'undefined') {
                _initializeParams[attrname] = initializeParams[attrname];
            } else {
                _initializeParams[attrname] = "";
            }
        }

        _currentControllerMapping = "";
        _controllerMappingDuration = {};
        _rtdData = {
            "total" : 0,
            "count" : 0,
        };
        _rtdBucketData = {};
    }

    /*!
     * \brief
     * Tears down the background service
     * This function should be called after streaming window is closed
     * Sends cancel request to the server
     * Sends session duration information to Google Analytics
     * Uploads logs to AWS
     */
    function pCleanup() {
        if(typeof _cleanupParams.streamingStartTime != 'undefined' && _cleanupParams.streamingStartTime != "") {
            if(typeof _cleanupParams.streamingEndTime == 'undefined' || _cleanupParams.streamingEndTime == "") {
                var streamingendtime = new Date();
                _cleanupParams.streamingEndTime = streamingendtime.toString();
                consoleLog("Session end time taken as background script cleanup called time");
            }
            pUpdateControllerMappingDuration("");
        }

        _sendRTDDataToGA();
        _sendSessionDurationToGA();
        _sendControllerMappingDurationToGA();
        _sendCancelRequest();

        // Reset _cleanupParams
        for (var attrname in _cleanupParams) {
            _cleanupParams[attrname] = "";
        }
    }

    /*!
     * \brief
     * Sends cancel request to the server
     */
    function _sendCancelRequest() {

        if((_initializeParams.serverAddress.search("127.0.0.1") < 0)
            && (_initializeParams.serverAddress.search(".nvidia.com") < 0)) {
            consoleLog(getTimeStamp() + " Not sending cancel request to server.");
            LOGGER.uploadLog(_cleanupParams.logId);
            LOGGER.clear(_cleanupParams.logId);
            return;
        }

        var logId = _cleanupParams.logId;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (XMLHttpRequest.DONE == xmlhttp.readyState) {
                if(200 == xmlhttp.status) {
                    console.log(getTimeStamp() + " Sending cancel request done.");
                    LOGGER.append(logId, getTimeStamp() + " Sending cancel request done.");
                } else {
                    console.log(getTimeStamp() + " Sending cancel request failed. " + link + "\n" + xmlhttp.responseText);
                    LOGGER.append(logId, getTimeStamp() + " Sending cancel request failed responseText: " + link + "\n" + xmlhttp.responseText );
                }

                LOGGER.uploadLog(logId);
                LOGGER.clear(logId);
            }
        }

        // If client id is _UNIFIED_CLIENT_ then this is the unified SDK and we need to delete the
        // session a different way.
        if( _cleanupParams.clientUniqueId === "_UNIFIED_CLIENT_" )
        {
            var link = "https://"
                + _initializeParams.serverAddress
                + "/v2/session/"
                + _cleanupParams.clientSessionId;

            xmlhttp.open("DELETE", link, true);
        }
        else
        {
            var link = "https://"
                + _initializeParams.serverAddress.replace("gs://", "").replace("47989", "47984")
                + "/cancel?uniqueid="
                + _cleanupParams.clientUniqueId
                + "&sessionid="
                + _cleanupParams.clientSessionId;

            xmlhttp.open("GET", link, true);
        }
        xmlhttp.send();
    }

    /*!
     * \brief
     * Sends session duration information to Google Analytics
     */
    function _sendSessionDurationToGA() {
        if( _cleanupParams.streamingStartTime == "" || _cleanupParams.streamingEndTime == "") {
            consoleLog(getTimeStamp() + " Session duration information not available.");
            return;
        }

        var sessionDuration = new Date(_cleanupParams.streamingEndTime) - new Date(_cleanupParams.streamingStartTime);
        consoleLog(getTimeStamp() + " Session start time: " + _cleanupParams.streamingStartTime
                    + " Session end time: " + _cleanupParams.streamingEndTime
                    + " Session duration: " + sessionDuration + " ms");

        var obj= {};
        obj["category"] = "Streaming";
        obj["variable"] = "Session Duration";
        obj["value"] = sessionDuration;

        GOOGLEANALYTICS.trackTimingEvent(obj);
    }

    /*!
     * \brief
     * Updates the current controller mapping duration
     * \param newMapping         - new controller mapping used by the client
     */
    function pUpdateControllerMappingDuration(newMapping) {
        if ( typeof newMapping == 'undefined'         ||
             typeof _cleanupParams.streamingStartTime == 'undefined' || _cleanupParams.streamingStartTime == "") {
            consoleLog(getTimeStamp() + " Invalid controller mapping parameters.");
            return;
        } else if(_currentControllerMapping == "") {
            _currentControllerMapping = newMapping;
            _controllerMappingDuration = {};
            return;
        }

        var mappingEndTime = new Date();
        //Take streaming end time as mapping end time for the last controller mapping update
        if(newMapping == "") {
            mappingEndTime = _cleanupParams.streamingEndTime;
        }

        var timeElapsed = 0;
        for(mapping in _controllerMappingDuration) {
            timeElapsed = timeElapsed + _controllerMappingDuration[mapping];
        }
        _controllerMappingDuration[_currentControllerMapping] = (_controllerMappingDuration[_currentControllerMapping] || 0) + (new Date(mappingEndTime) - new Date(_cleanupParams.streamingStartTime)) - timeElapsed;
        _currentControllerMapping = newMapping;
    }

    /*!
     * \brief
     * Sends controller mapping duration information to Google Analytics
     */
    function _sendControllerMappingDurationToGA() {
        var gadataObj = {};
        gadataObj["category"] = "Streaming";

        for(mapping in _controllerMappingDuration) {
            gadataObj["variable"] = mapping;
            gadataObj["value"] = _controllerMappingDuration[mapping];

            GOOGLEANALYTICS.trackTimingEvent(gadataObj);
        }
    }

    /*!
     * \brief
     * Updates RTD data
     * \param rtdMs - Round Trip Delay in MS
     */
    function pUpdateRTD(rtdMs) {
        if ( typeof rtdMs == 'undefined') {
            consoleLog(getTimeStamp() + " Invalid RTD");
            return;
        }

        _rtdData.total += rtdMs;
        _rtdData.count += 1;

        //Bucketize the RTD data as follows:
        //For RTD <= 200 make buckets of 20.
        //For RTD > 200 make buckets of 100.
        //Bucket 20: RTD <= 20
        //Bucket 40: 20 < RTD <= 40
        //...
        //Bucket 200: 180 < RTD <= 200
        //Bucket 300: 200 < RTD <= 300
        //Bucket 400: 300 < RTD <= 400
        //...
        var bucket = 0;
        if(rtdMs <= 200) {
            bucket = Math.floor(rtdMs/20)*20 + ((rtdMs%20>0) ? 20 : 0);
        } else {
            bucket = Math.floor(rtdMs/100)*100 + ((rtdMs%100>0) ? 100 : 0);
        }

        if(typeof _rtdBucketData[bucket] == 'undefined') {
            _rtdBucketData[bucket] = 1;
        } else {
            _rtdBucketData[bucket] += 1;
        }
    }

    /*!
     * \brief
     * Sends RTD data to Google Analytics
     */
    function _sendRTDDataToGA() {
        var gadataObj = {};

        //Send RTD bucket data to GA
        gadataObj["category"] = "RTD";
        for(rtd in _rtdBucketData) {
            gadataObj["action"] = rtd;
            gadataObj["label"] = _rtdBucketData[rtd];

            GOOGLEANALYTICS.trackEvent(gadataObj);
        }

        //Send overall RTD average to GA
        if(_rtdData.count > 0) {
            gadataObj = {};
            gadataObj["category"] = "Streaming";
            gadataObj["variable"] = "Average RTD";
            //GA records all timing data < 0.01 secs as 0.01 secs, to avoid loss of data we are multiplying it by 1000.
            gadataObj["value"] = Math.round(_rtdData.total/_rtdData.count*1000);
            GOOGLEANALYTICS.trackTimingEvent(gadataObj);
        }
    }

    function pUpdateCleanupParams(obj) {
        for(var attrname in obj) {
            if( typeof(_cleanupParams[attrname]) != 'undefined' ) {
                _cleanupParams[attrname] = obj[attrname];
            }
        }
    }

    function pInitLogger() {
        _cleanupParams.logId = LOGGER.initialize();
    }

    function pGetLogId() {
        return _cleanupParams.logId;
    }

    function pLog(msg) {
        if(LOGGER.append(_cleanupParams.logId, msg) == false) {
            console.log("Error in LOGGER.append(). Could not append msg: " + msg);
        }
    }

    return {
        initialize:                      pInitialize,                      /*!< Initializes the background service. Should be called before starting the streaming window. */
        initLogger:                      pInitLogger,                      /*!< Initializes the logger. */
        cleanup:                         pCleanup,                         /*!< Tears down the background service. Should be called after streaming window is closed. */
        updateControllerMappingDuration: pUpdateControllerMappingDuration, /*!< Updates the current controller mapping duration. */
        updateRTD:                       pUpdateRTD,                       /*!< Updates RTD data. */
        updateCleanupParams:             pUpdateCleanupParams,             /*!< Updates cleanup params */
        getLogId:                        pGetLogId,                        /*!< Return the current sessions logger id */
        log:                             pLog,                             /*!< Append message to the logger for the current session. */
    };

})();

var sessionid = "";
var logId;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type == 'log') {
        GRIDBACKGROUNDSERVICE.log(request.msg);
    } else if (request.type == 'savelog') {
        sendResponse({type:'totallogs',msg:LOGGER.getLog(GRIDBACKGROUNDSERVICE.getLogId())});
    } else if (request.type == 'init_ga') {
        sessionid = "";
        if (typeof initGA == 'function') {
            initGA();
        }
    } else if (request.type == 'session_termination_params') {
        var cleanupParams = {
            'clientUniqueId' : request["uniqueid"] || request["uniqueId"],
            'clientSessionId' : request["sessionid"] || request["sessionId"],
        };
        sessionid = request["sessionid"] || request["sessionId"];
        GRIDBACKGROUNDSERVICE.updateCleanupParams(cleanupParams);
    } else if(request.type == 'streaming_start_time') {
        var cleanupParams = {
            'streamingStartTime' : request.time,
        };
        GRIDBACKGROUNDSERVICE.updateCleanupParams(cleanupParams);
    } else if(request.type == 'streaming_end_time') {
        var cleanupParams = {
            'streamingEndTime' : request.time,
        };
        GRIDBACKGROUNDSERVICE.updateCleanupParams(cleanupParams);
    } else if(request.type == 'session_id') {
        var customDimensions = {};
        customDimensions.sessionid = request.msg;
        GOOGLEANALYTICS.updateCustomDimension(customDimensions);
    } else if(request.type == 'game_title') {
        var customDimensions = {};
        customDimensions.gametitle = request.msg;
        GOOGLEANALYTICS.updateCustomDimension(customDimensions);
    } else if(request.type == "system_info" || request.type == "ga_custom_dimension") {
        GOOGLEANALYTICS.updateCustomDimension(request.data);
    } else if(request.type == 'ga_event') {
        GOOGLEANALYTICS.trackEvent(request.data);
    } else if(request.type == 'ga_timing_event') {
        GOOGLEANALYTICS.trackTimingEvent(request.data);
    } else if(request.type == 'controller_mapping_changed') {
        GRIDBACKGROUNDSERVICE.updateControllerMappingDuration(request.msg);
    } else if(request.type == 'rtd') {
        GRIDBACKGROUNDSERVICE.updateRTD(request.msg);
    } else if(request.type == 'user_id') {
        var customDimensions = {};
        customDimensions.userid = request.msg;
        GOOGLEANALYTICS.updateCustomDimension(customDimensions);
    }
});

function consoleLog(msg)
{
    console.log(msg);
    GRIDBACKGROUNDSERVICE.log(msg);
}

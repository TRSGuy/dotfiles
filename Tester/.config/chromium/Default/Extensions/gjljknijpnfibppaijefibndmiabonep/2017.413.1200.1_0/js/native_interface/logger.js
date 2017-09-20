var LOGGER = (function () {

    var MAX_LOG_SIZE = 1024 * 1024;   // 1 MB
    var LOG_HEAD_LINES = 200;   // first 200 lines
    var logArray = [];
    var nextLogId = 0;

    function pInitialize() {
        while(typeof logArray[nextLogId] != 'undefined' && typeof logArray[nextLogId].in_use != 'undefined' && logArray[nextLogId].in_use != false) {
            nextLogId++;
        }

        var logId = nextLogId;
        nextLogId++;
        logArray[logId] = {
            in_use        : true,
            cur_log_line  : 0,
            log_body_size : MAX_LOG_SIZE,
            loghead       : "",
            logbody       : "",
        };
        return logId;
    }
    
    /*!
     * \brief
     * Appends data to the log array
     * \param data - params data which should be appended to the log array
     */
    function pAppend(logId, data) {
        if(typeof logId == 'undefined' || typeof logArray[logId] == 'undefined' || typeof logArray[logId].in_use == 'undefined') {
            return false;
        } else if(logArray[logId].in_use == false) {
            pClear(logId);
            logArray[logId].in_use = true;
        }

        if(0 == logArray[logId].cur_log_line) {
            console.log("pAppend: Initializing logger.");
            // Add current date, time, timezone  to the log.
            var x = new Date();
            logArray[logId].logbody += x.toString() + "\n";
            logArray[logId].cur_log_line++;
            console.log("pAppend: Current DateTime : " + x.toString());
        }
        logArray[logId].cur_log_line++;
        logArray[logId].logbody += data + "\n";
        if (LOG_HEAD_LINES == logArray[logId].cur_log_line) {
            logArray[logId].loghead = logArray[logId].logbody;
            logArray[logId].logbody = "";
            logArray[logId].log_body_size = MAX_LOG_SIZE - logArray[logId].loghead.length;
        }
        if (logArray[logId].logbody.length > logArray[logId].log_body_size) {
            logArray[logId].logbody = logArray[logId].logbody.substring(logArray[logId].logbody.length - logArray[logId].log_body_size);
        }
        return true;
    }

    /*!
     * \brief
     * Clears the log array
     */
    function pClear(logId) {
        if(typeof logId == 'undefined' || typeof logArray[logId] == 'undefined' || typeof logArray[logId].in_use == 'undefined') {
            return false;
        }
        logArray[logId].in_use = false;
        logArray[logId].loghead = "";
        logArray[logId].logbody = "";
        logArray[logId].cur_log_line = 0;
        logArray[logId].log_body_size = MAX_LOG_SIZE;
        return true;
    }

    /*!
     * \brief
     * Returns the log
     */
    function pGetLog(logId) { 
        if(typeof logId == 'undefined' || typeof logArray[logId] == 'undefined' || typeof logArray[logId].in_use == 'undefined' || logArray[logId].in_use == false) {
            return "";
        }
        return logArray[logId].loghead + logArray[logId].logbody;
    }

    /*!
     * \brief
     * Uploads log array to AWS
     */
    function pUploadLog(logId) {
        if(typeof logId == 'undefined' || typeof logArray[logId] == 'undefined' || typeof logArray[logId].in_use == 'undefined' || logArray[logId].in_use == false) {
            return false;
        }

        if(0 == logArray[logId].cur_log_line) {
            console.log("pUploadLog: Log array empty. Not uploading it to AWS.");
            return false;
        }

        var xmlhttp;
        xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (XMLHttpRequest.DONE == xmlhttp.readyState) {
                console.log(xmlhttp.responseText);
                if(200 == xmlhttp.status) {
                    console.log("log upload success");
                } else if (400 == xmlhttp.status) {
                    console.log("log upload failed")
                } else {
                    console.log("log upload: something else other than 200 was returned")
                }
            }
        }
        var message = pGetLog(logId);
        xmlhttp.open("PUT", config.logserver, true);
        xmlhttp.setRequestHeader("Content-Type", "text/plain");
        xmlhttp.send(message);
        return true;
    }

    return {
        initialize:    pInitialize,    /*!< Initializes logger and returns the log id. This log id should be passed with any logger function call. */
        append:        pAppend,        /*!< Appends data to the log array. */
        clear:         pClear,         /*!< Clears the log array. */
        getLog:        pGetLog,        /*!< Returns the log array. */
        uploadLog:     pUploadLog,     /*!< Uploads log array to AWS. */
    };

})();

var GOOGLEANALYTICS = (function () {
    var _service = null;
    var _tracker = null;
    
    var _defaultCustomDimensions = {
        userid          : "",
        sessionid       : "",
        networkareatype : "",
        frameCount      : 0,
        gametitle       : "",
        cpumodel        : "",
        noofprocessors  : 0,
        glvendor        : "",
        glrenderer      : "",
        glversion       : "",
        dvschangelist   : "",
        serverversion   : "",
        clientnattype   : "",
        servernattype   : "",
    };
    
    var _customDimensions = {};
    
    // Call this function to record events like errors, warning, etc
    // The input parameter to this function should be in JSON format:
    //   { "category"        : "XXX",
    //     "action"          : "XXX",
    //     "label"           : "XXX",
    //     "value"           : X,
    //     "framecount"      : X,
    //    }
    function pTrackEvent(obj) {
        if(_tracker != null) {
            var value = 0;

            if(obj.value) {
                value = obj.value;
            }
            
            if(obj.framecount) {
                _customDimensions.frameCount = _bucketizeFrameCount(obj.framecount);
            }

            _tracker.send(analytics.EventBuilder.builder()
                            .category(obj.category)
                            .action(obj.action)
                            .label(obj.label)
                            .value(value)
                            .dimension(1, _customDimensions.userid)
                            .dimension(2, _customDimensions.sessionid)
                            .dimension(3, _customDimensions.networkareatype)
                            .dimension(4, _customDimensions.frameCount)
                            .dimension(5, _customDimensions.gametitle)
                            .dimension(6, _customDimensions.cpumodel)
                            .dimension(7, _customDimensions.noofprocessors)
                            .dimension(8, _customDimensions.glvendor)
                            .dimension(9, _customDimensions.glrenderer)
                            .dimension(10, _customDimensions.glversion)
                            .dimension(11, _customDimensions.dvschangelist)
                            .dimension(12, _customDimensions.serverversion)
                            .dimension(13, _customDimensions.clientnattype)
                            .dimension(14, _customDimensions.servernattype)
                            );
        }
    }

    function resetCustomDimensions() {
        _customDimensions = {};
        
        for(var attrname in _defaultCustomDimensions) {
            _customDimensions[attrname] = _defaultCustomDimensions[attrname];
        }
    }
    
    function pInitialize() {
        // reset all the custom dimensions to default value.
        resetCustomDimensions();
        
        _service = analytics.getService(config.analyticsservice);
        if( _service != null ){
            _tracker = _service.getTracker(config.analyticscode);
            if( _tracker != null ){
                _service.getConfig().addCallback(
                    function(config) {
                        config.setTrackingPermitted(true);
                    }
                );
                consoleLog("Successfully initialized Google Analytics.");
                _tracker.sendAppView('StreamingWindow');
            } else {
                consoleLog("Error: GA initialization failed. Could not get tracker for the service.");
            }
        } else {
            consoleLog("Error: GA initialization failed. Could not get analytics service.");
        }
    }

    // The input parameter to this function should be in JSON format:
    //   { "category"        : "XXX",
    //     "value"           : X,
    //     "framecount"      : X,
    //    }
    function pTrackTimingEvent(obj) {
        if(_service != null) {
            // There is no way to send custom dimensions on a single timingEvent hit, so setting it on a local tracker variable.
            var tracker = _service.getTracker(config.analyticscode);
            
            if(obj.framecount) {
                _customDimensions.frameCount = _bucketizeFrameCount(obj.framecount);
            }
            
            tracker.set("dimension1", _customDimensions.userid);
            tracker.set("dimension2", _customDimensions.sessionid);
            tracker.set("dimension3", _customDimensions.networkareatype);
            tracker.set("dimension4", _customDimensions.frameCount);
            tracker.set("dimension5", _customDimensions.gametitle);
            tracker.set("dimension6", _customDimensions.cpumodel);
            tracker.set("dimension7", _customDimensions.noofprocessors);
            tracker.set("dimension8", _customDimensions.glvendor);
            tracker.set("dimension9", _customDimensions.glrenderer);
            tracker.set("dimension10", _customDimensions.glversion);
            tracker.set("dimension11", _customDimensions.dvschangelist);
            tracker.set("dimension12", _customDimensions.serverversion);
            tracker.set("dimension13", _customDimensions.clientnattype);
            tracker.set("dimension14", _customDimensions.servernattype);

            tracker.sendTiming(obj.category, obj.variable, obj.value);
        }
    }
    
    // The input argument to this function should be in JSON format:
    //  { "CustomDimensionA" : "XXX",
    //    "CustomDimensionB" : "YYY"
    //  }
    function pUpdateCustomDimension(obj) {
        for(var attrname in obj) {
            if( typeof(_customDimensions[attrname]) != 'undefined' ) {
                _customDimensions[attrname] = obj[attrname];
            }
        }
    }
    
    function _bucketizeFrameCount(framecount) {
        if(typeof framecount == 'undefined') {
            return -1;
        }
        //Bucketize the framecount data as follows:
        //For framecount <= 3600 make buckets of 300.
        //For framecount > 3600 make a single bucket labelled '> 3600'.
        //
        //Bucket 300:    framecount <= 300
        //Bucket 600:    300 < framecount <= 600
        //...
        //Bucket 3600:   3300 < framecount <= 3600
        //Bucket > 3600: framecount > 3600
        if(framecount <= 3600) {
            return Math.floor(framecount/300)*300 + ((framecount%300>0) ? 300 : 0);
        } else {
            return "> 3600";
        }
    }
    
    return {
        initialize:            pInitialize,
        trackEvent:            pTrackEvent,
        trackTimingEvent:      pTrackTimingEvent,
        updateCustomDimension: pUpdateCustomDimension
    };
})();

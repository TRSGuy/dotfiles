function _WebSocket(isServer, onMessage) {
    this.websocket = null;
    this.isServer = isServer;
    this.socketName = isServer ? "ServerProxyWebSocket" : "WebSocket";
    this.onmessage = onMessage;
    this.open = function(address, sessionid, uniqueid) {
        var wsAddress = address.replace("gs:", "wss:");

        // Proxy server ws connection is formatted differently
        if (this.isServer) {
            wsAddress = wsAddress.replace(":47989", "/server/") + sessionid;
            if (uniqueid)
                wsAddress += "?uniqueid=" + uniqueid;
        } else {
            wsAddress = wsAddress.replace("47989", "47984") + "/upgrade?sessionid=" + sessionid;
            if (uniqueid)
                wsAddress += "&uniqueid=" + uniqueid;
        }

        var sockName = this.socketName;
        if (VERBOSE) consoleLog(sockName + " url=" + wsAddress);
        this.websocket = new WebSocket(wsAddress);
        this.websocket.onmessage = this.onmessage;
        if (!this.onmessage) {
            this.onmessage = function() {
                consoleLog(sockName + ": onMessage");
            };
        }
        this.websocket.onopen = function() {
            consoleLog(sockName + ": Opened");
        };
        this.websocket.onerror = function(event) {
            consoleLog(sockName + ": onerror " + event.data);
        };
        this.websocket.onclose = function(event) {
            consoleLog(sockName + ": close code=" + event.code + " reason=" + event.reason + " clean=" + event.wasClean);
        };
    };

    // Sends data as soon as the connection is available
    this.send = function(str) {
        var thiz = this;
        this._waitForConnection(function() {
            thiz.websocket.send(str);
        }, "Outgoing Message: " + str);
    };

    this.close = function() {
        this.websocket.close();
    };

    this._waitForConnection = function(cb, desc) {
        if (this._tryConnection(cb, desc)) {
            return;
        }

        consoleLog(this.socketName + ": waiting for connection");
        var thiz = this;
        setTimeout(function() {
            if (!thiz._tryConnection(cb, desc)) {
                thiz._waitForConnection(cb, desc);
            }
        }, 50); // wait a bit and try again
    };

    this._tryConnection = function(cb, desc) {
        if (this.websocket.readyState === 1) {
            if (VERBOSE) consoleLog(this.socketName + ": " + desc);
            cb();
        } else if (this.websocket.readyState === 3) {
            consoleLog(this.socketName + ":  " + desc + " could not get connection");
        } else {
            return false;
        }
        return true;
    };
}

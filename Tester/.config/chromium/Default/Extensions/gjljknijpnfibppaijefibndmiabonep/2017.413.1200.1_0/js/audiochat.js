var VERBOSE = false;

var _outSocket;
var _serverSocket;
var _webrtcConnection = null;

var _address = null;
var _sessionid = null;
var _curMicMute = false;
var _curCamMute = false;
var _curRemoteAudioMute = false;

var _ICESERVERS = {"iceServers": [{ "url": "stun:stun.l.google.com:19302" },
               { "url": "stun:stun1.l.google.com:19302" },
               { "url": "stun:stun2.l.google.com:19302" },
               { "url": "stun:stun3.l.google.com:19302" },
               { "url": "stun:stun4.l.google.com:19302" }]};

// Open websockets and call guest
function startCall(address, sessionid, doVideo) {
    _address = address;
    _sessionid = sessionid;
    _webrtcConnection = new _WebrtcP2PConnection(true, _ICESERVERS, _onSendWebRTCData, _onRemoteStream);
    _webrtcConnection.open(doVideo, true);

    // Open up our own server session and listen for messages from the guest
    _initIncomingSocket(address, sessionid + "_host");

    // Open up an outgoing websocket connection to the guest's server session
    _initOutgoingSocket(address, sessionid + "_guest");

    _webrtcConnection.createOffer();
}

// Open websockets and wait for host to call
function listenForCall(address, sessionid) {
    _address = address;
    _sessionid = sessionid;

    _webrtcConnection = new _WebrtcP2PConnection(false, _ICESERVERS, _onSendWebRTCData, _onRemoteStream);

    // Open up our own server session and listen for messages from the host
    _initIncomingSocket(address, sessionid + "_guest");

    // We can't open up our our outgoing socket yet, the host hasn't opened it yet
    // We can't open up the webrtc connection yet, we need to know if host wants
    // audio/video or not
}

function muteMicrophone(mute) {
    _curMicMute = mute;
    if (_webrtcConnection) {
        _webrtcConnection.setMicMute(mute);
    }
}

function muteRemoteAudio(mute) {
    _curRemoteAudioMute = mute;

    var remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo)
        remoteVideo.muted = mute;
}

function muteCamera(mute) {
    _curCamMute = mute;
    if (_webrtcConnection) {
        _webrtcConnection.setCamMute(mute);
    }
}

function hangup() {
    consoleLog("Hangup Call");
    if (_webrtcConnection !== null) {
        _webrtcConnection.hangup();
        _webrtcConnection = null;
    }
    if (_outSocket) {
        _outSocket.close();
        _outSocket = null;
    }
    if (_serverSocket) {
        _serverSocket.close();
        _serverSocket = null;
    }
}

function setVerbose(verbose) {
    VERBOSE = verbose;
}

function _onSendWebRTCData(dataStr) {
    if (_outSocket) {
        _outSocket.send(dataStr);
    }
}

function _onRemoteStream(event) {
    var remoteVideo = document.getElementById("remoteVideo");
    var hasVideo = false;

    if (event) {
        consoleLog("Got remote stream");
        hasVideo = event.stream.getVideoTracks().length > 0;
        remoteVideo.src = URL.createObjectURL(event.stream);
    } else {
        consoleLog("Reset remote stream");
        remoteVideo.src = "";
    }

    if (hasVideo) {
        remoteVideo.style.display = "block";
    } else {
        remoteVideo.style.display = "none";
    }
}

function _initIncomingSocket(address, sessionid) {
    _serverSocket = new _WebSocket(true,
        function(event) {
            msg = JSON.parse(event.data);
            if (VERBOSE) consoleLog(msg);
            if (msg["request-type"] == "WEBSOCKET") {
                json = JSON.parse(msg["request-body"]);

                // WebRTC handshake message
                if ("webrtc_type" in json) {
                    _handleIncomingWebRtcMessage(json);
                }
            }
        });
    _serverSocket.open(address, sessionid);
}

function _initOutgoingSocket(address, sessionid) {
    // Outgoing
    _outSocket = new _WebSocket(false, null);
    _outSocket.open(address, sessionid);
}

function _handleIncomingWebRtcMessage(json) {
    if (json.webrtc_type == "offer" || json.webrtc_type == "answer") {
        var remoteDesc = json.sessioninfo;
        if (json.webrtc_type == "offer") {
            // Got offer from host. Open up outgoing websocket and create answer
            _initOutgoingSocket(_address, _sessionid + "_host");

            _webrtcConnection.open(json.do_video, json.do_audio);
            _webrtcConnection.createAnswer(remoteDesc);
        } else {
            // Got answer from guest
            _webrtcConnection.beginCall(remoteDesc);
        }

        // In case there was a mute call before connection was up
        muteMicrophone(_curMicMute);
        muteRemoteAudio(_curRemoteAudioMute);
        muteCamera(_curCamMute);

        // There might be ICE candidates bundled with the offer
        if ("icecandidates" in json) {
            _webrtcConnection.addRemoteIceCandidates(json.icecandidates);
        }
    } else if (json.webrtc_type == "ice_trickle") {
        _webrtcConnection.addRemoteIceCandidates(json.icecandidates);
    } else if (json.webrtc_type == "ice_trickle_done") {
    } else if (json.webrtc_type == "hangup") {
        consoleLog("Hangup initiated by peer");
        hangup();
    }
}

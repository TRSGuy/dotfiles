function _WebrtcP2PConnection(isHost, iceServers, onSend, onRemoteStream) {
    this._isHost = isHost;
    this._iceServers = iceServers;
    this._onSend = onSend;
    this._onRemoteStream = onRemoteStream;
    this._localStream = null;
    this._remoteDesc = null;
    this._peerConnection = null;
    this._gotRemoteDesc = false;
    this._storedIceCandidates = [];
    this._numIceCandidates = 0;

    this._hasAudio = false;
    this._muteAudio = false;
    this._hasVideo = false;
    this._muteVideo = false;

    this._TAG = "WebRTC[" + (isHost ? "HOST" : "GUEST") + "]: ";

    this.open = function (video, audio) {
        this._hasAudio = audio;
        this._hasVideo = video;
    };

    // Called from host to begin a call
    this.createOffer = function () {
        consoleLog(this._TAG + "Creating offer to guest vid=" + this._hasVideo);
        this._requestLocalStream();
    };

    // Called from guest to accept host's call and send a response
    this.createAnswer = function(remoteDesc) {
        consoleLog(this._TAG + "Creating answer to host vid=" + this._hasVideo);
        this._remoteDesc = new RTCSessionDescription(remoteDesc);
        this._requestLocalStream();
    };

    // Called from host to finalize call after receiving answer
    this.beginCall = function(remoteDesc) {
        consoleLog(this._TAG + "Accepting answer from guest + ");
        this._peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
        this._gotRemoteDesc = true;

        // Kick any stored ICE candidates now that the remote description has been set
        this.addRemoteIceCandidates([]);
    };

    this.addRemoteIceCandidates = function(iceList) {
        if (!this._peerConnection || !this._gotRemoteDesc) {
            // Peer connection is not ready yet. Store ice candidates for future
            this._storedIceCandidates = this._storedIceCandidates.concat(iceList);
        } else {
            // Check to see if there are any stored ICE candidates left over
            // that need to be passed in
            if (this._storedIceCandidates.length > 0) {
                consoleLog(this._TAG + "Passing in stored ICE candidates n=" + this._storedIceCandidates.length);
                this._addRemoteIceCandidates(this._storedIceCandidates);
                this._storedIceCandidates = [];
            }

            this._addRemoteIceCandidates(iceList);
        }
    };

    this.setMicMute = function(isMute) {
        consoleLog(this._TAG + "setting microphone mute=" + isMute);
        this._muteAudio = isMute;
        if (this._localStream && this._localStream.getAudioTracks()[0])
            this._localStream.getAudioTracks()[0].enabled = !isMute;
    };

    this.setCamMute = function(isMute) {
        consoleLog(this._TAG + "setting camera mute=" + isMute);
        this._muteVideo = isMute;
        if (this._localStream && this._localStream.getVideoTracks()[0])
            this._localStream.getVideoTracks()[0].enabled = !isMute;
    };

    this.getMicMute = function() {
        return !this._localStream.getAudioTracks()[0].enabled;
    };

    this.isHost = function() {
        return this._isHost;
    };

    this.hangup = function() {
        if (!this._peerConnection) {
            consoleLog(this._TAG + "No call is active");
            return;
        }

        // Tell the other end to pack it in
        var json = JSON.stringify({"webrtc_type": "hangup"});
        this._onSend(json);

        this._localStream.getTracks().forEach(function (track) {
            track.stop();
        });
        this._peerConnection.close();
        this._peerConection = null;
        this._gotRemoteDesc = false;
        this._localStream = null;

        this._onRemoteStream(null);
    };

    this._addRemoteIceCandidates = function(iceList) {
        for (var ice in iceList) {
            var candidate = new RTCIceCandidate(JSON.parse(iceList[ice]));
            consoleLog(this._TAG + "Adding remote ICE candidate " + candidate);
            this._peerConnection.addIceCandidate(candidate);
        }
    };

    this._requestLocalStream = function () {
        consoleLog(this._TAG + "Requesting local stream");
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        var thiz = this;
        navigator.getUserMedia({video: this._hasVideo, audio: this._hasAudio}, this._gotLocalStream(this),
            function(error) {
                consoleLog(this._TAG + "navigator.getUserMedia error: ", error);
            });
    };

    this._gotLocalStream = function(thiz) {
        return function(stream) {
            thiz._localStream = stream;
            if (thiz._localStream.getVideoTracks().length > 0) {
                consoleLog(thiz._TAG + "Using video device: " + thiz._localStream.getVideoTracks()[0].label);
            }
            if (thiz._localStream.getAudioTracks().length > 0) {
                consoleLog(thiz._TAG + "Using audio device: " + thiz._localStream.getAudioTracks()[0].label);
            }

            // Initialize to correct mute state
            thiz.setMicMute(thiz._muteAudio);
            thiz.setCamMute(thiz._muteVideo);

            consoleLog(thiz._TAG + "Got local stream. Create Peer Connection");
            thiz._createOfferOrAnswer();
        };
    };

    this._createOfferOrAnswer = function () {
        this._peerConnection = new webkitRTCPeerConnection(this._iceServers);
        this._peerConnection.onicecandidate = this._gotLocalIceCandidate(this);
        this._peerConnection.onaddstream = this._onRemoteStream;
        this._peerConnection.addStream(this._localStream);

        if (this._isHost) {
            consoleLog(this._TAG + "Creating Offer");
            this._peerConnection.createOffer(this._gotDescription(this), function (err) {
                consoleLog(thiz._TAG + "createOffer error: " + err);
            });
        } else {
            consoleLog(this._TAG + "Creating Answer ");
            this._peerConnection.setRemoteDescription(this._remoteDesc);
            this._gotRemoteDesc = true;
            this._peerConnection.createAnswer(this._gotDescription(this), function (err) {
                consoleLog(thiz._TAG + "createAnswer error: " + err);
            });

            // Kick any stored ICE candidates now that the remote description has been set
            this.addRemoteIceCandidates([]);
        }
    };

    this._gotDescription = function(thiz) {
        return function(desc) {
            consoleLog(thiz._TAG + "Got local description");
            thiz._peerConnection.setLocalDescription(desc);

            // Send the offer/answer to the guest
            thiz._onSend(_genWebrtcMessage(desc, null, thiz));
        };
    };

    this._gotLocalIceCandidate = function(thiz) {
        return function(event) {
            if (VERBOSE) consoleLog("Got ICE Candidate " + event.candidate);
            if (event.candidate) {
                if (VERBOSE) consoleLog(thiz._TAG + " Trickle sending ICE candidate to peer");
                var candidates = [JSON.stringify(event.candidate)];
                thiz._onSend(_genWebrtcMessage(null, candidates, thiz));
                thiz._numIceCandidates += 1;
            } else {
                // Finished gathering ICE candidates
                consoleLog(thiz._TAG + " Finished sending ICE candidates to peer n=" + thiz._numIceCandidates);
            }
        };
    };

    function _genWebrtcMessage(desc, ice, obj) {
        var json = {};

        if (desc) {
            if (obj._isHost) {
                json.webrtc_type = "offer";
                json.do_audio = obj._hasAudio;
                json.do_video = obj._hasVideo;
            } else {
                json.webrtc_type = "answer";
            }
        } else if (ice) {
            json.webrtc_type = "ice_trickle";
        } else {
            consoleLog("Invalid webrtc message");
            return;
        }

        if (desc) json.sessioninfo = desc;
        if (ice)  json.icecandidates = ice;

        //consoleLog(json);

        return JSON.stringify(json);
    }
}

var PARAMMAP = (function () {
    var _paramMap = {
        "address": "address",
        "sessionId": "sessionid",
        "serverCertificateHash": "servercertificatehash"
    };
    return {
        get: function (key) {
            return _paramMap[key];
        }
    };
})();
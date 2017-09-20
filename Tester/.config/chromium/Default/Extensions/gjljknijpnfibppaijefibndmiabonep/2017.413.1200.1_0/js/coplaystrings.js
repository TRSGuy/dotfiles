var STRINGS = (function(oldStringsObject) {

    var validHexCodeToDisplay = [
        "0x80070004", // NVSC_R_ERROR_ENET_MC_START_FAILED
        "0x80040006", // NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_VIDEO
        "0x80040007", // NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_PACKETS_IN_VIDEO_STREAM
        "0x80040008", // NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_SERVER_PING
        "0x80040009", // NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_CONTROL_SOCKET_ERROR
        "0x80040011"  // NVSC_NETERR_SERVER_TERMINATED_ENCODER_START_FAILED
    ];
    
    function _escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    function _replaceAll(str, find, replace) {
        return str.replace(new RegExp(_escapeRegExp(find), 'g'), replace);
    }

    function pGet(key) {
        var value;
        if (chrome.i18n.getMessage(key)) {
            value = chrome.i18n.getMessage(key);
            return value;
        }
        return "Unable to load string " + key;
    }

    function pGetWithReplace(key, map, extendederrordetail) {
        var stringTemplate = pGet(key.toLowerCase());

        if (stringTemplate) {
            var s = stringTemplate;
            for (var prop in map) {
                if (!map.hasOwnProperty(prop)) {
                    continue;
                }
                var newProp = "{" + prop + "}";
                s = _replaceAll(s, newProp, map[prop]);
            }
            var hexCode = "{" + "hexcode" + "}";
            if ((typeof extendederrordetail != 'undefined') && (extendederrordetail != "")) {
                if (validHexCodeToDisplay.indexOf(extendederrordetail) == -1) {
                    extendederrordetail = "0x47439999";
                }
                    
                // Remove the 0x present in the hex error codes.
                extendederrordetail = extendederrordetail.replace("0x", "");
                s = _replaceAll(s, hexCode, extendederrordetail);
            }
            return s;
        }
        return "Unexpected Error - Please report this as a bug";
    }
    return {
        get: pGet,
        getWithReplace: pGetWithReplace
    };
})(STRINGS);

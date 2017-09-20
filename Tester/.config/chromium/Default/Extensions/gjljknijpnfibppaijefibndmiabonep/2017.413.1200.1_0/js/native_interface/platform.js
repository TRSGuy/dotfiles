/*
 * Copyright (c) 2015, NVIDIA CORPORATION. All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
*/
var PLATFORM = (function () {

    // TODO: Use JS virtual inheritance tricks to have 2 separate classes, one for chrome extension
    // and one for the rest.
    var isChromeExtension = false;
    // Determine if the app is running as a Chrome extension or not.
    // If not, use standard Javascript API.
    if (window.chrome && window.chrome.app && window.chrome.app.runtime) {
        isChromeExtension = true;
    }

    function pIsChromeExtension() {
        return isChromeExtension;
    }

    function pLocalStorageGet(key, cb) {
        if (isChromeExtension) {
            chrome.storage.local.get(key, function(result) {
                if (window.chrome.app.runtime.lastError) {
                    consoleLog("Local storage get failed " + window.chrome.app.runtime.lastError);
                } else {
                    cb(result);
                }
            });
        } else {
            var value = JSON.parse(window.localStorage.getItem(key));
            var res = {};
            res[key] = value;
            cb(res);
        }
    }

    function pLocalStorageSet(keyValue, cb) {
        if (isChromeExtension) {
            chrome.storage.local.set(keyValue, function() {
                if (window.chrome.app.runtime.lastError) {
                    consoleLog("Local storage set failed " + window.chrome.app.runtime.lastError);
                } else {
                    if (cb)
                        cb();
                }
            });
        } else {
            for (key in keyValue) {
                window.localStorage.setItem(key, JSON.stringify(keyValue[key]));
                if (cb) // cb is optional during local storage set.
                    cb();
            }
        }
    }

    function pGetPlatformArch(cb) {
        if (isChromeExtension) {
            chrome.runtime.getPlatformInfo(function(platformInfo) {
                cb(platformInfo.nacl_arch);
            });
        } else {
            consoleLog("getPlatformArch: Not implemented");
            cb("");
        }
    }

    function pGetCPUInfo(cb) {
        if (isChromeExtension) {
            chrome.system.cpu.getInfo(function(result) {
                cb(result);
            });
        } else {
            consoleLog("getCPUInfo: Not implemented");
        }
    }

    function pGetOSInfo(cb) {
        if (isChromeExtension) {
            chrome.runtime.getPlatformInfo(function(result) {
                cb(result);
            });
        } else {
            consoleLog("getOSInfo: Not implemented");
        }
    }

    function pSendMessage(jsonobj, cb) {
        if (isChromeExtension) {
            chrome.runtime.sendMessage(jsonobj, cb);
        } else {
            // consoleLog("sendMessage: Not implemented"); TODO: goes to infinite loop for log messages
        }
    }

    return {
        isChromeExtension: pIsChromeExtension,
        localStorageGet: pLocalStorageGet,
        localStorageSet: pLocalStorageSet,
        getPlatformArch: pGetPlatformArch,
        getCPUInfo: pGetCPUInfo,
        getOSInfo: pGetOSInfo,
        sendMessage: pSendMessage
    };
})();

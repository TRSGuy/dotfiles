var WEBGL = (function () {
    /*!
     * \brief
     * Checks webgl availability
     */
    function pCheck() {
        if (!window.WebGLRenderingContext) {
            return "no_webgl_browser_support";
        } else {
            var canvas = document.getElementById("glcanvas");

            //This takes care of the case where glcanvas is not defined in the main window
            if(typeof canvas == 'undefined') {
                consoleLog("glcanvas not found, ignoring webgl check");
                return "";
            }

            var ctx = canvas.getContext("webgl");
            if (!ctx) {
                return "webgl_init_failed";
            } else {
                ctx = canvas.getContext('experimental-webgl');
                var extension = ctx.getExtension('WEBGL_debug_renderer_info');
                if(extension != undefined) {
                    if(ctx.getParameter(extension.UNMASKED_RENDERER_WEBGL) == "SwiftShader") {
                        return "swiftshader_not_supported";
                    }
                }
            }
        }
        return "";
    }

    return {
        check: pCheck,    /*!< Checks webgl availability */
    };

})();

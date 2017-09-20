/**
 * @author Will Steinmetz
 * jQuery notification plug-in inspired by the notification style of Windows 8
 * Copyright (c)2013, Will Steinmetz
 * Licensed under the BSD license.
 * http://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2015 NVIDIA Corporation.  All rights reserved.
 *
 * NVIDIA Corporation and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA Corporation is strictly prohibited.
 */

(function ($) {
    "use strict";

    var settings,
        methods,
        self,
        supports;

    settings = {
        life: 10000,
        theme: 'nvgfe',
        sticky: false,
        verticalEdge: 'right',
        horizontalEdge: 'top',
        zindex: 2147483647,
        icon: false
    };

    methods = (function () {
        /**
         * Destroy the notification
         * @param object $this
         */
        function destroy($this) {
            var data = $this.data('notific8');

            $(window).unbind('.notific8');
            $this.removeData('notific8');
        }

        /**
         * Build the notification and add it to the screen's stack
         * @param object $this
         */
        function buildNotification($this) {
            var data = $this.data('notific8'),
                notification = $('<div />'),
                num = Number($('body').data('notific8s')),
                close,
                animate = 'margin-' + data.settings.verticalEdge,
                styles = {},
                $container = $('.jquery-notific8-container.' + data.settings.verticalEdge + '.' + data.settings.horizontalEdge);

            num += 1;

            notification.addClass('jquery-notific8-notification ' + data.settings.theme);
            notification.css('transition', 'all ' + data.settings.speed/1000.0 + 's ease-in-out');
            notification.attr('id', 'jquery-notific8-notification-' + num);
            $('body').data('notific8s', num);

            var containerDiv = notification;
            var topLayer = $('<div />');
            topLayer.addClass('jquery-notific8-notification-topLayer ' + data.settings.theme);
            topLayer.css('transition', 'all ' + data.settings.speed/1000.0 + 's ease-in-out');
            containerDiv = topLayer;
            notification.append(topLayer);

            // check for an icon
            if (data.settings.hasOwnProperty('icon') && (typeof data.settings.icon === "string")) {
                containerDiv.addClass('has-icon');
                if (data.settings.icon.indexOf("/") > -1) {
                    containerDiv.append('<img class="jquery-notific8-icon img" src="'
                                        + data.settings.icon + '"></img>');
                } else {
                    containerDiv.append('<i class="jquery-notific8-icon notific8-fontastic-'
                                        + data.settings.icon + '"></i>');
                }
            }

            // check for a heading
            if (data.settings.hasOwnProperty('heading') && (typeof data.settings.heading === "string")) {
                var headingDiv = $('<div class="jquery-notific8-heading"></div>').html(data.settings.heading);
                containerDiv.append(headingDiv);
            }

            // check if the notification is supposed to be sticky
            close = $('<div />');
            close.addClass('jquery-notific8-close').html('&times;');
            if (data.settings.sticky) {
                close.addClass('sticky');
            }
            close.on('click', function (event) {
                closeNotification(notification, data.settings.speed, styles, animate);
            });

            containerDiv.append(close);

            // add the message
            var messageDiv = $('<div class="jquery-notific8-message"></div>').html(data.message);
            containerDiv.append(messageDiv);


            // add the notification to the stack
            $container.append(notification);

            // slide the message onto the screen
            if (supports.transition) {
                setTimeout(function () {
                    notification.addClass('open');
                    if (!data.settings.sticky) {
                        (function (n, when) {
                            setTimeout(function () {
                                closeNotification(n, data.settings.speed);
                            }, when);
                        }(notification, Number(data.settings.life) + data.settings.speed));
                    }
                }, 5);
                setTimeout(function () {
                    topLayer.addClass('open');
                }, data.settings.speed);
            } else {
                styles[animate] = 0;
                notification.animate(styles, {
                    duration: 'fast',
                    complete: function () {
                        if (!data.settings.sticky) {
                            (function (n, l) {
                                setTimeout(function () {
                                    closeNotification(n, data.settings.speed, styles, animate);
                                }, l);
                            }(notification, data.settings.life));
                        }
                        data.settings = {};
                    }
                });
            }
            return {
                close: function() {
                    if (supports.transition) {
                        closeNotification(notification, data.settings.speed);
                    } else {
                        closeNotification(notification, data.settings.speed, styles, animate);
                    }

                },
                notification: notification
            };
        }

        /**
         * Close the given notification
         * @param object n
         * @param object styles
         * @param animate
         */
        function closeNotification(n, speed, styles, animate) {
            if (supports.transition) {
                n.removeClass('open');
                //n.height(0);
                setTimeout(function () {
                    n.remove();
                }, speed);
            } else {
                styles[animate] = n.outerWidth() * -1;
                styles.height = 0;
                n.animate(styles, {
                    duration: 'fast',
                    complete: function () {
                        n.remove();
                    }
                });
            }
        }

        /**
         * Set up the configuration settings
         * @param object options
         */
        function configure(options) {
            $.extend(settings, options);
        }

        /**
         * Set up the z-index
         * @param int z
         */
        function zindex(z) {
            settings.zindex = z;
        }

        /**
         * Initialize the plug-in
         * @param string message
         * @param object options
         * @return object
         */
        function init(message, options) {
            /* Not sure about the implications of
             * removing self.each here but
             * we need a return value so that these
             * notifications can be closed
             * externally.
             * /
           /*return self.each(function () {*/
            var $this = $(this),
                data = $this.data('notific8');

            $this.data('notific8', {
                target: $this,
                settings: {},
                message: ""
            });
            data = $this.data('notific8');
            data.message = message;

            // apply the options
            $.extend(data.settings, settings, options);

            // add the notification to the stack
            return buildNotification($this);
            /*});*/
        }

        /**
         * Initialize the containers for the plug-in
         */
        function initContainers() {
            var $body = $('body');
            $body.data('notific8s', 0);
            $body.append($('<div class="jquery-notific8-container top right"></div>'));
            $body.append($('<div class="jquery-notific8-container top left"></div>'));
            $body.append($('<div class="jquery-notific8-container bottom right"></div>'));
            $body.append($('<div class="jquery-notific8-container bottom left"></div>'));
            $('.jquery-notific8-container').css('z-index', settings.zindex);
        }

        /**
         * Make sure that the edge options are ok
         * @param object options
         */
        function checkEdges(options) {
            options.verticalEdge = (options.verticalEdge || settings.verticalEdge).toLowerCase();
            options.horizontalEdge = (options.horizontalEdge || settings.horizontalEdge).toLowerCase();

            if ((options.verticalEdge !== 'right') && (options.verticalEdge !== 'left')) {
                options.verticalEdge = settings.verticalEdge;
            }
            if ((options.horizontalEdge !== 'top') && (options.horizontalEdge !== 'bottom')) {
                options.horizontalEdge = settings.horizontalEdge;
            }
        }

        /**
         * Determine support for CSS3 property
         * @param string prop
         */
        function css3Support(prop) {
            var p = prop.split('-'),
                pStr = '',
                i,
                len,
                s = document.createElement('p').style,
                capitalize,
                pNoPrefix;

            capitalize = function (l) {
                return l.charAt(0).toUpperCase() + l.slice(1);
            };

            for (i = 0, len = p.length; i < len; i = i + 1) {
                pStr = pStr + p[i].toLowerCase().replace(/\b\w{3,}/g, capitalize);
            }

            pNoPrefix = pStr.charAt(0).toLowerCase() + pStr.slice(1);

            supports[prop] = s.hasOwnProperty(pNoPrefix) ||
                s.hasOwnProperty('Webkit' + pStr) ||
                s.hasOwnProperty('Moz' + pStr) ||
                s.hasOwnProperty('ms' + pStr) ||
                s.hasOwnProperty('O' + pStr);
        }

        return {
            init:           init,
            destroy:        destroy,
            configure:      configure,
            zindex:         zindex,
            initContainers: initContainers,
            checkEdges:     checkEdges,
            css3Support:    css3Support,
            close:          closeNotification
        };
    }());

    /**
     * wrapper since this plug-in is called without selecting an element first
     * @param string message
     * @param object options
     */
    $.notific8 = function (message, options) {
        switch (message) {
        case 'configure':
        case 'config':
            return methods.configure.apply(this, [options]);
        case 'zindex':
            return methods.zindex.apply(this, [options]);
        default:
            if (typeof options === 'undefined') {
                options = {};
            }

            // make sure that the stack containers exist
            if ($('.jquery-notific8-container').size() === 0) {
                methods.initContainers();
            }

            // make sure the edge settings exist
            methods.checkEdges(options);

            //display the notification in the right corner
            var notification = $('.jquery-notific8-container.' + options.verticalEdge + '.' + options.horizontalEdge).notific8(message, options);
            return notification;
            break;
        }
    };

    /**
     * plugin setup
     */
    $.fn.notific8 = function (message, options) {
        self = this;

        if (typeof supports === 'undefined') {
            supports = {};
            methods.css3Support('transition');
        }

        if (typeof message === "string") {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.notific8 takes a string message as the first parameter');
        }
    };
}(jQuery));

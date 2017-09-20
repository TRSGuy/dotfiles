var STRINGS = (function () {
    var _strings = { /* Used during load */
        configuring: "Configuring GRID for your session.",
        connecting: "Connecting you to the Nvidia GRID.",
        game_seat_ready: "Your session is ready.",
        playing: "You are playing on the Nvidia GRID.",
        stopping: "Stopping...",
        queue_position: "Queue Position ",
        /* Used during reconnecting when the first connect failed due to network error */
        retrying: "Connection error...Retrying...",
        /* Used during reconnecting when streaming was interrupted due to network errors. */
        reconnecting: "Attempting to reconnect...",
        /* Used for webgl errors */
        no_webgl_browser_support: "WebGl not supported by browser.",
        webgl_init_failed: "WebGl initialization failed. Please check http://get.webgl.org/troubleshooting.",
        swiftshader_not_supported: "Software accelerated OpenGL rendering is not supported.",
        /* Used */
        nvb_r_unknown: "Please report this as a BUG - An unknown error has occurred.",
        nvb_evt_network_connection_error: "A network communication error has occurred.",
        nvb_r_network_error: "A network error has occurred.",
        nvb_r_user_is_not_entitled: "You are not entitled.",
        nvb_evt_game_exited_unintentionally: "Please report this as a BUG - session ended unexpectedly.",
        nvb_evt_session_expired: "Your session was terminated because it exceeded the session time limit.",
        nvb_evt_game_exited_due_to_user_idle_timeout: "Your session has ended due to a long period of inactivity.",
        initialize_opengl_error_title: "OpenGL Initialization Error",
        initialize_decoder_error_title: "Decoder Initialization Error",
        nvb_evt_game_exited_by_user: "The user has voluntarily exited from within the game.",
        nvb_getgamelist_failed: "nvbGetGameList failed",
        no_applications_for_user: "Not entitled to any application.",
        nvb_play_failed: "nvbPlay failed.",
        nvb_registercallbacks_failed: "Register callbacks failed.",
        nvb_setauthinfo_failed: "Set authinfo failed.",
        nvb_r_upgrade_recommended: "A new version of the GRID client has been released. Please upgrade your client from ",
        nvb_r_server_upgrade_required: "Your server is incompatible with the client. Please upgrade your server.",
        nvb_r_client_upgrade_required: "Your client is incompatible with the server. Please upgrade your client.",
        nvb_initialize_failed: "Client failed to initialize.",
        hwdecodewikilink: "https://wiki.nvidia.com/asgard/index.php/VCA_Chrome_Client_Testing#Chrome_Client_running_on_Chromebook:_Hardware_Decode_Disclaimer",
        nvb_evt_streaming_server_pause : "Game paused on server. Hold on till the game on the server resumes.",
        nvb_evt_streaming_server_resume : "Game resuming on the server.",
        nvb_evt_streaming_quality_changed: "The computed quality of streaming changed.",
        nvb_evt_game_connected: "Game is playing, and has started streaming.",
        nvb_evt_error_unknown: "Please report this as a BUG - An unknown error has occurred",
        nvb_r_session_request_rejected: "Client request was rejected by the server",
        nvb_r_remote_user_response_timeout: "Server did not respond to the client request within max wait limit.",
        nacl_module_crash: "Unexpected Error. NaCl module has crashed.",
        /*  Extented error codes
            TODO: Add more descriptive error messages
        */
        "80070000": "NVSC_R_ERROR_ENET_COULD_NOT_CREATE_HOST",
        "80070001": "NVSC_R_ERROR_ENET_COULD_NOT_SET_ADDRESS",
        "80070002": "NVSC_R_ERROR_ENET_COULD_NOT_CREATE_PEER",
        "80070003": "NVSC_R_ERROR_ENET_COULD_NOT_CONNECT_TO_HOST",
        "80070004": "NVSC_R_ERROR_ENET_MC_START_FAILED",
        "80040000": "NVSC_NETERR_UNSPECIFIED",
        "80040001": "NVSC_NETERR_TIMEOUT",
        "80040002": "NVSC_NETERR_CONNLOST",
        "80040003": "NVSC_NETERR_UNINTENDED",
        "80040004": "NVSC_NETERR_CLIENT_TIMED_OUT",
        "80040005": "NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED",
        "80040006": "NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_VIDEO",
        "80040007": "NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_PACKETS_IN_VIDEO_STREAM",
        "80040008": "NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_NO_SERVER_PING",
        "80040009": "NVSC_NETERR_CLIENT_DISCONNECT_UNINTENDED_CONTROL_SOCKET_ERROR",
        "8004000A": "NVSC_NETERR_SERVER_TERMINATED_UNINTENDED",
        "8004000B": "NVSC_NETERR_SERVER_TERMINATED_REMOTE_INPUT_ERROR",
        "8004000D": "NVSC_NETERR_SERVER_TERMINATED_CONFIG_UNAVAILABLE",
        "8004000E": "NVSC_NETERR_SERVER_TERMINATED_INVALID_COMMAND",
        "8004000F": "NVSC_NETERR_SERVER_TERMINATED_INVALID_MOUSE_STATE",
        /* Currently Not Used */
        nvb_r_invalid_authinfo: "Your username and/or password were rejected by the server.",
        nvb_r_invalid_transport_protocol: "Please report this as a BUG - received nvb_r_INVALID_TRANSPORT_PROTOCOL.",
        nvb_r_invalid_video_settings: "Please report this as a BUG - received nvb_r_INVALID_VIDEO_SETTINGS.",
        nvb_r_invalid_controller: "A gamepad is required to play. Please connect a gamepad and try again.",
        nvb_r_invalid_server_name: "The Server name is invalid.",
        nvb_r_invalid_port_number: "The Port number is invalid.",
        nvb_r_invalid_object: "Please report this as a BUG - received nvb_r_INVALID_OBJECT.",
        nvb_r_invalid_param: "Please report this as a BUG - received nvb_r_INVALID_PARAM.",
        nvb_r_invalid_enum: "Please report this a s a BUG - received nvb_r_INVALID_ENUM.",
        nvb_r_invalid_video_decoder: "Please report this a s a BUG - received nvb_r_INVALID_VIDEO_DECODER.",
        nvb_r_invalid_audio_renderer: "Please report this a s a BUG - received nvb_r_INVALID_AUDIO_RENDERER.",
        nvb_r_invalid_game_identifier: "Please report this as a BUG - received nvb_r_INVALID_GAME_IDENTIFIER.",
        nvb_r_auth_err_unknown: "Please report this as a BUG - received nvb_r_AUTH_ERR_UNKNOWN.",
        nvb_r_auth_err_defunct_token: "Your username and/or password has expired.",
        nvb_r_auth_err_unauthorized_client: "Unrecognized username and password combination.",
        nvb_r_auth_err_unsupported_protocol: "Unsupported authentication protocol.",
        nvb_r_auth_err_unreachable_auth_server: "Failed to connect to the authentication server.",
        nvb_r_auth_err_unsupported_token_format: "Please report this as a BUG - received nvb_r_AUTH_ERR_UNSUPPORTED_TOKEN_FORMAT.",
        nvb_r_uninitialized: "Please report this as a BUG - received nvb_r_UNINITIALIZED.",
        nvb_r_session_already_being_played: "Another session is currently active.",
        nvb_r_no_session_to_resume: "There is no active session to stream or resume.",
        nvb_r_no_active_session_found: "There is no active session.",
        nvb_r_eligible: "Please report this as a BUG - nvb_r_ELIGIBLE",
        nvb_r_capable: "Client is capable of connecting to the GRID gaming network.",
        nvb_r_minimum_network_capability: "Your network characteristics are not optimal for streaming. You may notice latency, hiccups and/or artifacts while gaming.",
        nvb_r_service_not_reachable: "A network connection to the GRID server could not be established.",
        nvb_r_insufficient_network_capability: "Your network characteristics are not sufficient for streaming.",
        nvb_r_required_controls_unavailable: "A gamepad is required to play. Please connect a gamepad and try again.",
        nvb_r_uninitialized_authinfo: "Please report this as a BUG - received nvb_r_UNINITIALIZED_AUTHINFO.",
        nvb_r_title_not_age_appropriate: "You are too young to play this title.",
        nvb_r_streamer_connect_failed: "Failed to connect to the server.",
        nvb_r_streamer_network_error: "A network communication error has occurred.",
        nvb_r_game_start_cancelled: "Startup was successfully cancelled.",
        nvb_r_connection_rejected: "Failed to connect to the GRID server.",
        nvb_r_session_limit_reached: "You have exceeded the maximum number of concurrent sessions.",
        nvb_r_zone_in_maintenance_mode: "NVIDIA GRID servers are currently undergoing maintenance. Please try connecting again later.",
        nvb_r_game_title_fenced: "The requested session is currently unavailable. Please try again later.",
        nvb_r_network_performance_inadequate: "Your network performance has deteriorated.",
        nvb_r_eula_not_accepted: "You need to acceept EULA to proceed.",
        nvb_r_streamer_uninitialized: "Please report this as a BUG - An unknown error has occurred.",
        nvb_r_server_out_of_service: "Server is currently out of service. Please try connecting again later.",
        nvb_r_insufficient_resources: "The server is not able to allocate a game seat due to insufficient resources.",
        nvb_r_game_seat_unresponsive: "The server is not able to ping the allocated game seat",
        nvb_r_login_already_in_progress: "A login attempt is currently being executed",
        nvb_r_login_delayed: "A login attempt can not be completed immediately.",
        nvb_r_login_failed: "A login attempt has failed.",
        nvb_r_login_l2_validation_required: "A login attempt has failed, and this title's level 2 validation is required",
        nvb_r_no_login_request_found: "There was no login request to cancel.",
        nvb_r_l2_validation_failed: "The level two validation credentials are invalid",
        nvb_r_login_cancelled: "The login attempt was cancelled",
        nvb_r_pair_failed: "Pairing with server failed because the pin entered was wrong",
        nvb_r_pair_needed: "Request failed because the client was not paired to the server",
        nvb_r_appstore_profile_private: "Unable to access application store information because user's application store profile is private",
        nvb_r_appstore_not_reachable: "Unable to reach the application store server",
        nvb_r_reinitialize_error: "Error returned when a successfully initialized client is attempted to initialize again",
        nvb_r_not_supported: "The requested operation is not supported",
        nvb_r_invalid_certificate: "The certificate provided by the client is invalid",
        nvb_r_invalid_private_key: "The private key provided by the client is invalid",
        nvb_r_invalid_certificate_key_pair: "The modulus and/or public exponent of client private key & certificate do not match",
        nvb_r_ges_not_reachable: "Server is not able to reach grid entitlement service, cannot verify if user is entitled or not",
        nvb_r_user_not_registered_in_ges: "User has not registered in grid entitlement service",
        nvb_r_no_entitlement_time_remaining: "User has exhausted his/her entitlement time",
        nvb_r_session_no_longer_active: "Session is no longer active.",
        nvb_evt_user_approaching_idle_timeout: "Your session will be terminated soon due to inactivity.",
        nvb_evt_streaming_properties: "Streaming properties event",
        nvb_evt_launch_browser_on_client: "The game has requested a browser to be launched",
        nvb_evt_game_session_approaching_expiration: "The time of playing a game is approaching the maximum limit.",
        nvb_evt_request_login_credentials: "Remote app is requesting login credentials.",
        nvb_evt_login_notice: "Remote app is logging-in user.",
        nvb_evt_zone_info: "The final redirected zone information.",
        nvb_evt_validate_ssl_certificate: "Validate an ssl certificate chain sent from the server.",
        nvb_evt_entitlement_timeout: "Session is terminated because user is no longer entitled to the service.",
        nvb_evt_session_terminated_by_operator: "Session has been terminated by the operator.",
        notification_paused: "Your session is currently paused",
        notification_click_to_play: "Click to join the game",
        notification_leave_play: "Press ctrl F3 to unlock mouse",
        watch_game: "watch game",
    };
    return {
        get: function (key, extendederrordetail) {
            var value;
            if (_strings[key]) {
                value = _strings[key];
            } else {
                value = "Unexpected Error - Please report this as a bug"
            }
            
            if(typeof extendederrordetail != 'undefined') {
                // Remove the 0x present in the hex error codes.
                extendederrordetail = extendederrordetail.replace("0x", "");
                if(_strings[extendederrordetail.toUpperCase()]) {
                    value = value + "<br>" + _strings[extendederrordetail.toUpperCase()];
                }
                value = value + "<br> Error Code: " + extendederrordetail;
            }
            
            return value;
        }
    };
})();

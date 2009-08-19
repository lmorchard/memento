/**
 * @fileOverview App assistant for Memento
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
function AppAssistant(app_controller) {
    Mojo.log("APP ASSISTANT CONSTRUCT");
}

AppAssistant.prototype = (function() {

    /** @lends AppAssistant# */ 
    return {

        setup: function() {
            Mojo.log("APP ASSISTANT SETUP");
        },

        handleLaunch: function(launch_params) {
            Mojo.log("APP ASSISTANT HANDLE LAUNCH %j", launch_params);
            Memento.init(launch_params);
        },

        handleCommand: function(event) {
            Mojo.log("APP ASSISTANT HANDLE COMMAND");
        }

    };

}());

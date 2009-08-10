/**
 * App assistant.
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function AppAssistant(app_controller) {
}

AppAssistant.prototype = (function() {

    return {

        setup: function() {
            Mojo.log("APP ASSISTANT SETUP");
            Memento.init();
        },

        handleLaunch: function(launch_params) {
            Mojo.log("APP ASSISTANT HANDLE LAUNCH");
        },

        handleCommand: function(event) {
            Mojo.log("APP ASSISTANT HANDLE COMMAND");
        }

    };

}());

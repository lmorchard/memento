/**
 * Main stage assistant
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function StageAssistant() {
}

StageAssistant.prototype = (function () {
        
    return {

        setup: function () {
            // Hijack TestAssistant.updateResults to generate more logging
            // spew in console.
            var orig_fn = Mojo.Test.TestAssistant.prototype.updateResults;
            Mojo.Test.TestAssistant.prototype.updateResults = function () {
                Mojo.log("Reporting test results...");
                orig_fn.apply(this);
                // TODO: Include the suite name here
                this.resultsModel.items.each(function(item) {
                    Mojo.log("    %s: %s", item.method, item.message);
                }.bind(this));
                Mojo.log("Tests complete @ " + 
                    Mojo.Format.formatDate(new Date(), {time: 'medium'}));
                Mojo.log("Summary: %s", this.makeSummary(this.runner.results));
            };

            if ('true'==Mojo.Environment.frameworkConfiguration.testsEnabled &&
                    'true'==Mojo.Environment.frameworkConfiguration.runTestsAtLaunch) {
                Mojo.Test.pushTestScene(this.controller, { runAll: true });
            } else {
                this.controller.pushScene('home');
            }
        },

        handleCommand: function(event) {

            var currentScene = Mojo.Controller.stageController.activeScene();

            if (event.type == Mojo.Event.command) {
                switch(event.command) {

                    case 'AppAbout':
                        currentScene.showAlertDialog({
                            onChoose: function(value) {},
                            title: 
                                $L("Memento - v0.1"),
                            message: 
                                $L("Copyright 2008-2009, Leslie Michael Orchard"),
                            choices: [
                                {label:$L("OK"), value:""}
                            ]
                        });
                        break;

                    case 'AppPreferences':
                        Mojo.Controller.stageController
                            .pushScene("preferences", this);
                        break;

                    case 'AppTests':
                        Mojo.Test.pushTestScene(this.controller, { runAll: true });
                        break;

                    case 'do-help':
                        Mojo.Log.info("...........",
                            "Help selected from menu, not currently available.");
                        break;
	            }
            }
            
        }

    };
        
}());

/**
 *
 */
appMenuModel = {
    visible: true,
    items: [
        Mojo.Menu.editItem,
        { label: "Preferences", command: 'AppPreferences' },
        { label: "About", command: 'AppAbout' },
        //{ label: "Help", command: 'AppHelp' }
    ]
};

function StageAssistant() {
}

StageAssistant.prototype = (function () {
        
    return {

        setup: function () {

            if ('true'===Mojo.Environment.frameworkConfiguration.testingEnabled) {

                // Hijack TestAssistant.updateResults to generate more logging
                // spew in console.
                var orig_fn = Mojo.Test.TestAssistant.prototype.updateResults;
                Mojo.Test.TestAssistant.prototype.updateResults = function () {

                    Mojo.log("Tests starting...");

                    orig_fn.apply(this);
                    
                    this.resultsModel.items.each(function(item) {
                        Mojo.log("    " + item.method + ": " + item.message);
                    }.bind(this));

                    Mojo.log("Tests complete @ " + 
                        Mojo.Format.formatDate(new Date(), {time: 'medium'}));

                    Mojo.log("Summary: " + this.makeSummary(this.runner.results));

                };

                Mojo.Test.pushTestScene(this.controller, {
                    runAll: true
                });
            
            } else {

                this.controller.pushScene('home');

            }
        },

        handleCommand: function(event) {

            Mojo.log("HANDLE COMMAND");

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

                    case 'do-help':
                        Mojo.Log.info("...........",
                            "Help selected from menu, not currently available.");
                        break;
	            }
            }
            
        }

    };
        
}());

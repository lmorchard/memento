/**
 *
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

                Mojo.log("Tests starting...");

                orig_fn.apply(this);
                
                this.resultsModel.items.each(function(item) {
                    Mojo.log("    " + item.method + ": " + item.message);
                }.bind(this));

                Mojo.log("Tests complete @ " + 
                    Mojo.Format.formatDate(new Date(), {time: 'medium'}));

                Mojo.log("Summary: " + this.makeSummary(this.runner.results));

            };

            if ('true'===Mojo.Environment.frameworkConfiguration.testingEnabled) {

                Mojo.Test.pushTestScene(this.controller, {
                    runAll: true
                });
            
            } else {

                this.controller.pushScene('home');

            }
        }

    };
        
}());

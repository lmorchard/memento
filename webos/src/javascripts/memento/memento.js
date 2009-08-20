/**
 * @fileOverview Memento global package.
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Mojo, NotesModel */
var Memento = (function () {
    
    /** @lends Memento */
    return {

        default_prefs: {
            loaded: true,
            sync_url: 'http://dev.memento.decafbad.com/',
            sync_enabled: true,
            sync_on_start: true,
            sync_on_open: true,
            sync_on_save: true,
            sync_on_delete: true,
            sync_on_shutdown: true
        },

        app_menu_items: [
            Mojo.Menu.editItem,
            { label: "Sync Now", command: 'AppSyncNow' },
            { label: "Preferences...", command: 'AppPreferences' },
            { label: "About", command: 'AppAbout' }
            //{ label: "Help", command: 'AppHelp' }
        ],

        /**
         * Global app-wide initialization.
         */
        init: function (launch_params) {

            this.prefs_cookie = new Mojo.Model.Cookie('memento_preferences');
            if (!this.prefs_cookie.get() || !this.prefs_cookie.get().loaded) {
                this.prefs_cookie.put(this.default_prefs);
            }
            this.prefs = this.prefs_cookie.get();

            this.notes_model = new NotesModel();
            this.notes_service = new Memento.Service({
                service_url: this.prefs.sync_url
            });
            this.notes_sync = new Memento.Sync(
                this.notes_model, this.notes_service
            );

            var fw_config = Mojo.Environment.frameworkConfiguration;
            this.tests_enabled = 
                ('true' === fw_config.testsEnabled) || 
                launch_params.testsEnabled;
            this.run_tests_at_launch = 
                ('true' === fw_config.runTestsAtLaunch) ||
                launch_params.runTestsAtLaunch;
            
            if (this.tests_enabled) {
                this.setupTests();
            }

            this.app_menu = {
                model: { visible: true, items: this.app_menu_items },
                attr: { omitDefaultItems: true }
            };

            return this;
        },

        /**
         * Command handler used by other classes.
         */
        globalHandleCommand:function(event) {

            var currentScene = Mojo.Controller.stageController.activeScene();

            if (event.type == Mojo.Event.command) {
                // @TODO: Turn this into a dispatcher?
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

                    case 'AppSyncNow':
                        if (Memento.home_assistant) {
                            Memento.home_assistant.performSync();
                        }
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
            
        },

        /**
         * Set up tests, if enabled.
         */
        setupTests: function () {
            // Hijack TestAssistant.updateResults to generate more logging
            // spew in console.
            var orig_fn = Mojo.Test.TestAssistant.prototype.updateResults;
            /** @ignore */
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

            this.app_menu_items.push(
                { label: "Run Tests...", command: 'AppTests' }
            );
        },

        EOF: null
    };

}());

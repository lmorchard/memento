/**
 * @fileOverview Memento global package.
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Memento, NotesModel, Note, Mojo, $L, $H, SimpleDateFormat */
var Memento = (function () {
    
    /** @lends Memento */
    return {

        log_lines: [],

        default_prefs: {
            loaded: true,
            sync_url: 'http://dev.memento.decafbad.com/',
            sync_enabled: true,
            sync_notifications: true,
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

            this.refreshPrefs();
            this.initModel();
            this.initService();
            this.initSync();

            var fw_config = Mojo.Environment.frameworkConfiguration;
            this.tests_enabled =
                fw_config.testsEnabled || 
                launch_params.testsEnabled;
            this.run_tests_at_launch =
                fw_config.runTestsAtLaunch ||
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

        refreshPrefs: function () {
            this.prefs_cookie = new Mojo.Model.Cookie('memento_preferences');
            if (!this.prefs_cookie.get() || !this.prefs_cookie.get().loaded) {
                this.prefs_cookie.put(this.default_prefs);
            }
            this.prefs = this.prefs_cookie.get();
        },

        initModel: function () {
            this.notes_model = new NotesModel(
                null, function() {}, function() {}
            );
        },

        initService: function () {
            this.notes_service = new Memento.Service({
                service_url: this.prefs.sync_url
            });
        },

        initSync: function () {
            this.notes_sync = new Memento.Sync(
                this.notes_model, this.notes_service
            );
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

                    case 'AppDev':
                        Mojo.Controller.stageController.pushScene("dev", this);
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
            this.app_menu_items.push(
                { label: "Dev Scene...", command: 'AppDev' }
            );
        },

        /**
         * General utility function to generate listeners suitable for mass
         * unlistening on cleanup.
         */
        setupListeners: function (listeners, that) {
            that.listeners = listeners.map(function (listener) {
                var new_listener = [
                    typeof listener[0] == 'string' ?
                        this.controller.get(listener[0]) : listener[0],
                    listener[1],
                    listener[2].bind(this)
                ];
                Mojo.Event.listen.apply(Mojo.Event, new_listener);
                return new_listener;
            }, that);
        },

        /**
         * Clear listeners generated by mapListener.
         */
        clearListeners: function (that) {
            that.listeners.each(function (listener) {
                Mojo.Event.stopListening.apply(Mojo.Event, listener);
            });
        },

        EOF: null
    };

}());

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
        init: function () {

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

            Mojo.log("Sync using %s", this.prefs.sync_url);
            
            if ('true' === Mojo.Environment.frameworkConfiguration.testsEnabled) {
                this.app_menu_items.push(
                    { label: "Run Tests...", command: 'AppTests' }
                );
            }

            this.app_menu = {
                model: { visible: true, items: this.app_menu_items },
                attr: { omitDefaultItems: true }
            };

            return this;
        },

        EOF: null
    };

}());

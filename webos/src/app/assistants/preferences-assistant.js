/**
 * @fileOverview Preferences scene assistant
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Memento, Note, Mojo, $L, $H, SimpleDateFormat */
function PreferencesAssistant(note) {
}

PreferencesAssistant.prototype = (function () {

    /** @lends PreferencesAssistant# */ 
    return {

        /**
         * Set up the preferences scene.
         */
        setup: function () {

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                Memento.app_menu.attr, Memento.app_menu.model);

            this.controller.setupWidget('sync_url', 
                {
                    modelProperty: 'sync_url',
                    hintText: $L('http://memento.decafbad.com/')
                },
                Memento.prefs
            );

            ['enabled', 'notifications', 'on_start', 'on_open', 
                    'on_save', 'on_delete', 'on_shutdown']
                .each(function (name) {
                    this.controller.setupWidget('sync_' + name, 
                        { modelProperty: 'sync_' + name },
                        Memento.prefs
                    );
                    this.controller.get('sync_' + name,
                        Mojo.Event.propertyChange, this.savePrefs.bind(this)
                    );
                }, this);

            this.controller.setupWidget(
                'sync_reset', 
                { label: 'Reset sync' }, { }
            );
            this.controller.get('sync_reset').observe(
               Mojo.Event.tap, this.resetSync.bind(this)
            );

            this.controller.setupWidget('features_drawer',
                { unstyled: true },
                { open: Memento.prefs.sync_enabled }
            );

            this.controller.get('sync_enabled').observe(
                Mojo.Event.propertyChange, function (ev) {
                    this.controller.get('features_drawer').mojo.toggleState();
                }.bind(this)
            );

        },

        /**
         * Clear the last sync cookie for sync.
         */
        resetSync: function () {
            var last_sync_cookie = 
                new Mojo.Model.Cookie('memento_last_sync');
            last_sync_cookie.put(null);
            Mojo.Controller.getAppController().showBanner(
                { messageText: "Web sync has been reset" }, {}, null
            );
        },

        /**
         * Save the preferences model.
         */
        savePrefs: function () {

            Mojo.Controller.getAppController().showBanner(
                { messageText: "Preferences saved" }, {}, null
            );

            var old_prefs = Memento.prefs_cookie.get();
            
            Memento.prefs_cookie.put(Memento.prefs);
            Memento.refreshPrefs();
            Memento.initService();
            Memento.initSync();
            this.resetSync();
        },

        activate: function (event) {
        },

        deactivate: function (event) {
            this.savePrefs();
        },

        cleanup: function (event) {
            this.savePrefs();
        }

    };

}());

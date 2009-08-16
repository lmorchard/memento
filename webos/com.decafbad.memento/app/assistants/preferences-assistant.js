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

            ['enabled', 'on_start', 'on_open', 'on_save', 'on_delete', 'on_shutdown']
                .each(function (name) {
                    this.controller.setupWidget('sync_' + name, 
                        { modelProperty: 'sync_' + name },
                        Memento.prefs
                    );
                    this.controller.get('sync_' + name,
                        Mojo.Event.propertyChange, this.savePrefs.bind(this)
                    );
                }, this);

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
         * Save the preferences model.
         */
        savePrefs: function () {
            Memento.prefs_cookie.put(Memento.prefs);
        },

        activate: function (event) {
            this.savePrefs();
        },

        deactivate: function (event) {
            this.savePrefs();
        },

        cleanup: function (event) {
        }

    };

}());

/**
 * Preferences scene assistant.
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function PreferencesAssistant (note) {
    this.prefs_model = Memento.preferences.get();
}

PreferencesAssistant.prototype = (function () {

    return {

        /**
         * Set up the preferences scene.
         */
        setup: function() {

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                Memento.app_menu.attr, Memento.app_menu.model);

            this.controller.setupWidget('sync_url', 
                {
                    modelProperty: 'sync_url',
                    hintText: $L('http://memento.decafbad.com/')
                },
                this.prefs_model
            );

            ['enabled','on_start','on_open','on_save','on_shutdown']
                .each(function(name) {
                    this.controller.setupWidget('sync_' + name, 
                        { modelProperty: 'sync_' + name },
                        this.prefs_model
                    );
                    this.controller.get('sync_' + name,
                        Mojo.Event.propertyChange, this.savePrefs.bind(this)
                    );
                }, this);

            this.controller.setupWidget('features_drawer',
                { unstyled: true },
                { open: this.prefs_model.sync_enabled }
            );

            this.controller.get('sync_enabled').observe(
                Mojo.Event.propertyChange, function(ev) {
                    this.controller.get('features_drawer').mojo.toggleState()
                }.bind(this)
            );

        },

        /**
         * Save the preferences model.
         */
        savePrefs: function() {
            Memento.preferences.put(this.prefs_model);
        },

        /**
         * On scene activation, save the model.
         */
        activate: function(event) {
            this.savePrefs();
        },

        /**
         * On scene deactivation, save the model.
         */
        deactivate: function(event) {
            this.savePrefs();
        },

        /**
         * On scene cleanup, save the model.
         */
        cleanup: function(event) {
            this.savePrefs();
        }

    };

}());

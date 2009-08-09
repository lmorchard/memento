/**
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @namespace Memento global package.
 */
var Memento = {}

Memento.app_menu = {
    model: {
        visible: true,
        items: [
            Mojo.Menu.editItem,
            { label: "Preferences...", command: 'AppPreferences' },
            { label: "About", command: 'AppAbout' },
            //{ label: "Help", command: 'AppHelp' }
        ]
    },
    attr: {
        omitDefaultItems: true
    }
};

Memento.default_preferences = {
    loaded: true,
    sync_url: 'http://dev.memento.decafbad.com/',
    sync_enabled: true,
    sync_on_start: true,
    sync_on_open: true,
    sync_on_save: true,
    sync_on_shutdown: true
};

Memento.preferences = new Mojo.Model.Cookie('memento_preferences');
if (!Memento.preferences.get() || !Memento.preferences.get().loaded) {
    Memento.preferences.put(Memento.default_preferences);
}

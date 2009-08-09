/**
 * Single note scene assistant.
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function NoteAssistant (note) {
    this.prefs = Memento.preferences.get();
    this.notes_model   = new NotesModel();
    this.notes_service = new Memento.Service(this.prefs.sync_url);
    this.notes_sync    = new Memento.Sync(this.notes_model, this.notes_service);
    this.note = note;
}

NoteAssistant.prototype = (function () {

    return {

        setup: function () {

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                Memento.app_menu.attr, Memento.app_menu.model);

            this.controller.setupWidget(
                "name", {
                    hintText: $L('Enter note name...'),
                    multiline: false,
                    enterSubmits: false,
                    focus: (!this.note.name),
                    modelProperty: 'name'
                },
                this.note
            );

            this.controller.setupWidget(
                "text", {
                    multiline: true,
                    enterSubmits: false,
                    focus: (!!this.note.name),
                    modelProperty: 'text'
                },
                this.note
            );

            ['name', 'text'].each(function(name) {
                this.controller.get(name).observe(
                    Mojo.Event.propertyChange, this.saveChanges.bind(this)
                );
            }, this);

            // TODO: Find a way to translate taps on stage into text focus
            /*
            this.controller.get('main').observe(
                Mojo.Event.tap, this.focusText.bind(this)
            );
            */

        },

        focusText: function(ev) {
            this.controller.get('text').focus();
        },
        
        saveChanges: function() {
            if (!this.note.name && !this.note.text) {
                // Don't save changes to empty notes.
                return;
            }
            this.notes_model.save(
                this.note, function(note) { }
            );
            this.notes_service.saveNote(
                this.note, false, 
                function(note) { 
                    Mojo.log("SAVED UPDATED NOTE " + this.note.uuid + ' ' + this.note.etag) 
                },
                function(note) { Mojo.log("FAILED UPDATED NOTE " + this.note.uuid) }
            );
        },

        activate: function (event) {
            this.saveChanges();
        },

        deactivate: function (event) {
            this.saveChanges();
        },

        cleanup: function (event) {
            this.saveChanges();
        }

    };

}());

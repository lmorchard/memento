/**
 * Single note scene assistant.
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function NoteAssistant (note) {
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
        
        saveChanges: function(force_overwrite) {
            if (!this.note.name && !this.note.text) {
                // Don't save changes to empty notes.
                return;
            }
            
            this.note.modified = (new Date()).toISO8601String();

            if (!Memento.prefs.sync_enabled && !Memento.prefs.sync_on_save) {

                Mojo.log("Skipping remote save of note %s", this.note.uuid);
                Memento.notes_model.save(
                    this.note, function(note) { }
                );
                Memento.home_assistant.updateList();

            } else {

                Memento.notes_service.saveNote(
                    this.note, force_overwrite, 
                    function(note, resp) { 
                        Mojo.log("Remote save of note %s", this.note.uuid) 
                        this.note.etag = note.etag;
                        Memento.notes_model.save(
                            this.note, function(note) { }
                        );
                        Memento.home_assistant.updateList();
                    }.bind(this),
                    this.handleWebSaveProblem.bind(this)
                );

            }
        },

        handleWebSaveProblem: function(note, resp) {
            Mojo.log("FAILED UPDATED NOTE %s / %s / %s / %s", 
                resp.status, this.note.uuid, this.note.etag, resp.getHeader('etag'));

            if ('412' == resp.status) {

                this.controller.showAlertDialog({
                    title: $L("Problem saving to the web"),
                    message: $L(
                        "This note was modified on the web since it was " +
                        "last saved from this device."
                    ),
                    choices: [
                        {value:"overwrite_remote", 
                            label:$L("Overwrite note on web") },
                        {value:"new_local", 
                            label:$L("Save a new copy")},
                    ],
                    onChoose: function(value) {
                        if ('overwrite_remote' == value) {
                            this.saveChanges(true);
                        } else {
                            delete this.note.uuid;
                            this.note.name += ' (copy)';
                            this.saveChanges();
                        }
                    }
                });

            }

        },

        activate: function (event) {
            //this.saveChanges();
        },

        deactivate: function (event) {
            //this.saveChanges();
        },

        cleanup: function (event) {
            //this.saveChanges();
        }

    };

}());

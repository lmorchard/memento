/**
 * Single note scene assistant.
 */
function NoteAssistant (note) {
    this.notes_model = new NotesModel();
    this.note = note;
}

NoteAssistant.prototype = (function () {

    return {

        setup: function () {

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                {omitDefaultItems: true}, appMenuModel);

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

            this.controller.get('mojo-scene-note-scene-scroller').observe(
                Mojo.Event.tap, this.focusText.bind(this)
            );

        },

        focusText: function(ev) {
            Mojo.log("FOCUS TEXT");
            this.controller.get('text').focus();
        },
        
        saveChanges: function() {
            if (!this.note.name && !this.note.text) {
                // Don't save changes to empty notes.
                return;
            }
            this.notes_model.save(
                this.note,
                function(note) { }
            );
        },

        activate: function (event) {
        },

        deactivate: function (event) {
        },

        cleanup: function (event) {
        }

    };

}());
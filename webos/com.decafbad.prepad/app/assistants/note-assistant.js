/**
 *
 */
function NoteAssistant (note) {
    this.notes_model = new NotesModel();
    this.note = note;
}

/**
 *
 */
NoteAssistant.prototype = (function () {

    return {
        setup: function () {
            
            $('header').update(this.note.name);

            this.controller.setupWidget(
                "txt",
                {
                    multiline: true,
                    enterSubmits: false,
                    focus: true
                },
                {
                    value: this.note.text
                }
            );

            $('txt').observe(Mojo.Event.propertyChange, 
                function (ev) {
                    this.note.text = ev.value;
                    this.notes_model.save(this.note);
                }.bind(this)
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

/**
 *
 */
function HomeAssistant() {
    this.notes_model = new NotesModel();
}

/**
 *
 */
HomeAssistant.prototype = (function () {
    return {

        setup: function () {

            var notes = this.notes_model.findAll();

            this.controller.setupWidget(
                "notes-list",
                {
                    itemTemplate:  'home/list-item',
                    listTemplate:  'home/list-container',
                    addItemLabel:  $L('Add ...'),
                    swipeToDelete: true,
                    reorderable:   true,
                    emptyTemplate: 'home/emptylist',
                    
                },
                this.list_model = {
                    listTitle: $L('Notes'),
                    items: notes
                }
            );

            $('notes-list').observe(Mojo.Event.listTap, 
                function (ev) {
                    this.controller.stageController.pushScene('note', ev.item);
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

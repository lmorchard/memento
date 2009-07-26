/**
 * Home scene assistant.
 */
function HomeAssistant() {
    this.notes_model = new NotesModel();
}

HomeAssistant.prototype = (function () {

    return {

        setup: function () {

            this.notes = [];

            this.list_model = {
                listTitle: $L('Notes'),
                items: []
            };

            this.controller.setupWidget(
                "notes-list",
                {
                    swipeToDelete: true,
                    reorderable:   true,
                    itemTemplate:  'home/list-item',
                    listTemplate:  'home/list-container',
                    emptyTemplate: 'home/list-empty',
                    filterFunction: this.filterNotes.bind(this),
                },
                this.list_model
            );

            var notes_list = this.controller.get('notes-list');

            notes_list.observe(Mojo.Event.listTap, function(ev) {
                this.openNoteByUUID(ev.item.uuid);
            }.bind(this));

            notes_list.observe(Mojo.Event.listDelete, function(ev) {
                this.deleteNoteByUUID(ev.item.uuid);
            }.bind(this));

            this.controller.setupWidget(
                Mojo.Menu.commandMenu, {}, { items: [
                    { label: $L('+ New ...'), command:'NewNote' },
                ]}
            );

        },

        openNote: function(note) {
            this.controller.stageController.pushScene('note', note);
        },

        openNoteByUUID: function(uuid) {
            this.notes_model.find(uuid, this.openNote.bind(this));
        },

        deleteNoteByUUID: function(uuid) {
            this.notes_model.find(
                uuid, function(note) {
                    this.notes_model.del(
                        note, function() {
                            this.updateList();
                        }.bind(this)
                    );
                }.bind(this)
            )
        },

        updateList: function() {

            this.notes_model.findAll(
                null, null, null,

                function(notes) {
                    this.notes = notes;
                    this.list_model.items = this.notes;
                    this.refreshList();
                }.bind(this),
                
                function() { 
                    Mojo.Log.error('NotesModel findAll() failure') 
                }.bind(this)

            );

        },

        filterNotes: function (filterString, list_widget, offset, count) {
            var matching, lowerFilter;
            matching = this.notes;

            this.list_model.items = matching;			
            this.refreshList(matching, 0, matching.length);
        },

        refreshList: function(notes, offset, count) {
            if (!notes) notes = this.list_model.items;
            if (!offset) offset = 0;
            if (!count) count = notes.length;

            var list_widget = this.controller.get('notes-list');
            list_widget.mojo.setLength(count);
            list_widget.mojo.setCount(count);
            list_widget.mojo.noticeUpdatedItems(offset, notes);
        },

        /**
         * Menu command dispatcher.
         */
        handleCommand: function(event) {
            if(event.type !== Mojo.Event.command) return;
            var func = this['handleCommand'+event.command];
            if (typeof func != 'undefined') {
                return func.apply(this, [event]);
            }
        },

        handleCommandNewNote: function(event) {
            var new_note = new Note();
            this.openNote(new_note);

            /*
            this.notes_model.add(
                {}, function(note) {
                    this.openNote(note);
                }.bind(this)
            );
            */
        },

        activate: function (event) {
            this.updateList();

            console.log('HOME ACTIVATE');
        },

        deactivate: function (event) {
            console.log('HOME DEACTIVATE');
        },

        cleanup: function (event) {
            console.log('HOME CLEANUP');
        }

    };
}());

/**
 * Home scene assistant.
 */
function HomeAssistant() {
    this.notes_model = new NotesModel();
}

HomeAssistant.prototype = (function () {

    return {

        /**
         * Set up the UI for the home scene.
         */
        setup: function () {

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                {omitDefaultItems: true}, appMenuModel);

            this.notes = [];

            this.list_model = {
                listTitle: $L('Notes'), items: []
            };

            var list_props = {
                swipeToDelete: true,
                reorderable:   true,
                itemTemplate:  'home/list-item',
                listTemplate:  'home/list-container',
                emptyTemplate: 'home/list-empty',
                filterFunction: this.filterNotes.bind(this),
                formatters: {
                    modified: this.formatDate
                }
            }

            this.controller.setupWidget(
                "notes-list", list_props, this.list_model
            );

            var notes_list = this.controller.get('notes-list');

            notes_list.observe(Mojo.Event.listTap, function(ev) {
                this.openNoteByUUID(ev.item.uuid);
            }.bind(this));

            notes_list.observe(Mojo.Event.listDelete, function(ev) {
                this.deleteNoteByUUID(ev.item.uuid);
            }.bind(this));

            var command_menu_model = {items: [
                { label: $L('+ New ...'), /*icon: 'new-note',*/ command:'NewNote' },
            ]};

            this.controller.setupWidget(
                Mojo.Menu.commandMenu, {}, command_menu_model
            );

        },

        /**
         * Convert a date to a human-friendly string.
         */
        formatDate: function(date, model) {
            var dt  = new Date(date),
                now = new Date();
            if (dt.toDateString() === now.toDateString())
                return "Today, " + new SimpleDateFormat("h:mm a").format(dt);
            return new SimpleDateFormat("MMMM d, yyyy h:mm a").format(dt);
        },

        /**
         * Open a given note in the editing scene.
         */
        openNote: function(note) {
            this.controller.stageController.pushScene('note', note);
        },

        /**
         * Open a given note in the editing scene, first looking it up by UUID.
         */
        openNoteByUUID: function(uuid) {
            this.notes_model.find(uuid, this.openNote.bind(this));
        },

        /**
         * Delete a given note, first looking it up by UUID.
         */
        deleteNoteByUUID: function(uuid) {
            this.notes_model.find(uuid, function(note) {
                this.notes_model.del(note, function() { 
                    this.updateList() 
                }.bind(this)
            )}.bind(this));
        },

        /**
         * Update the list by finding notes in the model.
         */
        updateList: function() {

            this.notes_model.findAll(
                null, null, null,

                function(notes) {
                    try {
                        this.notes = notes;
                        this.list_model.items = this.notes;
                        this.refreshList();
                    } catch (e) {
                        Mojo.Log.logException(e);
                    }
                }.bind(this),
                
                function() { 
                    Mojo.Log.error('NotesModel findAll() failure') 
                }.bind(this)

            );

        },

        /**
         * Filter notes in the list according to the filter string entered.
         */
        filterNotes: function (filterString, list_widget, offset, count) {
            var matching, lowerFilter;
            matching = this.notes;

            this.list_model.items = matching;			
            this.refreshList(matching, 0, matching.length);
        },

        /**
         * Refresh the visible list given notes, offset, and count.
         */
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

        /**
         * Create a new note and open it in the editing scene.
         */
        handleCommandNewNote: function(event) {
            var new_note = new Note();
            this.openNote(new_note);
        },

        /**
         * On scene activation, update the notes list.
         */
        activate: function (event) {
            this.updateList();
        },

        /**
         * On scene deactivation, do...
         */
        deactivate: function (event) {
        },

        /**
         * On scene cleanup, do...
         */
        cleanup: function (event) {
        }

    };
}());

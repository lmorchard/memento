/**
 * Home scene assistant.
 *
 * @package    Memento
 * @subpackage assistants
 * @author     <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
function HomeAssistant() {
    this.prefs = Memento.preferences.get();
    this.notes_model   = new NotesModel();
    this.notes_service = new Memento.Service(this.prefs.sync_url);
    this.notes_sync    = new Memento.Sync(this.notes_model, this.notes_service);
}
HomeAssistant.prototype = (function () {

    return {

        /**
         * Set up the UI for the home scene.
         */
        setup: function () {

            // Set up the common app menu.
            this.controller.setupWidget(Mojo.Menu.appMenu, 
                Memento.app_menu.attr, Memento.app_menu.model);
        
            // Set up the notes list on home scene.
            this.list_order = 'bydate';
            this.list_model = {
                listTitle: $L('Notes'), items: []
            };
            var list_attrs = {
                swipeToDelete: true,
                reorderable:   false,
                itemTemplate:  'home/list-item',
                listTemplate:  'home/list-container',
                emptyTemplate: 'home/list-empty',
                formatters: {
                    modified: this.formatDate
                }
            }
            this.controller.setupWidget(
                "notes-list", list_attrs, this.list_model
            );

            // Connect up the tap and delete events.
            var notes_list = this.controller.get('notes-list');
            notes_list.observe(Mojo.Event.listTap, function(ev) {
                this.openNoteByUUID(ev.item.uuid);
            }.bind(this));
            notes_list.observe(Mojo.Event.listDelete, function(ev) {
                this.deleteNoteByUUID(ev.item.uuid);
            }.bind(this));

            // Wire up the sort order selector in the header.
            this.controller.get('sort-selector').observe(
                Mojo.Event.tap, this.showSortMenu.bind(this)
            );

            // Set up the new note command button.
            var command_menu_model = {items: [
                { label: $L('+ New ...'), icon: 'new-note', command:'NewNote' },
            ]};
            this.controller.setupWidget(
                Mojo.Menu.commandMenu, {}, command_menu_model
            );

            this.notes_sync.startSync(
                function() {
                    Mojo.log('Notes sync completed');
                },
                function(json, resp) {
                    Mojo.log('Notes sync FAILED');
                    Mojo.log('FOO ' + resp.status);
                }
            );

            // Fire off the initial update of note items from model.
            this.updateList();
        },

        /**
         * Convert a date to a human-friendly string.
         */
        formatDate: function(date, model) {
            var now = new Date(),
                dt  = (new Date()).setISO8601(date);
            if (dt.toDateString() === now.toDateString())
                return "Today, " + new SimpleDateFormat("h:mm a").format(dt);
            return new SimpleDateFormat("MMMM d, yyyy h:mm a").format(dt);
        },

        /**
         * Open a given note in the editing scene, first looking it up by UUID.
         */
        openNoteByUUID: function(uuid) {
            this.notes_model.find(uuid, this.openNote.bind(this));
        },
        /**
         * Open a given note in the editing scene.
         */
        openNote: function(note) {

            Mojo.Controller.getAppController().createStageWithCallback(
                {name: 'memento-note-' + note.uuid, lightweight: true},
                function(stageController) {
                    stageController.pushScene('note', note);
                }
            );
                      
            //this.controller.stageController.pushScene('note', note);
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
         * Available sort choices for notes.
         */
        available_sorts: $H({
            'bydate': {
                label: 'By date',
                cmp: function(b,a) {
                    var av = a['modified'], bv = b['modified'];
                    return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
                }
            },
            'byalpha': {
                label: 'By alpha',
                cmp: function(a,b) {
                    var av = a['name'], bv = b['name'];
                    return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
                }
            }
        }),

        /**
         * Show the sort menu in response to tapping the header button.
         */
        showSortMenu: function(ev) {
            var items = [];
            this.available_sorts.each(function(pair) {
                items.push({command: pair.key, label: pair.value.label});
            }, this);

            this.controller.popupSubmenu({
                onChoose: function (order) {
                    if (order) {
                        this.list_order = order;
                        var sort = this.available_sorts.get(order)
                        this.controller.get('sort-selector')
                            .update(sort.label);
                        this.refreshList();
                    }
                }.bind(this),
                manualPlacement: true,
                popupClass: 'sort-selector-menu',
                items: items
            });
        },

        /**
         * Update the list by finding notes in the model.
         */
        updateList: function() {
            this.notes_model.findAll(
                null, null, null,
                function(notes) {
                    try {
                        this.list_model.items = notes;
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
         * Refresh the visible list given notes, offset, and count.
         */
        refreshList: function(notes, offset, count) {
            if (!notes) notes = this.list_model.items;
            if (!offset) offset = 0;
            if (!count) count = notes.length;

            // TODO: Implement this in the DB eventually?
            var sort_func = this.available_sorts.get(this.list_order).cmp;
            this.list_model.items.sort(sort_func);

            var list_widget = this.controller.get('notes-list');
            list_widget.mojo.noticeUpdatedItems(offset, this.list_model.items);
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
            this.updateList();
        },

        /**
         * On scene cleanup, do...
         */
        cleanup: function (event) {
        }

    };
}());

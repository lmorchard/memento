/**
 * @fileOverview Home scene assistant
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Memento, Note, Mojo, $L, $H, SimpleDateFormat */
function HomeAssistant() {
    Memento.home_assistant = this;
}

HomeAssistant.prototype = (function () {

    /** @lends HomeAssistant# */ 
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
            };
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
                { label: $L('+ New ...'), icon: 'new-note', command:'NewNote' }
            ]};
            this.controller.setupWidget(
                Mojo.Menu.commandMenu, {}, command_menu_model
            );

            if (Memento.sync_enabled && Memento.prefs.sync_on_start) {
                Mojo.log("Sync on start enabled...");
                this.performSync();
            } else {
                // Fire off the initial update of note items from model.
                Mojo.log("Sync on start disabled, skipping.");
                this.updateList();
            }

        },

        /**
         * Convert a date to a human-friendly string.
         */
        formatDate: function(date, model) {
            var now = new Date(),
                dt  = (new Date()).setISO8601(date);
            if (dt.toDateString() === now.toDateString()) {
                return "Today, " + new SimpleDateFormat("h:mm a").format(dt);
            }
            return new SimpleDateFormat("MMMM d, yyyy h:mm a").format(dt);
        },

        /**
         * Open a given note in the editing scene, first looking it up by UUID.
         */
        openNoteByUUID: function(uuid) {
            Memento.notes_model.find(uuid, this.openNote.bind(this));
        },

        /**
         * Open a given note in the editing scene, after a possible check
         * against the remote service.
         */
        openNote: function(note) {
            Mojo.log("Opening note " + note.uuid);
            if (!Memento.prefs.sync_enabled || !Memento.prefs.sync_on_open) {
                
                Mojo.log("Skipping remote note check");
                return this._pushNoteScene(note);

            } else {

                // Try fetching the remote note with etag-based conditional
                // get, update the note to be opened only if the remote has
                // changed.
                Memento.notes_service.findNote(
                    note.uuid, note.etag,
                    function(remote_note, resp) {
                        if ('304' == resp.status) {
                            // Use the local note if remote not modified.
                            Mojo.log("Note unmodified on remote");
                        } else {
                            // If the note was updated, use the remote one.
                            Mojo.log("Note changed on remote");
                            note = remote_note;
                        }
                        return this._pushNoteScene(note);
                    }.bind(this),
                    function(resp) {
                        // There was an error fetching from remote, but open
                        // the local note anyway.  Later syncs will sort it out.
                        Mojo.Log.error("Error fetching note from remote");
                        return this._pushNoteScene(note);
                    }.bind(this)

                );
            }
        },

        /**
         * Open the given note in the editing scene.
         */
        _pushNoteScene: function(note) {
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
            Memento.notes_model.find(uuid, function(note) {
                Memento.notes_model.del(note, function() { 
                    this.updateList();
                    if (!Memento.prefs.sync_enabled || !Memento.prefs.sync_on_delete) {
                        Mojo.log("Skipping remote delete for %s", note.uuid);
                    } else {
                        Memento.notes_service.deleteNote(
                            note.uuid, note.etag, false,
                            function () {
                                Mojo.log("Deleted %s from remote", note.uuid);
                            },
                            function () {
                                Mojo.Log.error("Error deleting remote %s", note.uuid);
                            }
                        );
                    }
                }.bind(this));
            }.bind(this));
        },

        /**
         * Available sort choices for notes.
         */
        available_sorts: $H({
            'bydate': {
                label: 'By date',
                /** @inner */
                cmp: function(b,a) {
                    var av = a.modified, bv = b.modified;
                    return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
                }
            },
            'byalpha': {
                label: 'By alpha',
                /** @inner */
                cmp: function(a,b) {
                    var av = a.name, bv = b.name;
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
                        var sort = this.available_sorts.get(order);
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
         * Perform notes sync.
         */
        performSync: function() {
            if (!Memento.prefs.sync_enabled) {
                this.updateList();
            } else {
                Memento.notes_sync.startSync(
                    function() {
                        Mojo.log('Notes sync completed');
                        this.updateList();
                    }.bind(this),
                    function(json) {
                        Mojo.Log.error('Notes sync FAILED');
                    }.bind(this)
                );
            }
        },

        /**
         * Update the list by finding notes in the model.
         */
        updateList: function() {
            Memento.notes_model.findAll(
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
                    Mojo.Log.error('NotesModel findAll() failure');
                }.bind(this)
            );
        },

        /**
         * Refresh the visible list given notes, offset, and count.
         */
        refreshList: function(notes, offset, count) {
            if (!notes) { 
                notes = this.list_model.items;
            }
            if (!offset) {
                offset = 0;
            }
            if (!count) {
                count = notes.length;
            }

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
            if(event.type !== Mojo.Event.command) {
                return;
            }
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
            this.performSync();
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

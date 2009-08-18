/**
 * @fileOverview This file provides a model for notes
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
Note = Class.create(/** @lends Note# */{
    
    /** List of known properties */
    property_names: ['uuid', 'etag', 'name', 'text', 'created', 'modified'],

    /**
     * Note item representation. 
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     *
     * @param {object} data Note properties
     * @param {string} [data.name] Note name
     * @param {string} [data.text] Text content
     * @param {string} [data.uuid] Unique identifier
     * @param {string} [data.etag] Content etag from remote service
     * @param {string} [data.created]  Creation date in ISO8601 format
     * @param {string} [data.modified] Modification date in ISO8601 format
     */
    initialize: function(data) {
        if (!data) {
            data = {};
        }

        this.property_names.each(function(name) {
            if (typeof data[name] != 'undefined') {
                this[name] = data[name];
            }
        }, this);

        if (!this.uuid) {
            this.uuid = Math.uuid().toLowerCase();
        }
        if (!this.created) {
            this.created = (new Date()).toISO8601String();
        }
        if (!this.modified) {
            this.modified = (new Date()).toISO8601String();
        }

    }
});

NotesModel = (function() {

    var DEFAULT_DEPOT = 'Memento_Data';
    var DEFAULT_DEPOT_VERSION = 1;
    var NOTES_BUCKET  = 'notes';
    var NOTES_FILTERS = []; //'name', 'text', 'created', 'modified'];

    return Class.create(/** @lends NotesModel# */{

        depot_version: DEFAULT_DEPOT_VERSION,

        /** 
         * Model for notes storage.
         *
         * @constructs 
         * @author l.m.orchard@pobox.com
         *
         * @param {string} [depot_name="Memento_Data] Name of the depot
         * @param {function} on_success Success callback
         * @param {function} on_fail Failure callback
         */
        initialize: function(depot_name, on_success, on_fail) {

            if (!depot_name) { 
                depot_name = DEFAULT_DEPOT;
            }
            this.depot_name = depot_name;
         
            this.depot = new Mojo.Depot(
                {
                    name:    this.depot_name,
                    version: this.depot_version,
                    replace: false,
                    filters: NOTES_FILTERS
                }, 
                function() { 
                    this.tombstones_model = new NoteTombstonesModel(
                        depot_name, on_success, on_fail
                    );
                }.bind(this), 
                on_fail
            );

        },

        /**
         * Reset the model by deleting all contents.
         *
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        reset: function (on_success, on_fail) {
            this.depot.removeAll(on_success, on_fail);
            
        },
        
        /**
         * Add a new note to the model.
         *
         * @param {object} data Note properties
         * @param {string} [data.name] Note name
         * @param {string} [data.text] Text content
         * @param {string} [data.uuid] Unique identifier
         * @param {string} [data.etag] Content etag from remote service
         * @param {string} [data.created]  Creation date in ISO8601 format
         * @param {string} [data.modified] Modification date in ISO8601 format
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        add: function(data, on_success, on_fail) {
            var note = new Note(data);
            return this.save(note, on_success, on_fail);
        },

        /**
         * Save a single note.
         *
         * @param {Note} Note object
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        save: function (note, on_success, on_fail) {
            if (!note.uuid) {
                note.uuid = Math.uuid().toLowerCase();
            }
            if (!note.created) {
                note.created = (new Date()).toISO8601String();
            }
            if (!note.modified) {
                note.modified = (new Date()).toISO8601String();
            }

            this.depot.addSingle(
                NOTES_BUCKET, note.uuid, note, NOTES_FILTERS,
                function() { on_success(note); },
                on_fail
            );

            return note;
        },

        /**
         * Find a set of notes.
         *
         * @param {string[]} filters
         * @param {integer} limit Limit of result set items
         * @param {offset} offset Offset into result set items
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        findAll: function (filters, limit, offset, on_success, on_fail) {
            this.depot.getMultiple(
                NOTES_BUCKET, filters, 
                limit, offset,
                on_success,
                on_fail
            );
        },

        /**
         * Find a single note by UUID
         *
         * @param {string} UUID
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        find: function (uuid, on_success, on_fail) {
            this.depot.getSingle(
                NOTES_BUCKET, uuid, 
                function (data) {
                    on_success(data);
                },
                on_fail
            );
        },

        /**
         * Delete a single note.
         *
         * @param {Note} Note object
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        del: function (note, on_success, on_fail) {
            this.depot.remove(
                NOTES_BUCKET, note.uuid,
                function (data) {
                    this.tombstones_model.add(
                        { 
                            uuid:     note.uuid, 
                            modified: note.modified, 
                            etag:     note.etag 
                        },
                        on_success, on_fail
                    );
                }.bind(this),
                on_fail
            );
        },

        EOF:null
    });

}());

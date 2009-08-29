/**
 * @fileOverview This file provides a model for notes
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 *
 * @todo refactor this into a general table row mapper
 */
/*jslint laxbreak: true */
/*global Mojo, Memento, Class, NotesModel, Chain, $H, Note, NotesModel, NoteTombstonesModel */
Note = Class.create(Memento.DBObject, /** @lends NoteTombstone# */{

    /** List of known properties */
    property_names: ['id', 'uuid', 'etag', 'name', 'text', 'created', 'modified'],

    /**
     * Note representation
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     * @augments Memento.DBObject
     *
     * @param {object} data            Note properties
     * @param {string} [data.id]       DB ID
     * @param {string} [data.uuid]     Unique identifier
     * @param {string} [data.etag]     Content etag from remote service
     * @param {string} [data.name]     Note name
     * @param {string} [data.text]     Text content
     * @param {string} [data.created]  Creation date in ISO8601 format
     * @param {string} [data.modified] Modification date in ISO8601 format
     */
    initialize: function($super, data) {
        $super(data);

        if (!this.uuid) {
            this.uuid = Math.uuid().toLowerCase();
        }
        if (!this.created) {
            this.created = (new Date()).toISO8601String();
        }
        if (!this.modified) {
            this.modified = (new Date()).toISO8601String();
        }
    },

    EOF: null
});

/**
 * Notes model
 * @class
 * @augments Memento.DBModel
 */
NotesModel =  Class.create(Memento.DBModel, /** @lends NotesModel# */{

    table_name: 'notes',
    
    table_schema: [
        //"DROP TABLE IF EXISTS 'notes'; ",
        "CREATE TABLE IF NOT EXISTS 'notes' (",
        "   'id' INTEGER PRIMARY KEY AUTOINCREMENT,",
        "   'uuid' TEXT NOT NULL UNIQUE ON CONFLICT REPLACE,",
        "   'etag' TEXT,",
        "   'name' TEXT DEFAULT '',",
        "   'text' TEXT DEFAULT '',",
        "   'created' TEXT NOT NULL,",
        "   'modified' TEXT NOT NULL",
        ")"
    ].join(' '),

    row_class: Note,

    /**
     * Set up the model, along with the associated tombstones model.
     */
    initialize: function($super, db_name, on_success, on_fail) {
        $super(db_name, function (t, r) { 
            this.tombstones_model = new NoteTombstonesModel(
                null, on_success, on_fail
            );
        }.bind(this), on_fail);
    },

    /**
     * Reset the model by deleting all items, including associated tombstones.
     *
     * @param {function} on_success Success callback
     * @param {function} on_failure Failure callback
     */
    reset: function ($super, on_success, on_fail) {
        $super(function () {
            this.tombstones_model.reset(on_success, on_fail);
        }.bind(this), on_fail);
    },

    /**
     * Find notes, and merge in tombstones.
     *
     * @param {hash}     criteria   Search griteria
     * @param {int}      limit      Maximum objects to return
     * @param {int}      offset     Offset into record set to return
     * @param {function} on_success Callback function for query success
     * @param {function} on_fail    Callback function for query failure
     */
    findAllWithTombstones: function (criteria, limit, offset, on_success, on_fail) {

        // First, find all the existing items.
        this.findAll(
            criteria, limit, offset,
            function (items) {

                // Next, find the tombstones.
                this.tombstones_model.findAll(
                    criteria, limit, offset,
                    function (tombstones) {

                        // Flag the tombstones before merge, to discriminate
                        // from existing items.
                        tombstones = tombstones.map(function(t) {
                            t.tombstone = true; 
                            return t;
                        });

                        // Merge the two lists into one flat set, sort by
                        // modification time.
                        var merged = [ items, tombstones ].flatten();
                        merged.sort(function(a,b) {
                            var av = a.modified, bv = b.modified;
                            return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
                        });

                        // All done, return the finished set.
                        on_success(merged);

                    }.bind(this),
                    on_fail
                );

            }.bind(this),
            on_fail
        );
    },

    /**
     * Find a single note by UUID.
     *
     * @param {string}   uuid UUID
     * @param {function} on_success Success callback
     * @param {function} on_failure Failure callback
     */
    findByUUID: function (uuid, on_success, on_fail) {
        this.findAll(
            { where: ['uuid=?', uuid] }, 1, 0,
            function (rows) {
                on_success((rows.length) ? rows[0] : null);
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
    del: function ($super, note, on_success, on_fail) {

        this.db.transaction(function (t) {
            var sql, params;
            if (!note.id) {
                sql = "DELETE FROM " + this.table_name + " WHERE uuid=?";
                params = [ note.uuid ];
            } else {
                sql = "DELETE FROM " + this.table_name + " WHERE id=?";
                params = [ note.id ];
            }
            t.executeSql(sql, params, 
                function(t, r) { 
                    // Pair every note deletion with a tombstone save.
                    this.tombstones_model.save(
                        new NoteTombstone(note),
                        on_success, on_fail
                    );
                }.bind(this), 
                on_fail
            );
        }.bind(this));

    },

    EOF: null
});

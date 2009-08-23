/**
 * @fileOverview This file provides a model for notes
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 *
 * @todo refactor this into a general table row mapper
 */
/*jslint laxbreak: true */
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
                var row = (rows.length) ? rows[0] : null;
                on_success(row);
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
                    t.executeSql(
                        'INSERT INTO tombstones (uuid, modified, etag) ' +
                            'VALUES (?,?,?)',
                        [ note.uuid, note.modified, note.etag ],
                        on_success,
                        on_fail
                    );
                }.bind(this), 
                on_fail
            );
        }.bind(this));

    },

    EOF: null
});

/**
 * @fileOverview This file provides a model for deleted note tombstones
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 *
 * @todo refactor this into a general table row mapper
 */
/*jslint laxbreak: true */

NoteTombstone = Class.create(/** @lends NoteTombstone# */{

    /** List of known properties */
    property_names: [ 'uuid', 'modified', 'etag' ],

    /**
     * Deleted note tombstone representation
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     *
     * @param {object} data Tombstone properties
     * @param {string} data.uuid       Unique identifier
     * @param {string} [data.modified] Time in ISO8601 when note was deleted
     * @param {string} [data.etag]     Etag expected on server side for sync
     *
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
        if (!this.modified) {
            this.modified = (new Date()).toISO8601String();
        }
    },

    EOF: null
});

NoteTombstonesModel = (function () { 
    
    var DEFAULT_DB_NAME = 'Memento_Data';
    var DEFAULT_DB_VERSION = 1;

    var DB_SCHEMA = [
        "CREATE TABLE IF NOT EXISTS 'tombstones' (",
        "   'id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,",
        "   'uuid' TEXT NOT NULL,",
        "   'etag' TEXT DEFAULT '',",
        "   'modified' TEXT NOT NULL,",
        "   UNIQUE ('id', 'uuid')",
        ")"
    ].join(' ');

    return Class.create(/** @lends NoteTombstonesModel# */{

        /**
         * Deleted note tombstone representation
         *
         * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
         * @constructs
         *
         */
        initialize: function(db_name, on_success, on_fail) {
            this.db_name    = db_name || DEFAULT_DB_NAME;
            this.db_version = DEFAULT_DB_VERSION;

            this.db = openDatabase(
                this.db_name, this.db_version, this.db_name
            );
            if (!this.db) {
                on_fail();
            }

            this.db.transaction(function (t) {
                t.executeSql(DB_SCHEMA, [], on_success, on_fail);
            });
        },

        /**
         * Reset the model by deleting all contents.
         *
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        reset: function (on_success, on_fail) {
            this.db.transaction(function (t) {
                t.executeSql("DELETE FROM 'tombstones' WHERE 1=1", [],
                    on_success, on_fail);
            });
        },

        /**
         * Add a new tombstone
         *
         * @param {object}   data          Data to store as a tombstone
         * @param {string}   data.uuid     Unique identifier
         * @param {string}   data.modified Time in ISO8601 when note was deleted
         * @param {string}   [data.etag]   Etag expected on server side for sync
         * @param {function} on_success   Success callback
         * @param {function} on_failure   Failure callback
         */
        add: function (data, on_success, on_fail) {
            var cols = [],
                vals = [],
                sql  = [];
            
            $H(data).each(function(pair) {
                cols.push(pair.key);
                vals.push(pair.value || '');
            });

            sql = [
                "INSERT INTO 'tombstones'",
                "(" + cols.join(', ') + ")",
                "VALUES",
                "(" + cols.map(function (c) { return '?'; }).join(', ') + ")"
            ];

            this.db.transaction(function (t) {
                t.executeSql(sql.join(' '), vals, on_success, on_fail);
            });
        },

        /**
         * Fetch objects from the database.
         *
         * @param {int}      limit      Maximum objects to return
         * @param {int}      offset     Offset into record set to return
         * @param {function} on_success Callback function for query success
         * @param {function} on_fail    Callback function for query failure
         */
        findAll: function (limit, offset, on_success, on_fail) {
            var sql = [ "SELECT * FROM 'tombstones'" ];
            var params = [];
            if (limit) {
                sql.push("LIMIT ?");
                params.push(limit);
            }
            if (offset) {
                sql.push("OFFSET ?");
                params.push(offset);
            }

            this.db.transaction(function (t) {
                t.executeSql(
                    sql, [],
                    function(t, results) {
                        var objs = [],
                            rows = results.rows;
                        for (var i=0; i<rows.length; i++) {
                            objs.push(new NoteTombstone(rows.item(i)));
                        }
                        on_success(objs);
                    },
                    on_fail
                );
            });
        },
            
        EOF: null
    });

}());

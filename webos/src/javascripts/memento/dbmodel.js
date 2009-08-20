/**
 * @fileOverview This file provides a model abstraction for the database
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
Memento.DBObject = Class.create(/** @lends Memento.DBObject# */{

    property_names: ['id', 'created', 'modified'],

    /**
     * Note item representation. 
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     *
     * @param {object} data Object properties
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
    },

    /**
     * Convert the contents of this object into a hash suitable for database
     * storage.
     *
     * @return {hash}
     */
    asHash: function() {
        return $H(this);
    }

});


Memento.DBModel = Class.create(/** @lends Memento.DBModel# */{

    db_name: 'Memento_Data',
    db_version: 1,

    table_name: 'dbmodel',
   
    table_schema: [
        "CREATE TABLE IF NOT EXISTS 'dbmodel' (",
        "   'id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,",
        "   'created' TEXT NOT NULL,",
        "   'modified' TEXT NOT NULL,",
        "   UNIQUE ('id')",
        ")"
    ].join(' '),

    /** 
     * Abstract DB model class.
     *
     * @constructs 
     * @author l.m.orchard@pobox.com
     *
     * @param {string} [depot_name="Memento_Data] Name of the depot
     * @param {function} on_success Success callback
     * @param {function} on_fail Failure callback
     */
    initialize: function(db_name, on_success, on_fail) {
        this.db_name    = db_name || this.db_name;
        this.db_version = this.db_version;

        this.db = 
            openDatabase(this.db_name, this.db_version, this.db_name);
        if (!this.db) { on_fail(); }

        this.db.transaction(function (t) {
            t.executeSql(this.table_schema, [], on_success, on_fail);
        }.bind(this));
    },

    /**
     * Reset the model by deleting all contents.
     *
     * @param {function} on_success Success callback
     * @param {function} on_failure Failure callback
     */
    reset: function (on_success, on_fail) {
        this.db.transaction(function (t) {
            t.executeSql("DELETE FROM '"+this.table_name+"' WHERE 1=1", [],
                on_success, on_fail);
        }.bind(this));
    },

    /**
     * Add a new row
     *
     * @param {object}   data          Data to store as a row
     * @param {function} on_success   Success callback
     * @param {function} on_failure   Failure callback
     */
    add: function (data, on_success, on_fail) {
        var cols      = [],
            vals      = [],
            sql       = [],
            data_hash = null;

        if (typeof data.asHash == 'function') {
            data_hash = data.asHash();
        } else {
            data_hash = $H(data);
        }
            
        data_hash.each(function(pair) {
            cols.push(pair.key);
            vals.push(pair.value || '');
        });

        sql = [
            "INSERT INTO '"+this.table_name+"'",
            "(" + cols.join(', ') + ")",
            "VALUES",
            "(" + cols.map(function (c) { return '?'; }).join(', ') + ")"
        ];

        this.db.transaction(function (t) {
            t.executeSql(sql.join(' '), vals, on_success, on_fail);
        }.bind(this));
    },

    /**
     * Fetch objects from the database.
     *
     * @param {hash}     criteria   Search griteria
     * @param {int}      limit      Maximum objects to return
     * @param {int}      offset     Offset into record set to return
     * @param {function} on_success Callback function for query success
     * @param {function} on_fail    Callback function for query failure
     */
    findAll: function (criteria, limit, offset, on_success, on_fail) {
        var sql = [ "SELECT * FROM '"+this.table_name+"'" ];
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
        }.bind(this));
    },
        
    EOF: null

});

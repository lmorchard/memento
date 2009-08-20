/**
 * @fileOverview This file provides a model for deleted note tombstones
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 *
 * @todo refactor this into a general table row mapper
 */
/*jslint laxbreak: true */
NoteTombstone = Class.create(Memento.DBObject, /** @lends NoteTombstone# */{

    /** List of known properties */
    property_names: [ 'uuid', 'modified', 'etag' ],

    /**
     * Deleted note tombstone representation
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     * @augments Memento.DBObject
     *
     * @param {object} data Tombstone properties
     * @param {string} data.uuid       Unique identifier
     * @param {string} [data.modified] Time in ISO8601 when note was deleted
     * @param {string} [data.etag]     Etag expected on server side for sync
     *
     */
    initialize: function($super, data) {
        $super(data);

        if (!this.modified) {
            this.modified = (new Date()).toISO8601String();
        }
    },

    EOF: null
});

/**
 * Deleted note model
 * @class
 * @augments Memento.DBModel
 */
NoteTombstonesModel = (function () { 
    
    return Class.create(Memento.DBModel, /** @lends NoteTombstonesModel# */{

        table_name: 'tombstones',
        
        table_schema: [
            "CREATE TABLE IF NOT EXISTS 'tombstones' (",
            "   'id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,",
            "   'uuid' TEXT NOT NULL,",
            "   'etag' TEXT DEFAULT '',",
            "   'modified' TEXT NOT NULL,",
            "   UNIQUE ('id', 'uuid')",
            ")"
        ].join(' '),

        EOF: null
    });

}());

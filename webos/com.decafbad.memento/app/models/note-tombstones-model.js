/**
 * @fileOverview This file provides a model for deleted note tombstones
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
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
     * @param {string} [data.uuid] Unique identifier
     * @param {string} [data.modified] Time in ISO8601 when note was deleted
     * @param {string} [data.etag] Etag expected on server side for sync
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
        
    return Class.create(/** @lends NoteTombstonesModel# */{

        /**
         * Deleted note tombstone representation
         *
         * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
         * @constructs
         *
         */
        initialize: function(depot_name, on_success, on_fail) {
            window.setTimeout(on_success, 1);
        },

        /**
         * Reset the model by deleting all contents.
         *
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        reset: function (on_success, on_fail) {
            window.setTimeout(on_success, 1);
            //this.depot.removeAll(on_success, on_fail);
        },
            
        EOF: null
    });

}());

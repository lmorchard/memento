/**
 * @fileOverview Memento web API service
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
Memento.Service = function(options) {
    this.initialize(options);
};

Memento.Service.prototype = function() {

    var defaults = {
        service_url: 'http://dev.memento.decafbad.com/'
    };

    return /** @lends Memento.Service# */ {

        /**
         * Memento.Service wrapper for web API
         *
         * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
         * @constructs
         */
        initialize: function(options) {
            this.options = defaults;
            Object.extend(this.options, options || {});
        },

        /**
         * Delete all notes
         *
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        deleteAllNotes: function(on_success, on_failure) {
            var url = this.options.service_url;
            var req = new Ajax.JSONRequest(url, {
                method: 'DELETE',
                // Only a 410 status is actually considered a success.
                on410:     on_success,
                onSuccess: on_failure, 
                onFailure: on_failure
            });
        },

        /**
         * Find a set of notes.
         *
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        findAllNotes: function(criteria, on_success, on_failure) {
            var url = this.options.service_url;
            var req = new Ajax.JSONRequest(url, {
                method: 'GET',
                parameters: criteria || {},
                onSuccess: function(data, resp) { 
                    on_success(data, resp);
                }, 
                onFailure: function(data, resp) {
                    on_failure(data, resp);
                }
            });
        },

        /**
         * Find a single note by UUID and etag
         *
         * @param {string} uuid Note UUID
         * @param {string} etag Server content etag
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        findNote: function(uuid, etag, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + uuid;
            var headers = {};
            if (etag) {
                headers['If-None-Match'] = etag;
            }
            var req = new Ajax.JSONRequest(url, {
                method: 'GET',
                requestHeaders: headers,
                onSuccess: function(data, resp) {
                    data.etag = resp.getHeader('etag');
                    on_success(data, resp);
                }, 
                on304: function(resp) {
                    on_success(null, resp);
                },
                on404: function(data, resp) {
                    on_failure();
                },
                onFailure: function(data, resp) {
                    on_failure();
                }
            });
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
        addNote: function(data, on_success, on_failure) {
            var url = this.options.service_url;
            var req = new Ajax.JSONRequest(url, {
                method: 'POST', postBody: data,
                onSuccess: on_success, onFailure: on_failure
            });
        },

        /**
         * Delete a single note.
         *
         * @param {string} uuid Note UUID
         * @param {string} etag Server content etag
         * @param {boolean} force_delete Whether or not to force a delete.
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        deleteNote: function(uuid, etag, force_delete, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + uuid;
            var headers = {};
            if (!force_delete && etag) {
                // Make sure to only delete what we think we're deleting.
                headers['If-Match'] = etag;
            }
            var req = new Ajax.JSONRequest(url, {
                method: 'DELETE',
                requestHeaders: headers,
                // Only a 410 status is actually considered a success.
                on410:     on_success,
                onSuccess: on_failure,
                onFailure: on_failure
            });
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
         * @param {boolean} force_overwrite Whether or not to force an overwrite
         * @param {function} on_success Success callback
         * @param {function} on_failure Failure callback
         */
        saveNote: function(data, force_overwrite, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + data.uuid;
            var headers = {};
            if (!force_overwrite) {
                if (data.etag) {
                    headers['If-Match'] = data.etag;
                } else {
                    headers['If-None-Match'] = '*';
                }
            }
            var req = new Ajax.JSONRequest(url, {
                method: 'PUT', postBody: data,
                requestHeaders: headers,
                onSuccess: function(note, resp) {
                    on_success(note, resp);
                },
                onFailure: on_failure
            });
        },

        EOF:null
    };

}();

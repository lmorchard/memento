/**
 * Memento.Service wrapper for web API
 *
 * @author l.m.orchard@pobox.com
 */
Memento.Service = function(options) {
    this.initialize(options);
}

Memento.Service.prototype = function() {

    var defaults = {
        service_url: 'http://dev.memento.decafbad.com/'
    };

    /** @lends Memento.Service# */
    return {

        /**
         * @constructs
         */
        initialize: function(options) {
            this.options = defaults;
            Object.extend(this.options, options || {});
        },

        deleteAllNotes: function(on_success, on_failure) {
            var url = this.options.service_url;
            new Ajax.JSONRequest(url, {
                method: 'DELETE',
                // Only a 410 status is actually considered a success.
                on410:     on_success,
                onSuccess: on_failure, 
                onFailure: on_failure
            });
        },

        findAllNotes: function(on_success, on_failure) {
            var url = this.options.service_url;
            new Ajax.JSONRequest(url, {
                method: 'GET',
                onSuccess: on_success, onFailure: on_failure
            });
        },

        findNote: function(uuid, etag, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + uuid;
            var headers = {};
            if (etag) {
                headers['If-None-Match'] = etag;
            }
            new Ajax.JSONRequest(url, {
                method: 'GET',
                requestHeaders: headers,
                onSuccess: function(data, resp) {
                    data.etag = resp.getHeader('etag');
                    on_success(data, resp);
                }, 
                on304: function(resp) {
                    on_success(null, resp);
                },
                onFailure: function(data, resp) {
                    on_failure();
                }
            });
        },

        addNote: function(data, on_success, on_failure) {
            var url = this.options.service_url;
            new Ajax.JSONRequest(url, {
                method: 'POST', postBody: data,
                onSuccess: on_success, onFailure: on_failure
            });
        },

        deleteNote: function(uuid, etag, force_delete, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + uuid;
            var headers = {};
            if (!force_delete && etag) {
                // Make sure to only delete what we think we're deleting.
                headers['If-Match'] = etag;
            }
            new Ajax.JSONRequest(url, {
                method: 'DELETE',
                requestHeaders: headers,
                // Only a 410 status is actually considered a success.
                on410:     on_success,
                onSuccess: on_failure,
                onFailure: on_failure
            });
        },

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
            new Ajax.JSONRequest(url, {
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

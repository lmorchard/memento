/**
 * MementoService wrapper for web API
 *
 * @author l.m.orchard@pobox.com
 */
function MementoService(options) {
    this.initialize(options);
}

MementoService.prototype = function() {

    var defaults = {
        service_url: 'http://192.168.123.62/~lorchard/memento/'
    };

    return {

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
                onSuccess: on_failure, onFailure: on_failure
            });
        },

        findAllNotes: function(on_success, on_failure) {
            var url = this.options.service_url;
            new Ajax.JSONRequest(url, {
                method: 'GET',
                onSuccess: on_success, onFailure: on_failure
            });
        },

        findNote: function(uuid, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + uuid;
            new Ajax.JSONRequest(url, {
                method: 'GET',
                onSuccess: on_success, onFailure: on_failure
            });
        },

        addNote: function(data, on_success, on_failure) {
            var url = this.options.service_url;
            new Ajax.JSONRequest(url, {
                method: 'POST', postBody: data,
                onSuccess: on_success, onFailure: on_failure
            });
        },

        saveNote: function(data, on_success, on_failure) {
            var url = this.options.service_url + 'notes/' + data.uuid;
            new Ajax.JSONRequest(url, {
                method: 'PUT', postBody: data,
                onSuccess: on_success, onFailure: on_failure
            });
        },

        EOF:null
    };

}();

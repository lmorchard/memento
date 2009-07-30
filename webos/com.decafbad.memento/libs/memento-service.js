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
            var url = this.options.service_url + '?format=json';
            new Ajax.Request(url, {
                method: 'delete', evalJSON: true,
                // Only a 410 status is actually considered a success.
                onSuccess: on_failure, 
                onFailure: on_failure, 
                on410:     on_success
            });
        },

        findAllNotes: function(on_success, on_failure) {
            var url = this.options.service_url + '?format=json';
            new Ajax.Request(url, {
                method: 'get', evalJSON: true,
                onSuccess: function(req) {
                    var notes = req.responseJSON || [];
                    on_success(notes, req);
                }, 
                onFailure: function(req) {
                    on_failure(req);
                }
            });
        },

        addNote: function(data, on_success, on_failure) {
            var url = this.options.service_url + '?format=json';
            new Ajax.Request(url, {
                method: 'post', 
                evalJSON: true,
                contentType: 'application/json',
                postBody: $H(data).toJSON(),
                onSuccess: function(req) {
                    on_success(req.responseJSON, req);
                }, 
                onFailure: function(req) {
                    on_failure(req);
                }
            });
        },

        findNote: function(uuid, on_success, on_failure) {
            var url = this.options.service_url + '/notes/' + uuid + '?format=json';
            new Ajax.Request(url, {
                method: 'get', 
                evalJSON: true,
                contentType: 'application/json',
                onSuccess: function(req) {
                    on_success(req.responseJSON, req);
                }, 
                onFailure: function(req) {
                    on_failure(req);
                }
            });
        },

        EOF:null
    };

}();

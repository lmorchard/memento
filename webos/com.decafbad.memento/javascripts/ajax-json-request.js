/**
 * @fileOverview Ajax.Request subclass making a few tweaks useful for requests to a
 *     JSON-based REST API.
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
Ajax.JSONRequest = Class.create(Ajax.Request, /** @lends Ajax.JSONRequest */ {

    /**
     * Initialize with automatic JSON conversion for options.postBody.
     *
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     * @constructs
     */
    initialize: function($super, url, options) {

        // If postBody is an object / array, convert it to JSON.
        if (typeof options.postBody == 'object') {
            options.contentType = 'application/json';
            if (Object.isFunction(options.postBody)) {
                options.postBody = options.postBody.toJSON();
            } else {
                options.postBody = $H(options.postBody).toJSON();
            }
        }

        ['onSuccess','onFailure'].each(function(name) {
            if (options[name]) {
                var orig = options[name];
                options[name] = function(resp) {
                    orig(resp.responseJSON, resp);
                };
            }
        }.bind(this));

        $super(url, options);
    },

    /**
     * Set headers to work with JSON requests and responses, as well as
     * handling the X-HTTP-Method-Override header for non-GET/POST methods.
     */
    setRequestHeaders: function() {

        var headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Prototype-Version': Prototype.Version,
            // Request JSON response bodies from the server.
            'Accept': 'application/json'
        };

        if (this.method == 'post') {
            headers['Content-type'] = this.options.contentType +
                (this.options.encoding ? '; charset=' + this.options.encoding : '');

            if ('post' !== this.options.method) {
                // Set the X-HTTP-Method-Override header, since _method
                // parameter hack doesn't work with a JSON request body.
                // see also: http://code.google.com/apis/gdata/docs/2.0/basics.html
                this.transport.setRequestHeader(
                    'X-HTTP-Method-Override', 
                    this.options.method.toUpperCase()
                );
            }
        }

        // user-defined headers
        if (typeof this.options.requestHeaders == 'object') {
            var extras = this.options.requestHeaders;
            $H(extras).each(function(pair) { 
                headers[pair.key] = pair.value;
            });
        }

        for (var name in headers) {
            if (headers.hasOwnProperty(name)) {
                this.transport.setRequestHeader(name, headers[name]);
            }
        }

    }

});

/**
 * @fileOverview Provides the Chain class.
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
Chain = Class.create(/** @lends Chain */{

    /**
     * Chain of functions, useful in sequencing async calls.
     *
     * @constructs
     * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
     *
     * @param {array} action List of functions for chain
     * @param {object} object Object used as this scope in calls.
     */
    initialize: function(actions, object) {
        this.running = null;
        this.actions = [];
        this.object  = object;

        if (actions) { 
            actions.each(function(action) {
                this.push(action);
            }, this);
        }
    },

    /**
     * Push an action onto the list.
     *
     * @param {string|function} action
     */
    push: function(action) {
        this.actions.push(action);
        return this;
    },

    /**
     * Start running the chain, starting with the first function.
     */
    start: function()  {
        if (null !== this.running) {
            return;
        }
        this.running = false;
        this.next();
        return this;
    },

    /** 
     * Run the next function in the chain.
     */
    next: function()  {
        if (false !== this.running) {
            return;
        }
        if (!this.actions.length) {
            return false;
        }

        var action = this.actions.shift();

        var yield = function() {
            if (arguments.callee.has_run) return;
            arguments.callee_has_run = true;
            if (false === this.running) {
                this.next();
            }
        }.bind(this);

        try {
            if (typeof action == 'string') {
                if (this.object && typeof this.object[action] == 'function') {
                    this.object[action](yield);
                }
            } else if (typeof action == 'function') {
                if (this.object) {
                    action.apply(this.object, [yield]);
                } else {
                    action(yield);
                }
            }
            // Make sure yield has been called.
            yield();
        } catch(e) {
            if (typeof Mojo.Log.logException != 'undefined') {
                Mojo.Log.logException(e);
            }
        }
        return this;
    }

});

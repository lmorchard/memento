/**
 * Chain of functions, useful in sequencing async calls.
 *
 * @class
 * @author l.m.orchard@pobox.com
 */
/*jslint laxbreak: true */
Chain = Class.create(/** @lends Chain */{

    /**
     * Constructor
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

        var done = function() {
            if (false === this.running) {
                this.next();
            }
        }.bind(this);

        if (typeof action == 'string') {
            if (this.object && typeof this.object[action] == 'function') {
                this.object[action](done);
            }
        } else if (typeof action == 'function') {
            if (this.object) {
                action.apply(this.object, [done]);
            } else {
                action(done);
            }
        }
        return this;
    }

});

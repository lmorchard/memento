/**
 * Chain of functions, useful in sequencing async calls.
 *
 * @author l.m.orchard@pobox.com
 */
Chain = Class.create({

    /**
     * Constructor
     *
     * @param {array} List of functions for chain
     */
    initialize: function(actions, object) {
        this.running = null;
        this.actions = [];
        this.object  = object;

        if (actions) { 
            for (var i=0, action; action=actions[i]; i++) {
                this.push(action);
            }
        }
    },

    /**
     * Push an action onto the list.
     *
     * @param {string|function}
     */
    push: function(action) {
        this.actions.push(action);
        return this;
    },

    /**
     * Start running the chain, starting with the first function.
     */
    start: function()  {
        if (null !== this.running) return;
        this.running = false;
        this.next();
        return this;
    },

    /** 
     * Run the next function in the chain.
     */
    next: function()  {
        if (false !== this.running) return;
        if (!this.actions.length) return false;

        var action = this.actions.shift();

        var done = function() {
            if (false == this.running) this.next();
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
    },

});

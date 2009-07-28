/**
 * Chain of functions, useful in sequencing async calls.
 *
 * @author l.m.orchard@pobox.com
 */
var Chain = Class.create({

    /**
     * Constructor
     *
     * @param {array} List of functions for chain
     */
    initialize: function (actions) {
        this.running = null;
        this.actions = [];

        if (actions) { 
            for (var i=0, action; action=actions[i]; i++) {
                this.push(action);
            }
        }
    },

    /**
     * Push a new function onto the end of the chain.
     *
     * When called, this function will be passed a function that, when called,
     * will cause the next function in the chain to be called.
     *
     * @param {function} Function for chain.
     */
    push: function (cb) {
        var done = function () {
            if (false == this.running) this.next();
        }.bind(this);

        this.actions.push(function ()  {
            cb(done);
        });

        return this;
    },

    /**
     * Start running the chain, starting with the first function.
     */
    start: function ()  {
        if (null !== this.running) return;
        this.running = false;
        this.next();
        return this;
    },

    /** 
     * Run the next function in the chain.
     */
    next: function ()  {
        if (false !== this.running) return;
        if (!this.actions.length) return false;
        var action = this.actions.shift();
        action();
        return this;
    },

});

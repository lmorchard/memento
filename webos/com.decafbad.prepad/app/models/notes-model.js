/**
 * Model for notes storage.
 *
 * @author l.m.orchard@pobox.com
 */

Note = Class.create({
    initialize: function(data) {
        if (!data) { return; }

        ['id', 'name', 'text', 'created', 'modified']
            .each(function(name) {
                this[name] = data[name];
            }, this);

        if (!this.created) {
            this.created = (new Date()).getTime();
        }
        if (!this.modified) {
            this.modified = (new Date()).getTime();
        }

    }
});

NotesModel = (function() {

    var DEFAULT_DEPOT = 'PrePadNotes';
    var NOTES_BUCKET  = 'notes';
    var NOTES_FILTERS = ['name', 'text', 'created', 'modified'];

    return Class.create({

        initialize: function(depot_name, on_success, on_fail) {

            if (!depot_name) depot_name = DEFAULT_DEPOT;
            this.depot_name = depot_name;
         
            this.depot = new Mojo.Depot({
                name: this.depot_name,
                replace: false,
                filters: NOTES_FILTERS
            }, on_success, on_fail);

        },

        reset: function (on_success, on_fail) {
            this.depot.removeAll();
        },
        
        add: function(data, on_success, on_fail) {
            var note = new Note(data);
            return this.save(note, on_success, on_fail);
        },

        save: function (note, on_success, on_fail) {
            if (!note.id) {
                note.id = Math.uuid();
            }
            note.modified = (new Date()).getTime();

            this.depot.addSingle(
                NOTES_BUCKET, note.id, note, NOTES_FILTERS,
                function() { on_success(note); },
                on_fail
            );

            return note;
        },

        findAll: function (filters, limit, offset, on_success, on_fail) {
            this.depot.getMultiple(
                NOTES_BUCKET, filters, 
                limit, offset,
                on_success,
                on_fail
            );
        },

        find: function (id, on_success, on_fail) {
            this.depot.getSingle(
                NOTES_BUCKET, id, 
                function (data) {
                    on_success(data);
                },
                on_fail
            );
        },

        del: function (note, on_success, on_fail) {
            this.depot.remove(
                NOTES_BUCKET, note.id,
                function (data) {
                    on_success(note);
                },
                on_fail
            );
        }

    });

}());

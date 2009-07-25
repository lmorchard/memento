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
    var NOTES_BUCKET = 'notes';

    return Class.create({

        initialize: function(depot_name, on_success, on_fail) {

            if (!depot_name) depot_name = DEFAULT_DEPOT;
            this.depot_name = depot_name;
         
            this.depot = new Mojo.Depot({
                name: this.depot_name,
                replace: false
            }, on_success, on_fail);

        },

        reset: function (on_success, on_fail) {
            this.depot = new Mojo.Depot({
                name: this.depot_name,
                replace: true
            }, on_success, on_fail);
        },
        
        add: function(data, on_success, on_fail) {
            var note = new Note(data);
            note.id = Math.uuid();
            return this.save(note, on_success, on_fail);
        },

        save: function (note, on_success, on_fail) {
            note.modified = (new Date()).getTime();

            this.depot.addSingle(
                NOTES_BUCKET, note.id, note, null,
                function() { on_success(note); },
                on_fail
            );

            return note;
        },

        findAll: function () {
            
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

        del: function (note) {
        }

    });

}());

NotesModel_inmemory = (function() {

    var all_notes = [];

    return Class.create({

        initialize: function (data) {
        },

        add: function (data) {
            var note = new Note(data);
            all_notes.push(note);
            note.id = all_notes.length;
            return note;
        },
        
        save: function (saving) {
            all_notes = all_notes.filter(function(note) {
                return note.id !== saving.id;
            }, this);
            saving.modified = new Date();
            all_notes.push(saving);
        },

        findAll: function () {
            return all_notes;
        },

        find: function (id) {
            var found_note = null;
            all_notes.each(function(note) {
                if (note.id === id) {
                    found_note = note;
                }
            });
            return found_note;
        },

        del: function (note) {
            all_notes = all_notes.filter(function(del_note) {
                return del_note.id !== note.id;
            }, this);
        },

        reset: function () {
            all_notes = [];
        }

    });

}());

/**
 *
 */
NotesModel = (function () {

    var Note = Class.create({
        initialize: function (data) {
            if (!data) { return; }
            ['id', 'name', 'text', 'created', 'modified'].each(function (name) {
                this[name] = data[name];
            }, this);
            if (!this.created) {
                this.created = new Date();
            }
            if (!this.modified) {
                this.modified = new Date();
            }
        }
    });

    var all_notes = [];
    ['alpha', 'beta', 'gamma', 'delta'].each(function (name, idx) {
        all_notes.push(new Note({
            id: idx,
            name: name,
            text: 'This is sample text for ' + name
        }));
    });
    
    return Class.create({

        initialize: function (data) {
        },

        findAll: function () {
            return all_notes;
        },

        find: function (id) {
            var found_note = null;
            all_notes.each(function (note) {
                if (note.id === id) {
                    found_note = note;
                }
            });
            return found_note;
        },

        del: function (id) {
            all_notes = all_notes.filter(function (note) {
                return note.id !== id;
            }, this);
        },
        
        save: function (saving) {
            all_notes = all_notes.filter(function (note) {
                return note.id !== saving.id;
            }, this);
            all_notes.push(saving);
        }

    });

}());

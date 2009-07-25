/**
 * Tests for NotesModel
 *
 * @author l.m.orchard@pobox.com
 * @see NotesModel
 */

Sequence = Class.create({

    initialize: function (on_finish, actions) {
        this.running = null;

        this.sync = new Mojo.Function.Synchronize({
            syncCallback: on_finish
        });
        
        this.actions = [];
        if (actions) actions.each(function(action) {
            this.push(action);
        }.bind(this));
    },

    push: function(cb) {
        var sync_done = this.sync.wrap(function(){});

        var done = function(do_next) {
            sync_done();
            if (false == this.running) {
                this.next();
            }
        }.bind(this);

        this.actions.push(function() {
            cb(done) 
        }.bind(this));
    },

    start: function() {
        if (null !== this.running) return;
        this.running = false;
        this.next();
    },

    next: function() {
        if (false !== this.running) return;
        var action = this.actions.shift();
        return action();
    },

    run: function() {
        if (null !== this.running) return;
        this.running = true;
        this.actions.each(function(fn) {
            return fn();
        });
    }

});

NotesModelTests = (function() {
        
    return Class.create({

        /**
         * Set up for a test.
         */
        initialize: function(tickleFunction) {
            this.tickleFunction = tickleFunction;

            this.notes_model = new NotesModel('PrePadNotes_Test');
            this.notes_model.reset();

            this.test_data = [
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 
                'frank', 'george', 'herbert', 'ian', 'jack'
            ].map(function (name, idx) {
                return {
                    name: name,
                    text: 'This is sample text for ' + name
                };
            }.bind(this));
        },

        /**
         * Exercise basic model CRUD.
         */
        testCRUD: function(recordResults) {

            var notes = [];

            var main_seq = new Sequence(
                function() {
                    // Report test passed when the main sequence is done.
                    recordResults(Mojo.Test.passed);
                }
            );

            // Sequence a series of note adds, asserting auto-defined 
            // properties of each upon success.
            main_seq.push(function(main_done) {
                var seq = new Sequence(function() { main_done(); });

                this.test_data.each(function(data, idx) {
                    seq.push(function(done) {

                        var check_note = function (note) { 
                            notes.push(note); 
                            ['id', 'created', 'modified'].each(function(name) {
                                Mojo.require((typeof note[name]) !== 'undefined',
                                    'Note ' + name + ' should be defined');
                            }.bind(this));
                            done(); 
                        }.bind(this)

                        this.notes_model.add(
                            data, check_note, 
                            function() { throw "Note add failed"; }
                        );

                    }.bind(this));
                }.bind(this));

                seq.run();

            }.bind(this));

            // Check contents of known added notes against fetched notes
            main_seq.push(function(main_done) {
                var seq = new Sequence(function() { main_done(); });

                notes.each(function(expected_note) {
                    seq.push(function(done) { 

                        var assert_note = function(result_note) {
                            ['id', 'name', 'text', 'created', 'modified'].each(function(name) {
                                Mojo.requireEqual(result_note[name], expected_note[name],
                                    'Note ' + name + ' should match');
                            }.bind(this));
                            done();
                        }.bind(this);

                        this.notes_model.find(
                            expected_note.id, assert_note,
                            function() { done(); throw "Note find failed"; }
                        );

                    }.bind(this));
                }.bind(this));

                seq.run();

            }.bind(this));

            // Try updating notes and assert that modification date changed.
            main_seq.push(function(main_done) {

                // Waste some time before playing with timestamps.
                var time = function() { return (new Date()).getTime(); },
                    stop = time() + 500;
                while (time() < stop) {  }
                
                // Still alive here, by the way.
                this.tickleFunction();

                var seq = new Sequence(function() { main_done(); });
                notes.each(function(note) {
                    seq.push(function(done) { 

                        var orig_modified = note.modified;

                        note.name += '_changed';
                        note.text = 'Changed note ' + note.name;

                        var check_date = function(result_note) {
                            this.notes_model.find(
                                result_note.id,
                                function(fetched) {
                                    Mojo.require(orig_modified != fetched.modified,
                                        "Modification dates should differ after save");
                                    done();
                                },
                                function() { throw "Note find failed"; }
                            );
                        }.bind(this);

                        this.notes_model.save(
                            note, check_date,
                            function() { throw "Note add failed"; }
                        );

                    }.bind(this));
                }.bind(this));

                seq.run();
            }.bind(this));

            main_seq.push(function(main_done) {
                main_done();
            }.bind(this));

            main_seq.start();

            /*


            // Delete all notes, assert that they're not found.
            notes.each(function(note) {
                this.notes_model.del(note);
            }.bind(this));
            notes.each(function(note) {
                var result_note = this.notes_model.find(note.id);
                Mojo.require(null === result_note,
                    'Deleted note should not be found.');
            }.bind(this));

            return Mojo.Test.passed;
            */
        },

        EOF:null
    });

}());

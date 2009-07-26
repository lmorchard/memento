/**
 * Tests for NotesModel
 *
 * @author l.m.orchard@pobox.com
 * @see NotesModel
 */
function NotesModelTests(tickleFunction) {
    this.initialize(tickleFunction);
}
NotesModelTests.prototype = function() {
        
    return {

        /**
         * Test setup, run before execution of each test.
         */
        initialize: function (tickleFunction) {
            this.name = "Notes Model";
            this.tickleFunction = tickleFunction;

            this.notes_model = new NotesModel('PrePadNotes_Test');
            this.notes_model.reset();

            this.notes = [];
            this.by_id = {};

            this.test_data = [
                'alpha', 'beta', 'gamma', 'delta', 'epsilon', 
                'frank', 'george', 'herbert', 'ian', 'jack'
            ].map(function (name, idx) {
                return {
                    name: name,
                    text: 'This is sample text for ' + name
                };
            }, this);
           
        },

        /**
         * Exercise basic add/delete.
         */
        testAddDelete: function(recordResults) {
            new Chain([
                this._ensureEmpty.bind(this),
                this._addNotes.bind(this),
                this._deleteNotes.bind(this),
                this._ensureEmpty.bind(this),
                function() { recordResults(Mojo.Test.passed); }
            ]).start();
        },

        /**
         * Exercise basic add/delete.
         */
        testCreateAndAdd: function(recordResults) {
            new Chain([
                this._ensureEmpty.bind(this),
                this._createAndAddNotes.bind(this),
                this._deleteNotes.bind(this),
                this._ensureEmpty.bind(this),
                function() { recordResults(Mojo.Test.passed); }
            ]).start();
        },

        /**
         * Exercise finding single notes by ID.
         */
        testFind: function(recordResults) {
            new Chain([
                this._addNotes.bind(this),
                this._checkSavedNotes.bind(this),
                function() { recordResults(Mojo.Test.passed); }
            ]).start();
        },

        /**
         * Exercise finding multiple notes by filter.
         */
        testFindAll: function(recordResults) {
            new Chain([
                this._addNotes.bind(this),
                this._checkMultipleSavedNotes.bind(this),
                function() { recordResults(Mojo.Test.passed); }
            ]).start();
        },

        /**
         * Exercise Modification date updates on save.
         */
        testModificationDates: function (recordResults) {
            new Chain([
                this._addNotes.bind(this),
                this._checkModificationDates.bind(this),
                function() { recordResults(Mojo.Test.passed); }
            ]).start();
        },

        /**
         * Ensure that there are no saved notes at first.
         */
        _ensureEmpty: function (main_done) {
            this.notes_model.findAll(
                null, null, null,
                function(notes) {
                    Mojo.require(
                        0 == notes.length, 
                        "Notes should be empty at first"
                    );
                    main_done();
                }.bind(this),
                function() { throw "Note findAll failed"; }
            );
        },

        /**
          * Chain a series of note adds, asserting auto-defined 
          * properties of each upon success.
          */
        _addNotes: function (main_done) {
            var chain = new Chain();

            this.test_data.each(function (data) {
                chain.push(function (done) {

                    var check_note = function (note) {

                        // Retain the note just saved.
                        this.notes.push(note); 
                        this.by_id[note.uuid] = note;

                        // Ensure some properties were auto-set.
                        ['uuid', 'created', 'modified'].each(function (name) {
                            Mojo.require(
                                (typeof note[name]) !== 'undefined',
                                'Note ' + name + ' should be defined'
                            );
                        }.bind(this));

                        done();
                    }.bind(this);

                    this.notes_model.add(
                        data, 
                        check_note,
                        function() { throw "Note add failed"; }
                    );

                }.bind(this))
            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
          * Chain a series of note adds, asserting auto-defined 
          * properties of each upon success.
          */
        _createAndAddNotes: function (main_done) {
            var chain = new Chain();

            this.test_data.each(function (data) {
                chain.push(function (done) {

                    var check_note = function (note) {

                        // Retain the note just saved.
                        this.notes.push(note); 
                        this.by_id[note.uuid] = note;

                        // Ensure some properties were auto-set.
                        ['uuid', 'created', 'modified'].each(function (name) {
                            Mojo.require(
                                (typeof note[name]) !== 'undefined',
                                'Note ' + name + ' should be defined'
                            );
                        }.bind(this));

                        done();
                    }.bind(this);

                    var new_note = new Note(data);

                    this.notes_model.save(
                        new_note, 
                        check_note,
                        function() { throw "Note save failed"; }
                    );

                }.bind(this))
            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
         * Check contents of notes, an individual fetch at a time.
         */
        _checkSavedNotes: function (main_done) {
            var chain = new Chain();
            var prop_names = [
                'uuid', 'name', 'text', 'created', 'modified'
            ];

            this.notes.each(function (expected_note) {
                chain.push(function (done) { 

                    var check_note = function(result_note) {
                        prop_names.each(function(name) {
                            Mojo.requireEqual(
                                result_note[name], expected_note[name],
                                'Note ' + name + ' should match'
                            );
                        }.bind(this)),
                        done();
                    }.bind(this)

                    this.notes_model.find(
                        expected_note.uuid, 
                        check_note,
                        function() { throw "Note find failed"; }
                    );

                }.bind(this))
            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
         * Check contents of notes by fetching multiples at once.
         */
        _checkMultipleSavedNotes: function (main_done) {
            var prop_names = [
                'uuid', 'name', 'text', 'created', 'modified'
            ];

            this.notes_model.findAll(
                null, null, null,
                function(notes) {
                    notes.each(function(result) {

                        var expected = this.by_id[result.uuid];
                        prop_names.each(function(name) {
                            Mojo.requireEqual(
                                result[name], expected[name],
                                'Note ' + name + ' should match'
                            );
                        }, this);

                    }, this);
                    main_done();
                }.bind(this),
                function() { throw "Note findAll failed"; }
            );

        },

        /**
         * Try updating notes and assert that modification date changed.
         */
        _checkModificationDates: function (main_done) {

            // Waste some time before playing with timestamps.
            var time = function ()  { return (new Date()).getTime(); },
                stop = time() + 500;
            while (time() < stop) {  }
                
            // Still alive here, by the way.
            this.tickleFunction() ;

            var chain = new Chain();

            this.notes.each(function(note) {
                var orig_modified = note.modified;
                
                chain.push(function(done) {
                    note.name += '_changed';
                    note.text = 'Changed note ' + note.name;

                    this.notes_model.save(
                        note, 
                        function(saved) {
                            Mojo.require(
                                orig_modified !== saved.modified,
                                "Saved modification date should differ"
                            );
                            done();
                        }.bind(this),
                        function() { throw "Note save failed"; }
                    )
                }.bind(this));

                chain.push(function(done) {
                    this.notes_model.find(
                        note.uuid,
                        function (fetched) {
                            Mojo.require(orig_modified != fetched.modified,
                                "Fetched modification date should differ");
                            done();
                        },
                        function() { throw "Note find failed"; }
                    );
                }.bind(this));

            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
         * Delete notes, and them ensure they're gone.
         */
        _deleteNotes: function (main_done) {
            var chain = new Chain();

            this.notes.each(function(note) {
                var note_id = note.uuid;

                chain.push(function(done) {
                    this.notes_model.del(
                        note,
                        function() { done(); },
                        function() { throw "Note delete failed"; }
                    );
                }.bind(this));

                chain.push(function(done) {
                    this.notes_model.find(
                        note_id,
                        function(fetched) { 
                            Mojo.require(null === fetched,
                                "Note should not be found");
                            done();
                        },
                        function() { throw "Note find failed"; }
                    );
                }.bind(this));

            }, this);

            chain.push(main_done);
            chain.start();
        },

        EOF:null
    };

}();

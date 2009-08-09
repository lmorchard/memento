/**
 * Tests for MementoService
 *
 * @author l.m.orchard@pobox.com
 * @see MementoService
 */
function MementoServiceTests(tickleFunction) {
    this.initialize(tickleFunction);
}
MementoServiceTests.prototype = function() {

    // Monkey patch the JSONRequest class to set the test environment
    // override header.
    var orig_json_request = Ajax.JSONRequest;
    Ajax.JSONRequest = Class.create(orig_json_request, {
        initialize: function($super, url, options) {
            if (!options.requestHeaders) {
                options.requestHeaders = {};
            }
            options.requestHeaders['X-Environment-Override'] = 'tests';
            $super(url, options);
        }
    });
        
    return {
        timeoutInterval: 5000,

        /**
         * Test setup, run before execution of each test.
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;
            
            this.memento_service = new Memento.Service({
                service_url: 'http://dev.memento.decafbad.com/'
            });

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
                '_deleteNotes',
                '_ensureEmpty',
                '_addNotes',
                '_deleteNotes',
                '_ensureEmpty',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise finding single notes by ID.
         */
        testFind: function(recordResults) {
            new Chain([
                '_deleteNotes',
                '_addNotes',
                '_checkSavedNotes',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise finding multiple notes by filter.
         */
        testFindAll: function(recordResults) {
            new Chain([
                '_deleteNotes',
                '_addNotes',
                '_checkMultipleSavedNotes',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise Modification date updates on save.
         */
        testModificationDates: function (recordResults) {
            new Chain([
                '_deleteNotes',
                '_addNotes',
                '_checkModificationDates',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Ensure that there are no saved notes at first.
         */
        _ensureEmpty: function(main_done) {
            this.memento_service.findAllNotes(
                function(notes) {
                    Mojo.requireEqual(
                        notes.length, 0, "Notes should be empty."
                    );
                    main_done();
                }.bind(this),
                function() { throw "findAllNotes failure" }
            );
        },

        /**
          * Chain a series of note adds, asserting auto-defined 
          * properties of each upon success.
          */
        _addNotes: function(main_done) {
            var chain = new Chain();

            this.test_data.each(function (data) {
                chain.push(function (done) {

                    var check_note = function (note) {
                    try{
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
                        } catch(e) { Mojo.Log.logException(e) }
                    }.bind(this);

                    this.tickleFunction();

                    this.memento_service.addNote(
                        data, check_note, function() { throw "Note add failed"; }
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

                    this.tickleFunction();

                    this.memento_service.findNote(
                        expected_note.uuid, check_note,
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
                'uuid', 'name', 'created', 'modified'
            ];

            this.tickleFunction();

            this.memento_service.findAllNotes(
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
                stop = time() + 1000;
            while (time() < stop) {  }
                
            this.tickleFunction() ;

            var chain = new Chain();

            this.notes.each(function(note) {
                var orig_modified = note.modified;
                
                chain.push(function(done) {
                    note.name += '_changed';
                    note.text = 'Changed note ' + note.name;

                    this.tickleFunction();

                    this.memento_service.saveNote(
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
                    this.tickleFunction();

                    this.memento_service.findNote(
                        note.uuid,
                        function (fetched) {
                            Mojo.require(
                                orig_modified != fetched.modified,
                                "Fetched modification date should differ"
                            );
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
        _deleteNotes: function(main_done) {
            this.memento_service.deleteAllNotes(
                main_done, function() { throw "deleteAllNotes failure" }
            );
        },

        EOF:null
    };
}();

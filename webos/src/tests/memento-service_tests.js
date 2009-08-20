/**
 * @fileOverview Tests for MementoService
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Mojo, Memento, Chain, Class, Ajax */
function MementoServiceTests(tickleFunction) {
    this.initialize(tickleFunction);
}
// Extra long timeout to account for slow network.
MementoServiceTests.timeoutInterval = 4000;

MementoServiceTests.prototype = (function () {

    var test_service_url =
        'http://tester:tester@dev.memento.decafbad.com/profiles/tester/';

    var test_data = [
        {
            uuid:     "a-001",
            name:     "alpha",
            text:     "This is note alpha (model)",
            created:  "2009-08-07T02:00:20+00:00",
            modified: "2009-08-07T03:00:00+00:00"
        },
        {
            uuid:     "b-001",
            name:     "beta",
            text:     "This is note beta (model)",
            created:  "2009-08-07T04:00:20+00:00",
            modified: "2009-08-07T05:00:00+00:00"
        },
        {
            uuid:     "d-001",
            name:     "delta",
            text:     "This is note delta",
            created:  "2009-08-07T04:00:20+00:00",
            modified: "2009-08-07T05:00:00+00:00"
        },
        {
            uuid:     "g-001",
            name:     "gamma",
            text:     "This is note gamma (model)",
            created:  "2009-08-08T03:00:20+00:00",
            modified: "2009-08-08T04:00:00+00:00"
        },
        {
            uuid:     "e-001",
            name:     "epsilon",
            text:     "This is note epsilon (model)",
            created:  "2009-08-08T08:00:20+00:00",
            modified: "2009-08-08T09:00:00+00:00"
        }
    ];

    // Monkey patch the JSONRequest class to set the test environment
    // override header.
    /*
    var orig_json_request = Ajax.JSONRequest;
    Ajax.JSONRequest = Class.create(orig_json_request, {
        initialize: function ($super, url, options) {
            if (!options.requestHeaders) {
                options.requestHeaders = {};
            }
            options.requestHeaders['X-Environment-Override'] = 'tests';
            $super(url, options);
        }
    });
    */
        
    return /** @lends MementoServiceTests */ {
        timeoutInterval: 5000,

        /**
         * Test setup, run before execution of each test.
         *
         * @constructs
         * @author l.m.orchard@pobox.com
         * @see Memento.Service
         *
         * @param {function} Test tickle function
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;
            
            this.memento_service = new Memento.Service({
                service_url: test_service_url
            });

            this.notes = [];
            this.by_id = {};
        },

        /**
         * Exercise basic add/delete.
         */
        testServiceAddDelete: function (recordResults) {
            var chain = new Chain([
                '_deleteAllNotes',
                '_ensureEmpty',
                '_addNotes',
                '_deleteAllNotesOneByOne',
                '_ensureEmpty',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise finding single notes by ID.
         */
        testServiceFind: function (recordResults) {
            var chain = new Chain([
                '_deleteAllNotes',
                '_addNotes',
                '_checkSavedNotes',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise finding multiple notes by filter.
         */
        testServiceFindAll: function (recordResults) {
            var chain = new Chain([
                '_deleteAllNotes',
                '_addNotes',
                '_checkMultipleSavedNotes',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise Modification date updates on save.
         */
        testServiceModificationDates: function (recordResults) {
            var chain = new Chain([
                '_deleteAllNotes',
                '_addNotes',
                '_checkModificationDates',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise Modification date updates on save.
         */
        testServiceFindSince: function (recordResults) {
            var chain = new Chain([
                '_setupService',
                '_checkFindSince',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Exercise conditional get using etags.
         */
        testServiceConditionalGet: function (recordResults) {
            var chain = new Chain([
                '_deleteAllNotes',
                '_addNotes',
                '_checkConditionalGet',
                function () { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Ensure that there are no saved notes at first.
         */
        _ensureEmpty: function (main_done) {
            this.memento_service.findAllNotes(
                null,
                function (notes) {
                    Mojo.requireEqual(
                        notes.length, 0, "Notes should be empty."
                    );
                    main_done();
                }.bind(this),
                function () { throw "findAllNotes failure"; }
            );
        },

        /**
         * Set up the service by clearing it and loading it up with test data.
         */
        _setupService: function(done) {
            var chain = new Chain([], this);

            chain.push(function(sub_done) {
                this.memento_service.deleteAllNotes(sub_done, 
                    function() { throw "service deleteall failed!"; });
            });

            test_data.each(function(item) {
                chain.push(function(sub_done) {
                    this.memento_service.saveNote(
                        item, true, sub_done,
                        function() { throw "service save failed!"; }
                    );
                });
            }.bind(this));

            chain.push(done).start();
        },

        /**
          * Chain a series of note adds, asserting auto-defined 
          * properties of each upon success.
          */
        _addNotes: function (main_done) {
            var chain = new Chain();

            test_data.each(function (data) {
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

                    this.tickleFunction();

                    // Force the generation of creation/modified dates
                    this.tickleFunction();
                    this.memento_service.addNote(
                        {
                            uuid: data.uuid,
                            name: data.name,
                            text: data.text
                        },
                        check_note, 
                        function () { throw "Note add failed"; }
                    );

                }.bind(this));
            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
         * Check contents of notes, an individual fetch at a time.
         */
        _checkSavedNotes: function (main_done) {
            var chain = new Chain(),
                prop_names = [
                    'uuid', 'name', 'text', 'created', 'modified'
                ];

            this.notes.each(function (expected_note) {
                chain.push(function (done) { 

                    var check_note = function (result_note) {
                        prop_names.each(function (name) {
                            Mojo.requireEqual(
                                result_note[name], expected_note[name],
                                'Note ' + name + ' should match'
                            );
                        }.bind(this));
                        done();
                    }.bind(this);

                    this.tickleFunction();
                    this.memento_service.findNote(
                        expected_note.uuid, null, check_note,
                        function () { throw "Note find failed"; }
                    );

                }.bind(this));
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
                null,
                function (notes) {
                    notes.each(function (result) {

                        var expected = this.by_id[result.uuid];
                        prop_names.each(function (name) {
                            Mojo.requireEqual(
                                result[name], expected[name],
                                'Note ' + name + ' should match'
                            );
                        }, this);

                    }, this);
                    main_done();
                }.bind(this),
                function () { throw "Note findAll failed"; }
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
                
            this.tickleFunction();

            var chain = new Chain([], this);

            test_data.each(function (note) {
                var orig_modified = note.modified;
                
                chain.push(function (done) {
                    this.tickleFunction();

                    var new_note = {
                        uuid:     note.uuid,
                        name:     note.name + '_changed',
                        text:     'Changed note ' + note.text,
                        created:  note.created
                    };

                    this.memento_service.saveNote(
                        new_note, true,
                        function (saved) {
                            Mojo.require(orig_modified !== saved.modified,
                                "Saved modification date should differ");
                            done();
                        }.bind(this),
                        function (saved, resp) { throw "Note save failed"; }
                    );
                });

                chain.push(function (done) {
                    this.tickleFunction();

                    this.memento_service.findNote(
                        note.uuid, null,
                        function (fetched) {
                            Mojo.require(
                                orig_modified != fetched.modified,
                                "Fetched modification date should differ"
                            );
                            done();
                        },
                        function () { throw "Note find failed"; }
                    );
                });

            }, this);

            chain.push(main_done);
            chain.start();
        },

        /**
         * Try fetching notes since the modified dates on each known note and
         * assert the correct count.
         */
        _checkFindSince: function (main_done) {
            this.tickleFunction();
            var chain = new Chain([], this);

            test_data.each(function (note, idx) {

                chain.push(function (done) {

                    var expected_count = test_data.filter(function(item) {
                        return item.modified >= note.modified;
                    }).length;

                    this.memento_service.findAllNotes(
                        { since: note.modified },
                        function (notes) {
                            this.tickleFunction();
                            Mojo.requireEqual(
                                expected_count, notes.length,
                                "Expected count to match (#{expected}==#{result})", 
                                { expected: expected_count, result: notes.length }
                            );
                            done();
                        }.bind(this),
                        function () { throw "Note findAll failed"; }
                    );

                });

            }, this);

            chain.push(main_done).start();
        },

        /**
         * Try updating notes and assert that modification date changed.
         */
        _checkConditionalGet: function (main_done) {
            this.tickleFunction();

            var original_note = this.notes[0];
            var original_etag = original_note.etag;
            var new_etag      = null;
            
            var chain = new Chain([], this);

            chain.push(function (done) {
                // Assert that a fetch for item with known un-changed etag
                // results in a 304 and no content.
                this.memento_service.findNote(
                    original_note.uuid, original_etag,
                    function (note, resp) {
                        Mojo.requireEqual(null, note,
                            "Note content should be empty.");
                        Mojo.requireEqual(304, resp.status,
                            "Etag from unmodified note should result in 304");
                        done();
                    }.bind(this),
                    function (resp) { throw "findNote failure"; }
                );
            });

            chain.push(function (done) {
                // Change an item and retain new etag.
                var new_note = original_note;
                new_note.name = "CHANGED NAME";
                this.memento_service.saveNote(
                    new_note, false,
                    function (note) {
                        new_etag = note.etag;
                        done();
                    },
                    function (resp) { throw "saveNote failure"; }
                );
            });

            chain.push(function (done) {
                // Assert that a fetch for changed item with un-changed etag
                // for results in a 200 and new content
                this.memento_service.findNote(
                    original_note.uuid, original_etag,
                    function (note, resp) {
                        Mojo.require(null !== note,
                            "Note content should not be empty.");
                        Mojo.requireEqual(200, resp.status,
                            "Etag from modified note should result in 200");
                        done();
                    }.bind(this),
                    function (resp) { throw "findNote failure"; }
                );
            });

            chain.push(function (done) {
                // Assert that a fetch for item with new etag
                // results in a 304 and no content.
                this.memento_service.findNote(
                    original_note.uuid, new_etag,
                    function (note, resp) {
                        Mojo.requireEqual(null, note,
                            "Note content should be empty.");
                        Mojo.requireEqual(304, resp.status,
                            "Etag from unmodified note should result in 304");
                        done();
                    }.bind(this),
                    function (resp) { 
                        throw "findNote failure"; 
                    }
                );
            });

            chain.push(main_done).start();
        },

        /**
         * Delete notes, and them ensure they're gone.
         */
        _deleteAllNotes: function (main_done) {
            this.memento_service.deleteAllNotes(
                main_done, function () { throw "deleteAllNotes failure"; }
            );
        },

        /**
         * Delete notes, and them ensure they're gone.
         */
        _deleteAllNotesOneByOne: function (main_done) {
            this.memento_service.findAllNotes(
                null,
                function (notes) {
                    var sub_chain = new Chain([], this);

                    notes.each(function (note) {
                        sub_chain.push(function (done) {
                            this.memento_service.deleteNote(
                                note.uuid, note.etag, false,
                                function (data, resp) {
                                    done();
                                },
                                function (note, resp) {
                                    throw "Note delete failed!"; 
                                }
                            );
                        }.bind(this));
                    }.bind(this));

                    sub_chain.push(main_done).start();

                }.bind(this),
                function () { 
                    throw "Note findAll failed"; 
                }
            );

        },

        EOF: null
    };
}());

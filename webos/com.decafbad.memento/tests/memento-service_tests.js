/*jslint laxbreak: true */
/*global Mojo, Memento, Chain, Class, Ajax */
function MementoServiceTests(tickleFunction) {
    this.initialize(tickleFunction);
}
MementoServiceTests.prototype = (function () {

    var test_data = [
        // Match newer than service
        {
            uuid:     "a-001",
            name:     "alpha",
            text:     "This is note alpha (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        // Match older than service.
        {
            uuid:     "b-001",
            name:     "beta",
            text:     "This is note beta (model)",
            created:  "2009-08-07T05:00:20+00:00",
            modified: "2009-08-07T06:00:00+00:00"
        },
        // Same everything.
        {
            uuid:     "d-001",
            name:     "delta",
            text:     "This is note delta",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        // Unique to model
        {
            uuid:     "g-001",
            name:     "gamma",
            text:     "This is note gamma (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        }
    ];

    // Monkey patch the JSONRequest class to set the test environment
    // override header.
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
        
    return /** @lends MementoServiceTests */ {
        timeoutInterval: 5000,

        /**
         * Test setup, run before execution of each test.
         *
         * @constructs
         * @author l.m.orchard@pobox.com
         * @see Memento.Service
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;
            
            this.memento_service = new Memento.Service({
                service_url: 'http://dev.memento.decafbad.com/'
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
                function () { 
                    recordResults(Mojo.Test.passed); 
                }
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
                function () { 
                    recordResults(Mojo.Test.passed); 
                }
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
                function () { 
                    recordResults(Mojo.Test.passed); 
                }
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
                function () { 
                    recordResults(Mojo.Test.passed); 
                }
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
                function () { 
                    recordResults(Mojo.Test.passed); 
                }
            ], this).start();
        },

        /**
         * Ensure that there are no saved notes at first.
         */
        _ensureEmpty: function (main_done) {
            this.memento_service.findAllNotes(
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
                    delete data.created;
                    delete data.modified;
                    this.memento_service.addNote(
                        data, check_note, function () { 
                            throw "Note add failed";
                        }
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

            var chain = new Chain();

            test_data.each(function (note) {
                var orig_modified = note.modified;
                
                chain.push(function (done) {
                    note.name += '_changed';
                    note.text = 'Changed note ' + note.name;
                    delete note.modified;

                    this.tickleFunction();

                    this.memento_service.saveNote(
                        note, true,
                        function (saved) {
                            Mojo.require(orig_modified !== saved.modified,
                                "Saved modification date should differ");
                            done();
                        }.bind(this),
                        function (saved, resp) { throw "Note save failed"; }
                    );
                }.bind(this));

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
                }.bind(this));

            }, this);

            chain.push(main_done);
            chain.start();
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

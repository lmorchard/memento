/**
 * @fileOverview Tests for NoteTombstoneModel
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
function NoteTombstonesModelTests(tickleFunction) {
    this.initialize(tickleFunction);
}
NoteTombstonesModelTests.prototype = function() {

    var test_model_data = [
        {
            uuid:     "a-001",
            name:     "alpha",
            etag:     "8675309",
            text:     "This is note alpha (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        {
            uuid:     "b-001",
            name:     "beta",
            etag:     "10292384",
            text:     "This is note beta (model)",
            created:  "2009-08-07T05:00:20+00:00",
            modified: "2009-08-07T06:00:00+00:00"
        },
        {
            uuid:     "d-001",
            name:     "delta",
            etag:     "65747392",
            text:     "This is note delta",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        {
            uuid:     "g-001",
            name:     "gamma",
            etag:     "2837463",
            text:     "This is note gamma (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        }
    ];

    return /** @lends NoteTombstonesModelTests */ {

        /**
         * Test setup, run before execution of each test.
         *
         * @constructs
         * @author l.m.orchard@pobox.com
         * @see NoteTombstonesModel
         *
         * @param {function} Test tickle function
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;
            this.notes = test_model_data.map(function(data) {
                return new Note(data);
            });
        },

        /**
         * Exercise the creation and deletion of notes, asserting the creation
         * of tombstones.
         */
        testNoteCreateDelete: function (recordResults) {
            var chain = new Chain([
                '_setupModels',
                '_addNotes',
                '_deleteNotesAndCheckTombstones',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Setup and reset models.
         */
        _setupModels: function (done) {
            var chain = new Chain([
                function (sub_done) {
                    this.notes_model = new NotesModel(
                        'Memento_Notes_Test', sub_done,
                        function () { throw "Notes model setup failed!"; }
                    );
                },
                function (sub_done) {
                    this.notes_model.reset(
                        sub_done, 
                        function () { throw "Notes model reset failed!"; }
                    );
                },
                function (sub_done) {
                    this.tombstones_model = new NoteTombstonesModel(
                        'Memento_Notes_Test', sub_done,
                        function () { throw "Tombstones model setup failed!"; }
                    );
                },
                function (sub_done) {
                    this.tombstones_model.reset(
                        sub_done, 
                        function () { throw "Tombstones model reset failed!"; }
                    );
                },
                done
            ], this).start();
        },

        /**
          * Chain a series of note adds.
          */
        _addNotes: function (main_done) {
            var chain = new Chain([], this);
            this.notes.each(function (data) {
                chain.push(function (done) {
                    this.tickleFunction();
                    this.notes_model.save(
                        data, done, function() { throw "Note add failed"; }
                    );
                });
            }, this);
            chain.push(main_done).start();
        },

        /**
         * Delete items one by one and assert the correct tombstones
         * accumulate.
         */
        _deleteNotesAndCheckTombstones: function(main_done) { 
            var expected_uuids = [];

            var chain = new Chain([], this);
            this.notes.each(function (data) {

                // Delete a note.
                chain.push(function (done) {
                    this.tickleFunction();
                    expected_uuids.push(data.uuid);
                    this.notes_model.del(data, done,
                        function() { throw "Delete failed"; });
                });
                
                // Verify the correct tombstones have been created.
                chain.push(function (done) {
                    this.tickleFunction();
                    this.tombstones_model.findAll(
                        null, null, null,
                        function (tombstones) {

                            Mojo.log("TOMBSTONES %j", tombstones);

                            // Convert tombstone objects to just UUIDs.
                            var result_uuids = tombstones.map(function(ts) {
                                return ts.uuid;
                            });
                        
                            // Order not important here.
                            expected_uuids.sort();
                            result_uuids.sort();
                            
                            // Assert both expected and result UUIDs match.
                            expected_uuids.each(function(uuid, idx) {
                                Mojo.requireEqual(uuid, result_uuids[idx]);
                            });
                            result_uuids.each(function(uuid, idx) {
                                Mojo.requireEqual(uuid, expected_uuids[idx]);
                            });

                            // All good!
                            done();

                        },
                        function () { throw "Tombstones findAll failed"; }
                    );
                });

            }, this);
            chain.push(main_done).start();
        },

        EOF: null
    };

}();

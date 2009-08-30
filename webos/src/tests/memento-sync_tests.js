/**
 * @fileOverview Tests for MementoSync
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Mojo, Memento, Class, NotesModel, Chain, $H, Note */
function MementoSyncTests(tickleFunction) {
    this.initialize(tickleFunction);
}

// Extra long timeout to account for slow network.
MementoSyncTests.timeoutInterval = 5000;

MementoSyncTests.prototype = function() {
    
    return /** @lends MementoSyncTests */ {

        /**
         * Test setup, run before execution of each test.
         *
         * @constructs
         * @author l.m.orchard@pobox.com
         * @see Memento.Sync
         *
         * @param {function} Test tickle function
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;

            this.test_service_url =
                'http://tester:tester@dev.memento.decafbad.com/profiles/tester/';

            // Since tombstone timestamps are automatic, set up some times
            // bracketing the current time in order to accomodate them.
            var today       = new Date();
            var yesterday   = new Date( today.getTime() - (1000 * 60 * 60 * 24) );
            var tomorrow    = new Date( today.getTime() + (1000 * 60 * 60 * 24) );

            this.later_time = new Date( today.getTime() - (1000 * 60 * 1) ).toISO8601String();

            // Shorthand date formatting for test data definition.
            var day = function(base, time) {
                var parts    = time.split(':'), part,
                    offset   = ( (parts[0]*60*60*1000) + (parts[1]*60*1000) + (parts[2]*1000) ),
                    new_time = new Date( base.getTime() + offset ),
                    str      = new_time.toISO8601String().replace('Z', '+00:00');
                return str;
            };
            var day_1 = function (t) { return day(yesterday, t); };
            var day_2 = function (t) { return day(tomorrow, t); };

            // Shorthand note item construction for test data definition.
            var note_map = function (data) {
                var note = {};
                ['uuid', 'name', 'text', 'created', 'modified', 'etag', 'deleteme']
                    .each(function (name, idx) {
                        if (typeof data[idx] != 'undefined') {
                            note[name] = data[idx];
                        }
                    });
                return note;
            };

            this.test_service_data = [];
            this.test_model_data   = [];
            this.expected_data     = [];

            this.test_service_data.push([
                // Match older than model
                [ "a-001", "alpha",    "alpha (r)",    day_1("00:00:20"), day_1("00:30:00") ],
                // Match newer than model
                [ "b-001", "beta",     "beta (r)",     day_1("01:00:20"), day_1("01:30:00") ],
                // Same everything.
                [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
                // Unique to service
                [ "e-001", "eta",      "eta (r)",      day_1("03:00:20"), day_1("03:30:00") ]
            ].map(note_map));

            this.test_model_data.push([
                // Match newer than service
                [ "a-001", "alpha",    "alpha (l)",    day_1("00:00:20"), day_1("00:45:00") ],
                // Match older than service.
                [ "b-001", "beta",     "beta (l)",     day_1("01:00:20"), day_1("01:15:00") ],
                // Same everything.
                [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
                // Unique to model
                [ "g-001", "gamma",    "gamma (l)",    day_1("03:00:20"), day_1("03:30:00") ]
            ].map(note_map));

            this.expected_data.push([
                [ "a-001", "alpha",    "alpha (l)",    day_1("00:00:20"), day_1("00:45:00") ],
                [ "b-001", "beta",     "beta (r)",     day_1("01:00:20"), day_1("01:30:00") ],
                [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
                [ "e-001", "eta",      "eta (r)",      day_1("03:00:20"), day_1("03:30:00") ],
                [ "g-001", "gamma",    "gamma (l)",    day_1("03:00:20"), day_1("03:30:00") ]
            ].map(note_map));

            this.test_service_data.push([
                // Service update.
                [ "a-001", "alpha",    "alpha (r)",    day_2("02:00:20"), day_2("02:45:00") ],
                // Service new.
                [ "t-001", "theta",    "theta (r)",    day_2("03:00:20"), day_2("03:45:00") ],
                // Conflict update, model newer but service etag changed
                [ "e-001", "eta",      "eta (r)",      day_2("04:00:20"), day_2("04:30:00") ],
                // Deleted on service.
                [ "del-r", "delete r", "delete r (r)", day_1("04:00:20"), day_1("04:30:00"), null, true ],
                // Deleted on model.
                [ "del-l", "delete l", "delete l (l)", day_1("05:00:20"), day_1("05:30:00") ]
            ].map(note_map));

            this.test_model_data.push([
                // Model update.
                [ "b-001", "beta",     "beta (l)",     day_2("01:00:20"), day_2("01:30:00") ],
                // Model New.
                [ "p-001", "phi",      "phi (l)",      day_2("03:00:20"), day_2("03:30:00") ],
                // Conflict update, model newer but service etag changed
                [ "e-001", "eta",      "eta (l)",      day_2("05:00:20"), day_2("05:30:00") ],
                // Deleted on service
                [ "del-r", "delete r", "delete r (r)", day_1("04:00:20"), day_1("04:30:00") ],
                // Deleted on model.
                [ "del-l", "delete l", "delete l (l)", day_1("05:00:20"), day_1("05:30:00"), null, true ]
            ].map(note_map));

            this.expected_data.push([
                [ "a-001",   "alpha",        "alpha (r)", day_2("02:00:20"), day_2("02:45:00") ],
                [ "b-001",   "beta",         "beta (l)",  day_2("01:00:20"), day_2("01:30:00") ],
                [ "d-001",   "delta",        "delta (*)", day_1("02:00:20"), day_1("02:30:00") ],
                [ "e-001-l", "eta (l copy)", "eta (l)",   day_2("05:00:20"), day_2("05:30:00") ],
                [ "e-001-r", "eta (r copy)", "eta (r)",   day_2("04:00:20"), day_2("04:30:00") ],
                [ "g-001",   "gamma",        "gamma (l)", day_1("03:00:20"), day_1("03:30:00") ],
                [ "p-001",   "phi",          "phi (l)",   day_2("03:00:20"), day_2("03:30:00") ],
                [ "t-001",   "theta",        "theta (r)", day_2("03:00:20"), day_2("03:45:00") ]
            ].map(note_map));

        },

        /**
         * Exercise the complete sync process.
         */
        testCompleteSyncProcess: function(recordResults) {
            var chain = new Chain([
                '_resetModelAndService',
                this._loadTestData(0),
                '_performAndVerifyFullSync',
                this._loadTestData(1),
                '_performAndVerifySyncSince',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Reset the model, deleting all data
         */
        _resetModelAndService: function (main_done) {
            var chain = new Chain([
                function (done) {
                    this.model = new NotesModel('Memento_Notes_Test', done);
                },
                function (done) {
                    this.model.reset(done);
                },
                function (done) {
                    this.service = new Memento.Service({
                        service_url: this.test_service_url
                    });
                    this.service.deleteAllNotes(done);
                },
                main_done
            ], this).start();
        },

        /**
         * Generate a data loading function for the given index of test data.
         */
        _loadTestData: function(idx) {
            return function (main_done) {
                var chain = new Chain([
                    function (done) { 
                        this._loadModelData(this.test_model_data[idx], done); 
                    },
                    function (done) { 
                        this._loadServiceData(this.test_service_data[idx], done); 
                    },
                    main_done
                ], this).start();
            };
        },

        /**
         * Set up the model by clearing it and loading it up with test data.
         */
        _loadModelData: function(data, main_done) {
            var to_delete = [],
                chain = new Chain([], this);
            
            data.each(function (item) {
                var note = new Note(item);
                if (item.deleteme) { to_delete.push(note); }
                Mojo.log("SETUP MODEL %j", item);
                chain.push(function (done) {
                    this.model.save(note, done);
                });
            }.bind(this));

            to_delete.each(function (note) {
                chain.push(function (done) {
                    Mojo.log("DELETING MODEL %s", note.uuid);
                    this.model.del(note, done);
                });
            });
            
            chain.push(main_done).start();
        },

        /**
         * Set up the service by clearing it and loading it up with test data.
         */
        _loadServiceData: function (data, main_done) {
            var to_delete = [],
                chain = new Chain([], this);

            data.each(function (item) {
                if (item.deleteme) { to_delete.push(item); }
                Mojo.log("SETUP SERVICE %j", item);
                chain.push(function (done) {
                    this.service.saveNote(item, true, done);
                });
            }.bind(this));

            to_delete.each(function (note) {
                chain.push(function (done) {
                    Mojo.log("DELETING SERVICE %s", note.uuid);
                    this.service.deleteNote(
                        note.uuid, null, true, done
                    );
                });
            });

            chain.push(main_done).start();
        },

        /**
         * Perform a full sync and verify the results with expected data.
         */
        _performAndVerifyFullSync: function(done) {

            this.sync = new Memento.Sync(this.model, this.service);
            this.last_sync = null;
            this.curr_expected_data = this.expected_data[0];

            var chain = new Chain([
                '_startSync',
                '_verifyLocalNotes',
                '_verifyRemoteNotes',
                '_verifyEtags',
                done
            ], this).start();

        },

        /**
         * Perform a partial sync since a given time and verify results.
         */
        _performAndVerifySyncSince: function (done) {

            this.sync = new Memento.Sync(this.model, this.service);
            this.last_sync = this.later_time;
            this.curr_expected_data = this.expected_data[1];

            var chain = new Chain([
                '_startSync',
                '_verifyLocalNotes',
                '_verifyRemoteNotes',
                '_verifyEtags',
                done
            ], this).start();

        },

        /**
         * Start the sync process.
         */
        _startSync: function(sub_done) {
            this.sync.startSync(
                this.last_sync, this._handleConflict, sub_done, 
                function() { throw "startSync failed!"; }
            );
        },

        /**
         * Handle conflicts by changing UUID on both items.
         */
        _handleConflict: function (uuid, local, remote, cb) {
            local.uuid  = local.uuid  + '-l';
            local.name  = local.name  + ' (l copy)';
            remote.uuid = remote.uuid + '-r';
            remote.name = remote.name + ' (r copy)';
            
            return cb(local, remote);
        },

        /**
         * Verify all the local model items match expectations.
         */
        _verifyLocalNotes: function(sub_done) {
            var result_notes = [];
            var sub_chain = new Chain([], this);

            // Queue up fetches to accumulate full items from summary
            // metadata UUIDs.
            this.tickleFunction();
            this.model.findAll(
                null, null, null,
                function(items) {
                    items.each(function(item) {

                        sub_chain.push(function(sub_sub_done) {
                            this.tickleFunction();
                            this.model.findByUUID(item.uuid, 
                                function(item) {
                                    result_notes.push(item); 
                                    sub_sub_done();
                                },
                                function() { throw "Model find failed!"; }
                            );
                        });

                    }, this);

                    // Once all the fetches have completed, verify the 
                    // accumlated data against expectations.
                    sub_chain.push(function(sub_sub_done) {
                        Mojo.log('Verify local data');
                        this._assertItems(this.curr_expected_data, result_notes);
                        Mojo.log('Local data verified');
                        sub_sub_done();
                    });

                    sub_chain.push(sub_done).start();
                }.bind(this),
                function() { throw "Model findAll failed!"; }
            );
        },

        /**
         * Verify all the remote service items match expectations.
         */
        _verifyRemoteNotes: function(sub_done) {
            var result_notes = [];
            var sub_chain = new Chain([], this);

            // Queue up fetches to accumulate full items from summary
            // metadata UUIDs.
            this.tickleFunction();
            this.service.findAllNotes(
                null,
                function(items) { 
                    items.each(function(item) {

                        sub_chain.push(function(sub_sub_done) {
                            this.tickleFunction();
                            this.service.findNote(item.uuid, false,
                                function(item) {
                                    result_notes.push(item); 
                                    sub_sub_done();
                                },
                                function() { throw "Service find failed!"; }
                            );
                        });

                    }, this);
                    
                    // Once all the fetches have completed, verify the 
                    // accumlated data against expectations.
                    sub_chain.push(function(sub_sub_done) {
                        Mojo.log('Verify remote data');
                        this._assertItems(this.curr_expected_data, result_notes);
                        Mojo.log('Remote data verified');
                        sub_sub_done();
                    });

                    sub_chain.push(sub_done).start();
                }.bind(this),
                function() { throw "Service findAll failed!"; }
            );
        },

        /**
         * Ensure that the etags in both the remote and local set match.
         */
        _verifyEtags: function(done) {
            var local_etags = [];
            var remote_etags = [];

            var chain = new Chain([

                // Load up all the local items and accumulate etags.
                function(sub_done) {
                    this.tickleFunction();
                    this.model.findAll(
                        null, null, null,
                        function (items) {
                            local_etags = items.map(function (item) {
                                return item.uuid + ':' + item.etag;
                            });
                            local_etags.sort(); // Order is unimportant
                            Mojo.log("MODEL ETAGS %j", local_etags);
                            sub_done();
                        }.bind(this),
                        function() { throw "Model find failed!"; }
                    );
                },

                // Load up all remote items and accumulate etags.
                function(sub_done) {
                    this.tickleFunction();
                    this.service.findAllNotes(null,
                        function (items) {
                            remote_etags = items.map(function (item) {
                                return item.uuid + ':' + item.etag;
                            });
                            remote_etags.sort(); // Order is unimportant
                            Mojo.log("SERVICE ETAGS %j", remote_etags);
                            sub_done();
                        }.bind(this),
                        function() { throw "Service find failed!"; }
                    );
                },

                // Assert equality of both sets of etags.
                function (sub_done) {
                    this.tickleFunction();
                    local_etags.each(function (local_etag, idx) {
                        Mojo.requireEqual(
                            local_etag, remote_etags[idx],
                            "Local etag #{local} should match #{remote}",
                            { local: local_etag, remote: remote_etags[idx] }
                        );
                    });
                    sub_done();
                },

                done

            ], this).start();
        },

        /**
         * Comparison function for sorting by item UUIDs
         */
        _uuidCmp: function(a,b) {
            var av = a.uuid, bv = b.uuid;
            return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
        },

        /**
         * Given expected and result data, assert equality of the list and
         * properties of each individual item.
         */
        _assertItems: function(expected, result, message) {

            expected.sort(this._uuidCmp);
            result.sort(this._uuidCmp);

            expected.each(function(item, idx) { 
                Mojo.log('EXPECTED %s: %j', idx, item);
            });
            result.each(function(item, idx) { 
                Mojo.log('RESULT %s: %j', idx, item);
            });

            Mojo.requireEqual(
                expected.length, result.length,
                "Expected and result length should match (#{e} == #{r})",
                { e: expected.length, r: result.length }
            );

            expected.each(function(expected_item, idx) {
                this.tickleFunction();
            
                var result_item = result[idx];

                // Ensure the expected data is all present in the result note.
                $H(expected_item).each(function(pair) {
                    Mojo.requireEqual(
                        pair.value, result_item[pair.key],
                        "Result #{key} should equal #{value}, not #{result}",
                        {
                            key:    pair.key,
                            value:  pair.value,
                            result: result_item[pair.key]
                        }
                    );
                });

                // Since the service calculates the etag, we don't know what
                // the value will be.  But, we do know that there should at
                // least be one.
                Mojo.require( typeof result_item.etag !== 'undefined',
                    'Result note should have non-empty etag after sync');

            }.bind(this));
        },

        EOF:null
    };
}();

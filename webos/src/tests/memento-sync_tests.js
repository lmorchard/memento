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

    // {{{ Test data
    
    var test_service_url =
        'http://tester:tester@dev.memento.decafbad.com/profiles/tester/';

    var today      = new Date();
    var yesterday  = new Date( today.getTime() - (1000 * 60 * 60 * 24) );
    var tomorrow   = new Date( today.getTime() + (1000 * 60 * 60 * 24) );

    var later_time = new Date( today.getTime() + (1000*60*60) ).toISO8601String();

    var day = function(base, time) {
        var parts  = time.split(':'), part,
            offset = (parts[0]*60*60) + (parts[1]*60) + parts[2] * 1000,
            time   = new Date( base.getTime() + offset ),
            str    = time.toISO8601String().replace('Z', '+00:00');
        return str;
    }
    var day_1 = function (t) { return day(yesterday, t); };
    var day_2 = function (t) { return day(tomorrow, t); };

    var note_map = function (data) {
        var note = {};
        ['uuid', 'name', 'text', 'created', 'modified', 'etag']
            .each(function (name, idx) {
                if (typeof data[idx] != 'undefined') {
                    note[name] = data[idx];
                }
            });
        return note;
    };

    var test_service_data = [
        // Match older than model
        [ "a-001", "alpha",    "alpha (r)",    day_1("00:00:20"), day_1("00:30:00") ],
        // Match newer than model
        [ "b-001", "beta",     "beta (r)",     day_1("01:00:20"), day_1("01:30:00") ],
        // Same everything.
        [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
        // Unique to service
        [ "e-001", "eta",      "eta (r)",      day_1("03:00:20"), day_1("03:30:00") ],
        // Deleted on service.
        [ "del-r", "delete r", "delete r (r)", day_1("04:00:20"), day_1("04:30:00") ],
        // Deleted on model.
        [ "del-l", "delete l", "delete l (l)", day_1("05:00:20"), day_1("05:30:00") ]
    ].map(note_map);

    var test_model_data = [
        // Match newer than service
        [ "a-001", "alpha",    "alpha (l)",    day_1("00:00:20"), day_1("00:45:00") ],
        // Match older than service.
        [ "b-001", "beta",     "beta (l)",     day_1("01:00:20"), day_1("01:15:00") ],
        // Same everything.
        [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
        // Unique to model
        [ "g-001", "gamma",    "gamma (l)",    day_1("03:00:20"), day_1("03:30:00") ],
        // Deleted on service
        [ "del-r", "delete r", "delete r (r)", day_1("04:00:20"), day_1("04:30:00") ],
        // Deleted on model.
        [ "del-l", "delete l", "delete l (l)", day_1("05:00:20"), day_1("05:30:00") ]
    ].map(note_map);

    var expected_data = [
        [ "a-001", "alpha",    "alpha (l)",    day_1("00:00:20"), day_1("00:45:00") ],
        [ "b-001", "beta",     "beta (r)",     day_1("01:00:20"), day_1("01:30:00") ],
        [ "d-001", "delta",    "delta (*)",    day_1("02:00:20"), day_1("02:30:00") ],
        [ "e-001", "eta",      "eta (r)",      day_1("03:00:20"), day_1("03:30:00") ],
        [ "g-001", "gamma",    "gamma (l)",    day_1("03:00:20"), day_1("03:30:00") ]
    ].map(note_map);

    var test_service_data_later = [
        // Service update.
        [ "a-001", "alpha",    "alpha (r)",    day_2("02:00:20"), day_2("02:45:00") ],
        // Service new.
        [ "t-001", "theta",    "theta (r)",    day_2("03:00:20"), day_2("03:45:00") ],
        // Conflict update, model newer but service etag changed
        [ "e-001", "eta",      "eta (r)",      day_2("04:00:20"), day_2("04:30:00") ]
    ].map(note_map);

    var test_model_data_later = [
        // Model update.
        [ "b-001", "beta",     "beta (l)",     day_2("01:00:20"), day_2("01:30:00") ],
        // Model New.
        [ "p-001", "phi",      "phi (l)",      day_2("03:00:20"), day_2("03:30:00") ],
        // Conflict update, model newer but service etag changed
        [ "e-001", "eta",      "eta (l)",      day_2("05:00:20"), day_2("05:30:00") ]
    ].map(note_map);

    var expected_data_later = [
        [ "a-001",   "alpha",             "alpha (r)", day_2("02:00:20"), day_2("02:45:00") ],
        [ "b-001",   "beta",              "beta (l)",  day_2("01:00:20"), day_2("01:30:00") ],
        [ "d-001",   "delta",             "delta (*)", day_1("02:00:20"), day_1("02:30:00") ],
        [ "e-001-l", "eta (local copy)",  "eta (l)",   day_2("05:00:20"), day_2("05:30:00") ],
        [ "e-001-r", "eta (remote copy)", "eta (r)",   day_2("04:00:20"), day_2("04:30:00") ],
        [ "g-001",   "gamma",             "gamma (l)", day_1("03:00:20"), day_1("03:30:00") ],
        [ "p-001",   "phi",               "phi (l)",   day_2("03:00:20"), day_2("03:30:00") ],
        [ "t-001",   "theta",             "theta (r)", day_2("03:00:20"), day_2("03:45:00") ]
    ].map(note_map);

    // }}}

    var uuid_cmp = function(a,b) {
        var av = a.uuid, bv = b.uuid;
        return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
    };

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
        },

        /**
         * Exercise the complete sync process.
         */
        testCompleteSyncProcess: function(recordResults) {
            var chain = new Chain([
                '_setupModel',
                '_setupService',
                '_performAndVerifyFullSync',
                '_makeLaterModelChanges',
                '_makeLaterServiceChanges',
                '_performAndVerifySyncSince',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        /**
         * Set up the model by clearing it and loading it up with test data.
         */
        _setupModel: function(done) {
            this.model = new NotesModel('Memento_Notes_Test');

            var to_delete = null,
                chain = new Chain([], this);

            chain.push(function (sub_done) {
                this.model.reset(sub_done);
            });
            
            test_model_data.each(function (item) {
                var note = new Note(item);
                if ('del-l' == note.uuid) { to_delete = note; }
                chain.push(function (sub_done) {
                    this.model.save(note, sub_done);
                });
            }.bind(this));

            if (to_delete) {
                chain.push(function (sub_done) {
                    this.model.del(to_delete, sub_done);
                });
            }
            
            chain.push(done).start();
        },

        /**
         * Set up the service by clearing it and loading it up with test data.
         */
        _setupService: function (done) {
            this.service = new Memento.Service({
                service_url: test_service_url
            });

            var to_delete = null,
                chain = new Chain([], this);

            chain.push(function (sub_done) {
                this.service.deleteAllNotes(sub_done);
            });

            test_service_data.each(function (item) {
                if ('del-r' === item.uuid) { to_delete = item; }
                chain.push(function (sub_done) {
                    this.service.saveNote(item, true, sub_done);
                });
            }.bind(this));

            if (to_delete) {
                chain.push(function (sub_done) {
                    this.service.deleteNote(
                        to_delete.uuid, null, true, sub_done
                    );
                });
            }

            chain.push(done).start();
        },

        /**
         * Perform a full sync and verify the results with expected data.
         */
        _performAndVerifyFullSync: function(done) {

            this.sync = new Memento.Sync(this.model, this.service);
            this.last_sync = null;
            this.expected_data = expected_data;

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
            this.last_sync = later_time;
            this.expected_data = expected_data_later;

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
            local.name  = local.name  + ' (local copy)';
            remote.uuid = remote.uuid + '-r';
            remote.name = remote.name + ' (remote copy)';
            
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
                        this._assertItems(this.expected_data, result_notes);
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
                        this._assertItems(this.expected_data, result_notes);
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
         * Given expected and result data, assert equality of the list and
         * properties of each individual item.
         */
        _assertItems: function(expected, result, message) {

            expected.sort(uuid_cmp);
            result.sort(uuid_cmp);

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

        /**
         * Apply second batch of changes to the model.
         */
        _makeLaterModelChanges: function (done) {
            var chain = new Chain([], this);

            test_model_data_later.each(function (item) {
                chain.push(function (sub_done) {
                    Mojo.log("LATER MODEL %j", item);
                    var note = new Note(item);
                    this.model.save(
                        note, sub_done,
                        function() { throw "model save failed!"; }
                    );
                });
            }.bind(this));

            chain.push(done).start();
        },

        /**
         * Apply second batch of changes to the service.
         */
        _makeLaterServiceChanges: function (done) {
            var chain = new Chain([], this);
            
            test_service_data_later.each(function(item) {
                chain.push(function(sub_done) {
                    Mojo.log("LATER SERVICE %j", item);
                    this.service.saveNote(
                        item, true, sub_done,
                        function() { throw "service save failed!"; }
                    );
                });
            }.bind(this));

            chain.push(done).start();
        },

        EOF:null
    };
}();

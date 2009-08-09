/**
 * Tests for MementoSync
 *
 * @author l.m.orchard@pobox.com
 * @see Memento.Sync
 */
function MementoSyncTests(tickleFunction) {
    this.initialize(tickleFunction);
}

MementoSyncTests.prototype = function() {

    var uuid_cmp = function(a,b) {
        var av = a['uuid'], bv = b['uuid'];
        return (av<bv) ? -1 : ( (av>bv) ? 1 : 0 );
    }

    // Common mock storage class.
    var Mock_Store = Class.create({
        name: 'Store',
        initialize: function(test_data) {
            this.test_data = test_data;
        },
        findAll: function(filters, limit, offset, on_success, on_fail) {
            // Reduce the test data down to summary metadata, since that's all
            // we should expect from the model or service.
            var out = this.test_data.map(function(item) {
                return {
                    uuid:     item.uuid,
                    created:  item.created,
                    modified: item.modified
                }
            });
            on_success(out);
        },
        find: function(uuid, on_success, on_fail) {
            var found = this.test_data.filter(function(item) {
                return item.uuid == uuid;
            });
            on_success(found.length > 0 ? found[0] : null);
        },
        save: function (data, on_success, on_fail) {
            var new_data = this.test_data.filter(function(item) {
                return item.uuid != data.uuid;
            })
            new_data.push(data);
            this.test_data = new_data;
            on_success(data);
        }
    });

    // Mock local model.
    var Mock_NotesModel = Class.create(Mock_Store, {
        name: 'Model'
    });

    // Mock remote service.
    var Mock_MementoService = Class.create(Mock_Store, {
        name: 'Service',
        findAllNotes: function(on_success, on_failure) {
            return this.findAll(null,null,null, on_success, on_failure);
        },
        findNote: function(uuid, on_success, on_failure) {
            return this.find(uuid, on_success, on_failure);
        },
        saveNote: function(data, on_success, on_failure) {
            return this.save(data, on_success, on_failure);
        }
    });

    var test_service_data = [
        // Match older than model
        {
            uuid:     "a-001",
            name:     "alpha",
            text:     "This is note alpha (service)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T03:30:00+00:00"
        },
        // Match newer than model
        {
            uuid:     "b-001",
            name:     "beta",
            text:     "This is note beta (service)",
            created:  "2009-08-07T05:00:20+00:00",
            modified: "2009-08-07T07:00:00+00:00"
        },
        // Same everything.
        {
            uuid:     "d-001",
            name:     "delta",
            text:     "This is note delta",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        // Unique to service
        {
            uuid:     "e-001",
            name:     "epsilon",
            text:     "This is note epsilon (service)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        }
    ];

    var test_model_data = [
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

    var expected_data = [
        {
            uuid:     "a-001",
            name:     "alpha",
            text:     "This is note alpha (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        {
            uuid:     "b-001",
            name:     "beta",
            text:     "This is note beta (service)",
            created:  "2009-08-07T05:00:20+00:00",
            modified: "2009-08-07T07:00:00+00:00"
        },
        {
            uuid:     "d-001",
            name:     "delta",
            text:     "This is note delta",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        {
            uuid:     "e-001",
            name:     "epsilon",
            text:     "This is note epsilon (service)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        },
        {
            uuid:     "g-001",
            name:     "gamma",
            text:     "This is note gamma (model)",
            created:  "2009-08-07T03:00:20+00:00",
            modified: "2009-08-07T04:00:00+00:00"
        }
    ];

    // The test class begins...
    return {

        timeoutInterval: 5000,

        /**
         * Test setup, run before execution of each test.
         */
        initialize: function (tickleFunction) {
            this.tickleFunction = tickleFunction;
        },

        /**
         * Exercise the full sync process.
         */
        testFullSync: function(recordResults) {
            new Chain([
                //'_setupModel',
                '_createMockModel',
                '_setupService',
                //'_createMockService',
                '_performAndVerifyFullSync',
                function() { recordResults(Mojo.Test.passed); }
            ], this).start();
        },

        _setupModel: function(done) {
            this.model = new NotesModel();

            var chain = new Chain([], this);
            
            chain.push(function(sub_done) {
                this.model.delAll(sub_done, 
                    function() { throw "model deleteall failed!"; });
            });
            
            test_model_data.each(function(item) {
                chain.push(function(sub_done) {
                    this.model.save(
                        item, sub_done, 
                        function() { throw "model save failed!"; });
                })
            }.bind(this));
            
            chain.push(done).start();
        },

        _setupService: function(done) {
            this.service = new Memento.Service('http://dev.memento.decafbad.com/');

            var chain = new Chain([], this);

            chain.push(function(sub_done) {
                this.service.deleteAllNotes(sub_done, 
                    function() { throw "service deleteall failed!"; });
            });

            test_service_data.each(function(item) {
                chain.push(function(sub_done) {
                    this.service.saveNote(
                        item, true, sub_done,
                        function() { throw "service save failed!"; }
                    );
                })
            }.bind(this));

            chain.push(done).start();
        },
         
        /**
         * Build a mock model with test data.
         */
        _createMockModel: function(done) {

            this.model = new Mock_NotesModel(test_model_data);

            done();
        },

        /**
         * Build a mock service with test data.
         */
        _createMockService: function(done) {
            this.service = new Mock_MementoService(test_service_data);
            done();
        },

        /**
         * Perform a full sync and verify the results with expected data.
         */
        _performAndVerifyFullSync: function(done) {
            this.sync = new Memento.Sync(
                this.model, this.service, 
                { loaded: true, last_sync: null }
            );

            var chain = new Chain([
                '_startFullSync',
                '_verifyLocalNotes',
                '_verifyRemoteNotes',
                function(sub_done) { done() }
            ], this).start();
        },

        /**
         * Start full sync.
         */
        _startFullSync: function(sub_done) {
            this.sync.startSync(
                sub_done, function() { throw "startSync failed!"; }
            );
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
                            this.model.find(item.uuid, 
                                function(item) {
                                    result_notes.push(item); 
                                    sub_sub_done();
                                },
                                function() { throw "Model find failed!"; }
                            );
                        });
                    }, this) 

                    // Once all the fetches have completed, verify the 
                    // accumlated data against expectations.
                    sub_chain.push(function(sub_sub_done) {
                        this._assertItems(expected_data, result_notes);
                        sub_done();
                    });

                    sub_chain.start();

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
                function(items) { 
                    items.each(function(item) {
                        sub_chain.push(function(sub_sub_done) {
                            this.tickleFunction();
                            this.service.findNote(item.uuid, 
                                function(item) {
                                    result_notes.push(item); 
                                    sub_sub_done();
                                },
                                function() { throw "Service find failed!"; }
                            );
                        });
                    }, this) 
                    
                    // Once all the fetches have completed, verify the 
                    // accumlated data against expectations.
                    sub_chain.push(function(sub_sub_done) {
                        this._assertItems(expected_data, result_notes);
                        sub_done();
                    });

                    sub_chain.start();
                }.bind(this),
                function() { throw "Service findAll failed!"; }
            );
        },

        /**
         * Given expected and result data, assert equality of the list and
         * properties of each individual item.
         */
        _assertItems: function(expected_data, result_data, message) {
            expected_data.sort(uuid_cmp);
            result_data.sort(uuid_cmp);

            expected_data.each(function(expected_note, idx) {
            
                var result_note = result_data[idx];
                $H(expected_note).each(function(pair) {
                    Mojo.requireEqual(
                        pair.value, result_note[pair.key],
                        "Result " + pair.key + 
                        " should equal " + pair.value + 
                        ", not " + result_note[pair.key]
                    );
                });

            });
        },

        EOF:null
    };
}();

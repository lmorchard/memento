/**
 * @fileOverview Memento model / service data synchronization
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Mojo, Memento, Class, NotesModel, Chain, $H, Note */
Memento.Sync = Class.create(function () {

    /** @lends Memento.Sync# */
    return {

        /**
         * Memento model/service sync machine
         *
         * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
         * @constructs
         */
        initialize: function (model, service, sync_notes) {
            this.model = model || new NotesModel();
            this.service = service || new Memento.Service();
        },

        /**
         * Start the sync process.
         */
        startSync: function (last_sync, on_conflict, on_success, on_failure) {
            Mojo.log('Memento.Sync: startSync()');

            this.conflict  = on_conflict;
            this.success   = on_success;
            this.failure   = on_failure;
            this.last_sync = last_sync;

            if (null === this.last_sync) {
                Mojo.log("Memento.Sync: Full sync starting");
            } else {
                Mojo.log("Memento.Sync: Sync since %s starting", last_sync);
            }

            this.chain = new Chain([
                '_fetchLocalItems',
                '_fetchRemoteItems',
                '_pairItems',
                '_processItems',
                this.success
            ], this);

            this.chain.start();
        },

        /**
         * Fetch local items for sync.
         */
        _fetchLocalItems: function (done) {
            this.items_local = [];

            var criteria = {};
            if (null !== this.last_sync) {
                criteria.where = ['modified >= ?', this.last_sync];
            }
            
            this.model.findAllWithTombstones(
                criteria, null, null,
                function (items) { 
                    this.items_local = items; done(); 
                }.bind(this),
                this.failure
            );
        },

        /**
         * Fetch remote items for sync.
         */
        _fetchRemoteItems: function (done) {
            this.items_remote = [];

            var criteria = { tombstones: true };
            if (null !== this.last_sync) {
                criteria.since = this.last_sync;
            }
            
            this.service.findAllNotes(
                criteria,
                function (items) { 
                    this.items_remote = items; done(); 
                }.bind(this),
                this.failure
            );
        },

        /**
         * Produce a merged set of paired local and remote items fetched from
         * respective sources.
         */
        _pairItems: function (done) {
            this.paired_items = {};

            // Collate the local items by UUID.
            this.items_local.each(function (item) {
                var uuid = item.uuid.toLowerCase();
                this.paired_items[uuid] = { local: item };
            }, this);

            // Collate the remote items by UUID.
            this.items_remote.each(function (item) {
                var uuid = item.uuid.toLowerCase();
                if (typeof this.paired_items[uuid] !== 'object') {
                    this.paired_items[uuid] = { remote: item };
                } else {
                    this.paired_items[uuid].remote = item;
                }
            }, this);

            done();
        },

        /**
         * Build and run a chain of calls to _processSyncItem to handle
         * all the UUIDs and paired items found.
         */
        _processItems: function(done) {
            var sub_chain = new Chain([], this);

            $H(this.paired_items).each(function (pair) {
                sub_chain.push(function (sub_done) {
                    this._processSyncItem(
                        sub_done, pair.key, 
                        pair.value.local, pair.value.remote
                    );
                });
            }, this);

            sub_chain.push(done).start();
        },

        /**
         * Process a single full sync item, using simple modification date
         * comparison to pick whether local or remote item is current.
         */
        _processSyncItem: function (done, uuid, local, remote) {

            if (!remote) { // No remote? Upload the local.
                Mojo.log('Memento.Sync: %s remote missing/unchanged', uuid);
                return this._overwriteRemote(done, uuid, local, remote);
            }  
            
            if (!local) { // No local? Save the remote.
                Mojo.log('Memento.Sync: %s local missing/unchanged', uuid);
                return this._overwriteLocal(done, uuid, local, remote);
            }

            var local_modified  = (new Date()).setISO8601(local.modified),
                remote_modified = (new Date()).setISO8601(remote.modified);

            if (null !== this.last_sync && local_modified !== remote_modified) {
                
                Mojo.log('Memento.Sync: %s conflict! ' + 
                    'Both changed since last sync', uuid);
                return this._resolveConflict(done, uuid, local, remote);

            } else if (local_modified > remote_modified) {

                Mojo.log('Memento.Sync: %s local newer (%s vs %s)', 
                    uuid, local_modified, remote_modified);
                return this._overwriteRemote(done, uuid, local, remote);

            } else if (remote_modified > local_modified) {

                Mojo.log('Memento.Sync: %s remote newer (%s vs %s)', 
                    uuid, local_modified, remote_modified);
                return this._overwriteLocal(done, uuid, local, remote);

            } 
            
            if (local.tombstone) { // Same timestamp, but local is tombstone.
                return this._overwriteRemote(done, uuid, local, remote);
            }

            if (remote.tombstone) { // Same timestamp, but remote is tombstone
                return this._overwriteLocal(done, uuid, local, remote);
            }
            
            if (!local.etag) {
                // Might only be a test case, but a local item missing etag
                // needs an overwrite from remote
                Mojo.log('Memento.Sync: %s local missing etag', uuid);
                return this._overwriteLocal(done, uuid, local, remote);
            }

            // Everything else gets skipped.
            Mojo.log('Memento.Sync: %s skip', uuid);
            return done();
        },

        /**
         * Overwrite the remote item with item fetched from local store.
         */
        _overwriteRemote: function (done, uuid, local, remote) {

            if (local.tombstone) {

                // Delete the remote item.
                Mojo.log('Memento.Sync: Delete remote %s', uuid);
                this.service.deleteNote(
                    remote.uuid, remote.etag, true, done, this.failure
                );

            } else {

                // Save the item remotely, but then overwrite local with
                // results of remote save in order to sync up etags and
                // any other server-side changes to the item.
                Mojo.log('Memento.Sync: Overwrite remote %s', uuid);
                this.model.findByUUID(uuid, function (note) {
                    this.service.saveNote(
                        note, true, function(saved_note) {
                            this.model.save(
                                new Note(saved_note), done, this.failure
                            );
                        }.bind(this), this.failure
                    );
                }.bind(this), this.failure);

            }

        },

        /**
         * Overwrite the local item with an item fetched from remote service.
         */
        _overwriteLocal: function (done, uuid, local, remote) {

            if (remote.tombstone) {

                // Delete the local item.
                Mojo.log('Memento.Sync: Delete local %s', uuid);
                this.model.del(remote, done, this.failure);

            } else {

                // Since the remote item from findAll is incomplete,
                // find the complete item and save it locally.
                Mojo.log('Memento.Sync: Overwrite local %s', uuid);
                this.service.findNote(uuid, null, function (note) {
                    this.model.save(
                        new Note(note), done, this.failure
                    );
                }.bind(this), this.failure);

            }

        },

        /**
         * Resolve any sync conflicts by consulting a callback.
         *
         * The callback make changes to both the local and remote item,
         * even passing them back as null to indicate one or both of the
         * items should be deleted.
         *
         * This function will then alter or delete items accordingly.
         */
        _resolveConflict: function (done, uuid, orig_local, orig_remote) {

            this.service.findNote(uuid, null, function (orig_remote) {

                this.conflict(
                    uuid, 
                    Object.clone(orig_local.toObject()), 
                    Object.clone(orig_remote),

                    function (new_local, new_remote) {

                        var chain = new Chain([], this);

                        if (new_local) {
                            // Save the new local to both local and remote.
                            chain.push(function (sub_done) {
                                this.service.saveNote(
                                    new_local, true, 
                                    function(saved_item) {
                                        this.model.save(
                                            new Note(saved_item), sub_done, this.failure
                                        );
                                    }.bind(this), 
                                    this.failure
                                );
                            });
                        }
                        
                        if (new_remote) {
                            // Save the new remote to both local and remote.
                            chain.push(function (sub_done) {
                                this.service.saveNote(
                                    new_remote, true, 
                                    function(saved_item) {
                                        this.model.save(
                                            new Note(saved_item), sub_done, this.failure
                                        );
                                    }.bind(this), 
                                    this.failure
                                );
                            });
                        }
                        
                        if (!new_local || ( new_local.uuid != orig_local.uuid )) {
                            // If no new local, or if the UUID has changed,
                            // delete the orig local
                            chain.push(function (sub_done) {
                                this.model.del(orig_local, sub_done, this.failure);
                            }); 
                        }

                        if (!new_remote || ( new_remote.uuid != orig_remote.uuid )) {
                            // If no new remote, or if the UUID has changed,
                            // delete the original remote
                            chain.push(function (sub_done) {
                                this.service.deleteNote(
                                    orig_remote.uuid, orig_remote.etag, false,
                                    sub_done, this.failure
                                );
                            }); 
                        }

                        chain.push(done).start();

                    }.bind(this)
                );
            }.bind(this), this.failure);
        },

        EOF: null
    };

}());

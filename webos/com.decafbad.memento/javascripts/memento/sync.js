/**
 * Memento model/service sync machine
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 */
var Mojo, Memento, Class, NotesModel, Chain, $H;
Memento.Sync = Class.create(function () {

    var default_sync_notes = {
        loaded: true,
        last_sync: null
    };

    /** @lends Memento.Sync# */
    return {

        /**
         * Constructor.
         * @constructs
         */
        initialize: function (model, service, sync_notes) {

            this.model = (model) ?
                model : new NotesModel();

            this.service = (service) ?
                service : new Memento.Service();

            if (sync_notes) {
                this.sync_notes = sync_notes;
            } else {
                var cookie = new Mojo.Model.Cookie('memento_sync_notes');
                this.sync_notes = cookie.get();
                if (!this.sync_notes || !this.sync_notes.loaded) {
                    cookie.put(this.sync_notes = default_sync_notes);
                }
            }

        },

        /**
         * Start the sync process.
         */
        startSync: function (on_success, on_failure) {
            Mojo.Log.info('Memento.Sync: startSync()');
            this.fullSync(on_success, on_failure);
            /** TODO:
            var last_sync = this.sync_notes.last_sync;
            if (null == last_sync) {
                this.fullSync(on_success, on_failure);
            } else {
                this.syncSince(on_success, on_failure, last_sync);
            }
            */
        },

        /**
         * Start a full sync process.
         */
        fullSync: function (on_success, on_failure) {
            this.full_sync_success = on_success;
            this.full_sync_failure = on_failure;

            this.chain = new Chain([
                '_fetchAllLocalItems',
                '_fetchAllRemoteItems',
                '_mergeAndProcessItems',
                function (done) {
                    Mojo.Log.info('Memento.Sync: Sync complete');
                    done();
                },
                on_success
            ], this);

            this.chain.start();
        },

        /**
         * Fetch all the items from the local model.
         */
        _fetchAllLocalItems: function (done) {
            this.items_local = [];
            this.model.findAll(null, null, null,
                function (items) { 
                    this.items_local = items; 
                    done(); 
                }.bind(this),
                this.full_sync_failure
            );
        },

        /**
         * Fetch all the items from the remote service.
         */
        _fetchAllRemoteItems: function (done) {
            this.items_remote = [];
            this.service.findAllNotes(
                function (items) { 
                    this.items_remote = items; 
                    done(); 
                }.bind(this),
                this.full_sync_failure
            );
        },

        /**
         * Merge the items by UUID and queue up _processFullSyncItem calls to
         * handle the sync logic.
         */
        _mergeAndProcessItems: function (done) {
            var paired_items = {},
                sub_chain = new Chain([], this);

            // Collate the local items by UUID.
            this.items_local.each(function (item) {
                var uuid = item.uuid.toLowerCase();
                paired_items[uuid] = { local: item };
            }, this);

            // Collate the remote items by UUID.
            this.items_remote.each(function (item) {
                var uuid = item.uuid.toLowerCase();
                if (typeof paired_items[uuid] !== 'object') {
                    paired_items[uuid] = { remote: item };
                } else {
                    paired_items[uuid].remote = item;
                }
            }, this);

            // Build and run a chain of calls to _processFullSyncItem to handle
            // all the UUIDs and paired items found.

            $H(paired_items).each(function (pair) {
                sub_chain.push(function (sub_done) {
                    this._processFullSyncItem(
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
        _processFullSyncItem: function (done, uuid, local, remote) {

            if (!remote) {
                // No remote? Upload the local.
                Mojo.Log.info('Memento.Sync: %s Remote missing', uuid);
                return this._overwriteRemote(done, uuid);
            } else if (!local) {
                // No local? Save the remote.
                Mojo.Log.info('Memento.Sync: %s Local missing', uuid);
                return this._overwriteLocal(done, uuid);
            }

            var local_modified = (new Date()).setISO8601(local.modified),
                remote_modified = (new Date()).setISO8601(remote.modified);
                
            if (local_modified > remote_modified) {
                // Upload the local if newer than remote.
                Mojo.Log.info('Memento.Sync: %s Local newer (%s vs %s)', 
                    uuid, local_modified, remote_modified);
                return this._overwriteRemote(done, uuid);
            } else if (remote_modified > local_modified) {
                // Save the remote if newer than local.
                Mojo.Log.info('Memento.Sync: %s Remote newer (%s vs %s)', 
                    uuid, local_modified, remote_modified);
                return this._overwriteLocal(done, uuid);
            }
            
            // Everything else gets ignored.
            Mojo.Log.info('Memento.Sync: %s Skip', uuid);
            return done();
        },

        /**
         * Overwrite the remote item with item fetched from local store.
         */
        _overwriteRemote: function (done, uuid) {
            Mojo.Log.info('Memento.Sync: Overwrite remote %s', uuid);
            this.model.find(uuid, function (note) {
                this.service.saveNote(note, true, done, this.full_sync_failure);
            }.bind(this), this.full_sync_failure);
        },

        /**
         * Overwrite the local item with an item fetched from remote service.
         */
        _overwriteLocal: function (done, uuid) {
            Mojo.Log.info('Memento.Sync: Overwrite local %s', uuid);
            this.service.findNote(uuid, null, function (note) {
                this.model.save(note, done, this.full_sync_failure);
            }.bind(this), this.full_sync_failure);
        },

        /**
         * TODO: Sync since a given time.
         */
        syncSince: function (on_success, on_failure, last_sync) {
        },

        EOF: null
    };

}());

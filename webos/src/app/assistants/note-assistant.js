/**
 * @fileOverview Single note scene assistant
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Memento, Note, Mojo, $L, $H, SimpleDateFormat */
function NoteAssistant (note) {
    this.note = note;
}

NoteAssistant.prototype = (function () {
    
    /** @lends NoteAssistant# */ 
    return {

        

        setup: function () {
            this.controller.stageController.setWindowOrientation('free');

            this.current_size = 3;

            var listeners = [
                ['text', 'gesturestart',  this.handleGestureStart],
                ['text', 'gesturechange', this.handleGestureChange],
                ['text', 'gestureend',    this.handleGestureEnd],
                [this.controller.document, 'gesturestart',  this.handleGestureStart],
                [this.controller.document, 'gesturechange', this.handleGestureChange],
                [this.controller.document, 'gestureend',    this.handleGestureEnd],
                [this.controller.document, Mojo.Event.tap,  this.focusText]
            ];

            this.controller.setupWidget(Mojo.Menu.appMenu, 
                Memento.app_menu.attr, Memento.app_menu.model);

            this.controller.setupWidget(
                "name", {
                    hintText: $L('Enter note name...'),
                    multiline: false,
                    enterSubmits: false,
                    focus: (!this.note.name),
                    modelProperty: 'name'
                },
                this.note
            );

            this.controller.setupWidget(
                "text", {
                    multiline: true,
                    enterSubmits: false,
                    focus: (!!this.note.name),
                    modelProperty: 'text'
                },
                this.note
            );

            ['name', 'text'].each(function(name) {
                listeners.push([name, Mojo.Event.propertyChange, 
                    this.saveChanges]);
            }, this);

            Memento.setupListeners(listeners, this);
        },

        focusText: function(ev) {
            this.controller.get('text').focus();
        },

        handleGestureStart: function (ev) {
        },

        handleGestureChange: function (ev) {
            var size = Math.round(this.current_size * ev.scale);
            if (size >= 8) size = 8;
            if (size <= 1) size = 1;
            this.controller.get('text').className = 'size' + size;
        },

        handleGestureEnd: function (ev) {
            var size = Math.round(this.current_size * ev.scale);
            if (size >= 8) size = 8;
            if (size <= 1) size = 1;
            this.current_size = size;
            this.controller.get('text').className = 'size' + size;
        },
        
        saveChanges: function(force_overwrite) {
            if (!this.note.name && !this.note.text) {
                // Don't save changes to empty notes.
                return;
            }
            
            this.note.modified = (new Date()).toISO8601String();

            if (!Memento.prefs.sync_enabled && !Memento.prefs.sync_on_save) {

                Mojo.log("Skipping remote save of note %s", this.note.uuid);
                Memento.notes_model.save(
                    this.note, function(note) { }
                );
                Memento.home_assistant.updateList();

            } else {

                if (Memento.prefs.sync_notifications) {
                    Mojo.Controller.getAppController().showBanner(
                        { messageText: "Saving note to web" }, {}, null
                    );
                }
                Memento.notes_service.saveNote(
                    this.note, force_overwrite, 
                    function(note, resp) { 
                        Mojo.log("Remote save of note %s", this.note.uuid);
                        this.note.etag = note.etag;
                        Memento.notes_model.save(
                            this.note, function(note) { }
                        );
                        Memento.home_assistant.updateList();
                        if (Memento.prefs.sync_notifications) {
                            Mojo.Controller.getAppController().showBanner(
                                { messageText: "Note saved to web" }, {}, null
                            );
                        }
                    }.bind(this),
                    this.handleWebSaveProblem.bind(this)
                );

            }
        },

        handleWebSaveProblem: function(note, resp) {
            Mojo.log("FAILED UPDATED NOTE %s / %s / %s / %s", 
                resp.status, this.note.uuid, this.note.etag, resp.getHeader('etag'));

            if ('412' == resp.status) {

                this.controller.showAlertDialog({
                    title: $L("Problem saving to the web"),
                    message: $L(
                        "This note was modified on the web since it was " +
                        "last saved from this device."
                    ),
                    choices: [
                        {value:"overwrite_remote", 
                            label:$L("Overwrite note on web") },
                        {value:"new_local", 
                            label:$L("Save a new copy")}
                    ],
                    onChoose: function(value) {
                        if ('overwrite_remote' == value) {
                            this.saveChanges(true);
                        } else {
                            delete this.note.uuid;
                            this.note.name += ' (copy)';
                            this.saveChanges();
                        }
                    }
                });

            }

        },

        activate: function (event) {
            //this.saveChanges();
        },

        deactivate: function (event) {
            //this.saveChanges();
        },

        cleanup: function (event) {
            Memento.clearListeners(this);
        }

    };

}());

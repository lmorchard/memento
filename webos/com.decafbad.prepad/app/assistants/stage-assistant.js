/**
 *
 */
function StageAssistant() {
}

StageAssistant.prototype = (function () {
        
    return {

        setup: function () {
            this.controller.pushScene('home');

            /*
            var nm = new NotesModel();
            var note = nm.find(0);
            this.controller.pushScene('note', note);
            */
        }

    };
        
}());

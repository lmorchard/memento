/**
 * Home scene assistant.
 */
function HomeAssistant() {
    this.notes_model = new NotesModel();
}

HomeAssistant.prototype = (function () {
    return {

        /**
         * Scene setup.
         */
        setup: function () {
            console.log('HOME SETUP');

            this.notes = this.notes_model.findAll();

            this.list_model = {
                //listTitle: $L('Notes'),
                items: this.notes
            };

            this.controller.setupWidget(
                "notes-list",
                {
                    //addItemLabel:  $L('Add ...'),
                    swipeToDelete: true,
                    reorderable:   true,
                    itemTemplate:  'home/list-item',
                    listTemplate:  'home/list-container',
                    emptyTemplate: 'home/emptylist',
                    filterFunction: this.filterNotes.bind(this),
                },
                this.list_model
            );

            $('notes-list').observe(Mojo.Event.listTap, 
                function (ev) {
                    this.controller.stageController.pushScene('note', ev.item);
                }.bind(this)
            );

            this.controller.setupWidget(
                Mojo.Menu.commandMenu, 
                {/*menuClass: "no-fade"*/} /*undefined*/, 
                {items:	[
                    {label:'+ New...', command:'new-note'},
                ]}
            );
           /* 
            this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: "no-fade"}, 
            {
                items: 
                [
                    {
                        icon: 'new-task-button',
                        command: 'add'
                    },
                ]
            });
            */
            

        },

        filterNotes: function (filterString, list_widget, offset, count) {
            var matching, lowerFilter;
            /*
            if (filterString) {
                lowerFilter = filterString.toLocaleLowerCase();
                function matches (example) {
                    if(example.title && example.title.toLocaleLowerCase().startsWith(lowerFilter)){
                        return example.title.toLocaleLowerCase().startsWith(lowerFilter);            
                    }else if(example.keywords && example.keywords .toLocaleLowerCase().match(lowerFilter)){
                        return example.keywords.toLocaleLowerCase().match(lowerFilter);
                    }else{
                        return false;
                    }
                }
                matching = this.kExamples.findAll(matches);
            } else {
                matching = this.kExamples;
            }
            */
            matching = this.notes_model.findAll();

            this.list_model.items = matching;			
            list_widget.mojo.setLength(matching.length);
            list_widget.mojo.setCount(matching.length);
            list_widget.mojo.noticeUpdatedItems(0, matching);
        },

        activate: function (event) {
            console.log('HOME ACTIVATE');
        },

        deactivate: function (event) {
            console.log('HOME DEACTIVATE');
        },

        cleanup: function (event) {
            console.log('HOME CLEANUP');
        }

    };
}());

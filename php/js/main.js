/**
 * Main JS enhancements for browser
 */
var Main = function() {

    return {

        autosaving: true,
        is_saving: false,

        init: function() {
            window.addEvents({
                'domready': this.onReady.bindWithEvent(this),
                'resize': this.onResize.bindWithEvent(this)
            });
            return this;
        },

        onReady: function() {
            if ($$('.main_editform').length) {
                
                if (!this.IS_MOBILE) {
                    this.adjustEditorDimensions.delay(250);
                }

                $('save').addEvent('click', function(ev) {
                    this.save();
                    return ev.stop();
                }.bindWithEvent(this));
                
                this.autoSave.periodical(5000, this);
            }
        },

        onResize: function(ev) {
            if ($$('.main_editform').length) {
                if (!this.IS_MOBILE) {
                    this.adjustEditorDimensions.delay(250);
                }
            }
        },

        adjustEditorDimensions: function() {
            var hd_size = $$('#editor .header')[0].getCoordinates();
            var ft_size = $$('#editor .footer')[0].getCoordinates();
            var pg_size = $(document.body).getSize();
            
            var dims = {
                left:   (4 + 'px'),
                top:    (4 + hd_size.bottom) + 'px',
                width:  (pg_size.x - 10) + 'px',
                height: (pg_size.y - hd_size.height - ft_size.height - 20) + 'px',
            };
            
            $('text').setStyles(dims);
        },

        autoSave: function() {
            if (!this.autosaving || !$('autosave').get('checked')) {
                return;
            }
            this.save();
        },
            
        save: function() {
            if (this.is_saving) return;
            this.is_saving = true;
            
            var req = new Request.JSON({
                url: $('editor').get('action'),
                onSuccess: function(data) {
                    $$('.footer').highlight('#8f8', '#fff');
                }.bind(this),
                onFailure: function(data) {
                    $$('.footer').highlight('#8f8', '#fff');
                }.bind(this),
                onComplete: function() {
                    this.is_saving = false;
                }.bind(this)
            }).post($('editor'));
        },

        EOF:null
    };

}().init();

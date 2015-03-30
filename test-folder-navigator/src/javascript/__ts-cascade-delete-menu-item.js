Ext.define('Rally.technicalservices.ui.menu.item.CascadeDeleteMenuItem', {
    extend:  Rally.ui.menu.item.RecordMenuItem ,
    alias: 'widget.tsrecordmenuitemcascadedelete',

    clickHideDelay: 1,

    config: {

        /**
         * @cfg {Rally.data.wsapi.Model}
         * The record of the menu
         */
        record: undefined,

        /**
         * @cfg {Function}
         * This is called when a menu item is clicked
         */
        handler: function () {
            this._onCascadeDeleteClicked();
        },

        /**
         * @cfg {Function}
         *
         * A function that should return true if this menu item should show.
         * @param record {Rally.data.wsapi.Model}
         * @return {Boolean}
         */
        predicate: function (record) {
            return true;
        },

        /**
         * @cfg {String}
         * The display string
         */
        text: 'Cascade Delete'

    },

    constructor:function (config) {
        this.initConfig(config);
        console.log('here');
        this.callParent(arguments);
    },
    
    _onCascadeDeleteClicked: function() {
        console.log('click!');
        var confirm_dialog = this._launchConfirmDialog();
        confirm_dialog.on('confirm',this._doDelete, this);
    },
    
    _doDelete: function() {
        alert('woooo-hoo!');
    },
    
    _launchConfirmDialog: function() {
        return Ext.create('Rally.ui.dialog.ConfirmDialog', {
            title: 'Cascade Delete',
            message: "Are you sure? <br/>This will delete this folder's descendant folders and test cases.  THERE IS NO UNDO.",
            confirmLabel: 'OK',
            listeners: {
                confirm: function(){
                 //do something awesome
                }
            }
        });
    }
});
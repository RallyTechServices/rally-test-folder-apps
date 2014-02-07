Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    logger: new Rally.technicalservices.Logger(),
    defaults: { padding: 5, margin: 5 },
    items: [
        {xtype:'container',itemId:'message_box'},
        {xtype:'container',itemId:'grid_box'},
        {xtype:'tsinfolink',informationHtml:'Displays Test Cases that have either no value or duplicate values in a chosen field.'}
    ],
    launch: function() {
        if (typeof(this.getAppId()) == 'undefined' ) {
            // not inside Rally
            this._showExternalSettingsDialog(this.getSettingsFields());
        } else {
            this._getData();
        }
    },
    _getData: function() {
        this.logger.log("_getData");
        var scenario_id_field_name = this.getSetting('scenario_id_field_name');
        if ( typeof( scenario_id_field_name ) == 'undefined' ) {
            this.down('#message_box').update("Select 'Edit App Settings' from the gear menu to select a field to represent Scenario IDs");
        } else {
            this.logger.log("Field Name: ",scenario_id_field_name);
        }
    },
    getSettingsFields: function() {
        return [{
            name: 'scenario_id_field_name',
            xtype: 'rallyfieldcombobox',
            model: 'TestCase',
            fieldLabel: 'ID Field Name',
            readyEvent: 'ready' //event fired to signify readiness
        }];
    },
    // ONLY FOR RUNNING EXTERNALLY
    _showExternalSettingsDialog: function(fields){
        var me = this;
        if ( this.settings_dialog ) { this.settings_dialog.destroy(); }
        this.settings_dialog = Ext.create('Rally.ui.dialog.Dialog', {
             autoShow: false,
             draggable: true,
             width: 400,
             title: 'Settings',
             buttons: [{ 
                text: 'OK',
                handler: function(cmp){
                    var settings = {};
                    Ext.Array.each(fields,function(field){
                        settings[field.name] = cmp.up('rallydialog').down('[name="' + field.name + '"]').getValue();
                    });
                    me.settings = settings;
                    cmp.up('rallydialog').destroy();
                    me._getData();
                }
            }],
             items: [
                {xtype:'container',html: "&nbsp;", padding: 5, margin: 5},
                {xtype:'container',itemId:'field_box', padding: 5, margin: 5}]
         });
         Ext.Array.each(fields,function(field){
            me.settings_dialog.down('#field_box').add(field);
         });
         this.settings_dialog.show();
    }
});

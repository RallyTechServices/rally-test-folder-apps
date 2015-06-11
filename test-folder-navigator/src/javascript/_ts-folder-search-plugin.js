
/**
 * Adds a button for an artifact search box to a Rally.ui.gridboard.GridBoard.
 *
 */
Ext.define('Rally.technicalservices.GridBoardSearchControl', {
    alias: 'plugin.tsgridboardsearchcontrol',
    extend:'Ext.AbstractPlugin',
    mixins: ['Rally.ui.gridboard.plugin.GridBoardControlShowable'],
    requires: [
        'Rally.data.ModelTypes'
    ],
    headerPosition: 'right',

    /**
     * @cfg {Object}
     * Config for button.
     */
    searchControlConfig: {},

    containerConfig: {},

    init: function(gridboard) {
        this.callParent(arguments);
        this.gridboard = gridboard;

        this.context = this.searchControlConfig.context || this.gridboard.getContext();
        
        var control = this.showControl();
        this.searchButton = control.down('rallybutton');
        
    },

    getControlCmpConfig: function() {
        var me = this;
        var config = Ext.merge({
            xtype: 'container',
            width: 72,
            layout: 'hbox',
            items: [
                Ext.merge({
                    xtype: 'rallybutton',
                    text: '<span class="icon-search ">&nbsp;</span>',
                    cls: 'secondary rly-small',
                    listeners: {
                        scope: me,
                        click: me._showSearchDialog,
                        boxready: me._applyFilter
                    },
                    toolTipConfig: {
                        html: 'Search',
                        anchor: 'top',
                        mouseOffset: [-9, -2]
                    },
                    margin: '3 9 3 30'
                }, this.searchControlConfig)
            ]
        }, this.containerConfig);

        return config;
    },

    _showSearchDialog: function() {
        Ext.create('Rally.technicalservices.TestFolderChooserDialog',{
            autoShow: true,
            storeConfig: {
                context: this.context
            },
            listeners: {
                scope: this,
                artifactchosen: this._onRecordSelected
            }
        });
    },

    // always force to default filter
    _applyFilter: function() {
        var filterArgs = {
                types: [],
                filters: []
            };
        this.gridboard.applyCustomFilter(filterArgs);
    },

    _getTypesByNames: function(modelNames) {
        return _.map(modelNames, function (modelName) {
                return Rally.data.ModelTypes.getTypeByName(modelName).toLowerCase();
            }, this);
    },
    
    _onRecordSelected: function(dialog, record) {
        console.log("found: ", record);
        this.gridboard.fireEvent('recordSelect', record);
    }
});

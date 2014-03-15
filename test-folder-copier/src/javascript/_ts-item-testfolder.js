Ext.define('Rally.technicalservices.TestFolderTreeItem', {
    extend: 'Rally.ui.tree.TreeItem',
    alias: 'widget.tstestfoldertreeitem',

    config: {
        displayedFields: ['Name']
    },

    getContentTpl: function(){
        var me = this;

        return Ext.create('Ext.XTemplate',
                    '<tpl if="this.canDrag()"><div class="icon drag"></div></tpl>',
                    '{[this.getActionsGear()]}',
                    '<div class="textContent ellipses">{[this.getFormattedId()]} - {Name}</div>',
                    /*'<div class="rightSide">',
                        '{[this.getScheduleState(values)]}',
                    '</div>',*/
                {
                    canDrag: function(){
                        return me.getCanDrag();
                    },
                    getActionsGear: function(){
                        return me._buildActionsGearHtml();
                    },
                    getScheduleState: function(){
                        //return Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'ScheduleState');
                        return ""
                    },
                    getFormattedId: function(){
                        //return Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'FormattedID');
                        return me.getRecord().get('FormattedID');
                    }
                }
        );
    },
    _buildActionsGearHtml: function(){
//        var hasPermissions = this.getRecord().get('creatable') || this.getRecord().get('updatable') || this.getRecord().get('deletable');
//        return hasPermissions? '<div class="row-action icon"></div>': '';
        return '';
    }

});
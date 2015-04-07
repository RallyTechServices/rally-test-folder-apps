Ext.override(Rally.ui.grid.CheckboxModel,{

    _recordIsSelectable: function(record) {
        return true;
    }
            
});

Ext.override(Rally.ui.menu.bulk.RecordMenu,{

    _getMenuItems: function () {
        var records = this.getRecords();
        var items = [
            {
                text: 'Bulk Actions (' + records.length + ' items)',
                canActivate: false,
                cls: 'menu-item-read-only'
            }
        ].concat(this.items);

        items.push({xtype: 'rallyrecordmenubulktestset'});
  

        _.each(items, function (item) {
            Ext.apply(item, {
                records: records,
                store: this.store,
                onBeforeAction: this.onBeforeAction,
                onActionComplete: this.onActionComplete,
                context: this.getContext()
            });
        }, this);

        return items;
    }
});
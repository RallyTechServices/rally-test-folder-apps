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

Ext.override(Rally.ui.gridboard.GridBoard,{
        
    _applyGridFilters: function(grid, filterObj) {
        if (!_.isEmpty(filterObj.types)) {
            grid.store.parentTypes = filterObj.types;
        }
        console.log("FILTER: ", filterObj);
        console.log("FILTER +:", this._getConfiguredFilters(filterObj.filters || [], filterObj.types || []));
        grid.store.clearFilter(true);
        grid.store.filter(this._getConfiguredFilters(filterObj.filters || [], filterObj.types || []));
    },
    
    _getConfiguredFilters: function(extraFilters, types) {
        var isBoard = this.getToggleState() === 'board';
        
        
        // want to see if we can decide to only apply the permanent filter if extra is empty
        console.log("EXTRA filters:", extraFilters);
        
        var filters =  _.compact(Ext.Array.merge(
                    this.storeConfig && this.storeConfig.filters,
                    isBoard && this.cardBoardConfig.storeConfig && this.cardBoardConfig.storeConfig.filters,
                    !isBoard && this.gridConfig.storeConfig && this.gridConfig.storeConfig.filters,
                    extraFilters));
                    
        if ( extraFilters.length != 0 ) {
            filters = extraFilters;
        }

        console.log("FILTERS:", filters);
        
        return filters;
    }
        
});
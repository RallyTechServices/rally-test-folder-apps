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

        grid.store.clearFilter(true);
        grid.store.filter(this._getConfiguredFilters(filterObj.filters || [], filterObj.types || []));
    },
    
    _getConfiguredFilters: function(extraFilters, types) {
        var isBoard = this.getToggleState() === 'board';
        
        // want to see if we can decide to only apply the permanent filter if extra is empty
        if ( !extraFilters ) { extraFilters = []; }
        var filters =  _.compact(Ext.Array.merge(
                    this.storeConfig && this.storeConfig.filters,
                    isBoard && this.cardBoardConfig.storeConfig && this.cardBoardConfig.storeConfig.filters,
                    !isBoard && this.gridConfig.storeConfig && this.gridConfig.storeConfig.filters,
                    extraFilters));
                    
        if ( extraFilters.length != 0 ) {
            filters = extraFilters;
        }
        
        return filters;
    },

    _showRecord: function(item) {
        this.setLoading("Finding " + item.get("FormattedID") + "...");
        console.log("show", item);
        var me = this;
        this.grid.collapseAll();
        Rally.data.ModelFactory.getModel({
            type: 'TestFolder',
            success: function(model) {
                model.load(item.get('_ref'), {
                    fetch: ['FormattedID', 'Name', 'ObjectID', 'Parent'],
                    callback: function(record) {
                        me._buildAncestorArray(record,[record]).then({
                            success: function(records) {
                                console.log("array:",records);
                                me._expandNode(records);
                            },
                            failure: function(msg) {
                                console.log("oops," + msg);
                            }
                        });
                    },
                    scope: this
                });
            }
        });

        
        
    },
    
    _expandNode: function(ancestor_array) {
        this.setLoading("Expanding...");
        if ( ancestor_array.length > 0 ) {
            var top_record = ancestor_array[ancestor_array.length - 1];
            var node = this.grid.getStore().findExactRecord(top_record);

            console.log("expand ", top_record.get('Name'));
            console.log('node:',node);
            if ( !node ) {
                this.setLoading(false);
                return;
            }
            
            if ( node && ancestor_array.length > 1) {
                console.log("Expanded:", node.isExpanded());
                ancestor_array.pop();
                
                if ( !node.isExpanded() ) {
                    node.on('expand', function() {
                        this._expandNode(ancestor_array);
                    }, this, {single: true});
                    node.expand(false);
                } else {
                    console.log("already expanded");
                    this._expandNode(ancestor_array);
                }
            } else {
                this.grid.getSelectionModel().select([node]);
                
                this.grid.getView().focusNode(node);

//                this.grid.getView().focusRow(
//                    this.grid.getStore().indexOf(node)
//                );
//                
                this.setLoading(false);
            }
        }
    },
    
    // Ancestor array is in reverse order (top of tree is last item)
    _buildAncestorArray: function(record,ancestor_array) {
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        
        var parent = record.get("Parent");
        if ( parent ) {
            this._getFolderByObjectID(parent.ObjectID).then({
                success: function(records) {
                    var record = records[0];
                    ancestor_array.push(record);

                    me._buildAncestorArray(record,ancestor_array).then({
                        success: function(ancestors) {
                            deferred.resolve(ancestors);
                        },
                        failure: function(msg) {
                            deferred.reject(msg);
                        }
                    });
                },
                failure: function(msg) {
                    deferred.reject(msg);
                }
            });
        } else {
            deferred.resolve(ancestor_array);
        }
        return deferred.promise;
    },
    
    _getFolderByObjectID: function(objectID){
        var deferred = Ext.create('Deft.Deferred');
        Ext.create('Rally.data.wsapi.Store',{
            filters: [{property:'ObjectID',value:objectID}],
            fetch: ['FormattedID','Name','Parent','ObjectID'],
            model: 'TestFolder'
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    deferred.reject('Problem getting folders: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _addGrid: function() {
        var grid = this.add(this._getGridConfig());

        this.mon(grid, 'afterproxyload', this._onGridOrBoardLoad, this);

        if (!this.useFilterCollection && this.currentCustomFilter) {
            this._applyGridFilters(grid, this.currentCustomFilter);
        }
        
        this.on('recordSelect',this._showRecord, this);
        
        this.grid = grid;
        return grid;
    }
        
});
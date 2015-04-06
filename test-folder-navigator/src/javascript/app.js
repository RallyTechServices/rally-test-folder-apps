Ext.define('TestFolderNavigator', {
        extend: 'Rally.app.GridBoardApp',
        requires: [
            'Rally.ui.DateField'
        ],
        cls: 'testfolder-app',
        modelNames: ['TestFolder'],
        statePrefix: 'ts-testfolder',

        logger: Ext.create('Rally.technicalservices.Logger'),
        
        _applyBoardFilters: function(board, filterObj) {
            console.log('filters',filterObj);
            
            board.refresh({
                types: filterObj.types,
                storeConfig: {filters: this._getConfiguredFilters(filterObj.filters || [], filterObj.types || [])}
            });
        },
        
       
        
        getPermanentFilters: function () {
            return [
                Rally.data.wsapi.Filter.or([
                    { property: 'Parent', operator: '=', value: "" }
                ])
            ];
        },

        getFieldPickerConfig: function () {
            var config = this.callParent(arguments);
            config.gridFieldBlackList = _.union(config.gridFieldBlackList, [
                'VersionId',
                'Parent'
            ]);
            return _.merge(config, {
                gridAlwaysSelectedValues: ['FormattedID','Name']
            });
        },
        
        getGridStores: function () {
            return this._getTreeGridStore();
        },

        _getTreeGridStore: function () {
            return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build(_.merge({
                autoLoad: false,
                sorters: [{ property: 'ObjectID', direction: 'ASC'}],
                childPageSizeEnabled: true,
                mapper: Ext.create('Rally.technicalservices.TFParentChildMapper'),
                enableHierarchy: true,
                fetch: _.union(['Workspace'], this.columnNames),
                models: _.clone(this.models),
                pageSize: 25,
                remoteSort: true,
                root: {expanded: true},
//                storeType: 'Rally.technicalservices.data.wsapi.testfolder.Store',
                getParentFieldNamesByChildType: this._getParentFieldNamesByChildType,
                childLevelSorters: [{ property: 'FormattedID',direction: 'ASC'}]

            }, this.getGridStoreConfig())).then({
                success: function (treeGridStore) {
                    this.logger.log(treeGridStore);
                    treeGridStore.enableHierarchy = true;
                    //treeGridStore.on('load', this.publishComponentReady, this, { single: true });
                    return { gridStore: treeGridStore };
                },
                scope: this
            });
        },

        _getParentFieldNamesByChildType: function(childType, parentType) {
            var model = this.model.getArtifactComponentModel(childType);
            return(['Parent']);
            return _.transform(this.mapper.getParentFields(childType, parentType), function(acc, field) {
                var typePath = field.typePath,
                    fieldName = field.fieldName,
                    hasFieldModel = this.model.getArtifactComponentModel(typePath) || model.hasField(fieldName);

                if (hasFieldModel) {
                    acc.push(fieldName.replace(/\s+/g, ''));
                }
            }, [], this);
            
        },
        
        getAddNewConfig: function () {
            return Ext.merge(this.callParent(arguments), {
                showRank: false,
                showAddWithDetails: false,
                openEditorAfterAddFailure: false,
                minWidth: 800
            });
        },
        
        getGridBoardPlugins: function () {
            return [
//                {
//                    ptype: 'rallygridboardaddnew',
//                    context: this.getContext()
//                },
                {
                    ptype: 'rallygridboardcustomfiltercontrol',
                    filterChildren: false,
                    filterControlConfig: _.merge({
                        modelNames: this.modelNames,
                        stateful: true,
                        stateId: this.getScopedStateId('custom-filter-button')
                    }, this.getFilterControlConfig()),
                    showOwnerFilter: false,
                    ownerFilterControlConfig: {
                        stateful: true,
                        stateId: this.getScopedStateId('owner-filter')
                    }
                },
                _.merge({
                    ptype: 'rallygridboardfieldpicker',
                    headerPosition: 'left'
                }, this.getFieldPickerConfig())
            ]
            .concat(this.enableGridBoardToggle ? 'rallygridboardtoggleable' : [])
            .concat(this.getActionsMenuConfig());
        },

        getGridConfig: function (options) {
            return {
                xtype: 'rallytreegrid',
                alwaysShowDefaultColumns: false,
                columnCfgs: this.getColumnCfgs(),
                enableBulkEdit: false,
                enableRanking: Rally.data.ModelTypes.areArtifacts(this.modelNames),
                expandAllInColumnHeaderEnabled: true,
                plugins: this.getGridPlugins(),
                stateId: this.getScopedStateId('grid'),
                stateful: true,
                store: options && options.gridStore,
                storeConfig: {
                    filters: this.getPermanentFilters()
                },
                summaryColumns: [],
                listeners: {
                    afterrender: this.publishComponentReady,
                    storeload: {
                        fn: function () {
                            this.fireEvent('contentupdated', this);
                        },
                        single: true
                    },
                    scope: this
                }
            };
        }
    });
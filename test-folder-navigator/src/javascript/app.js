Ext.define('TestFolderNavigator', {
        extend: 'Rally.app.GridBoardApp',
        requires: [
            'Rally.ui.DateField'
        ],
        cls: 'testfolder-app',
        modelNames: ['TestFolder','TestCase'],
        statePrefix: 'ts-testfolder',

        logger: Ext.create('Rally.technicalservices.Logger'),
        
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
                'VersionId'
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
        }
    });
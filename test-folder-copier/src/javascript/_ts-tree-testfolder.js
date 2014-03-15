/**
 *
 * A tree of test folders
 *
 *      @example
 *      Ext.create('Ext.Container', {
 *          items: [{
 *              xtype: 'tstestfoldertree'
 *          }],
 *          renderTo: Ext.getBody().dom
 *      });
 */
Ext.define('Rally.technicalservices.TestFolderTree', {
    extend: 'Rally.ui.tree.Tree',
    alias: 'widget.tstestfoldertree',
    requires: [
        'Rally.technicalservices.TestFolderTreeItem',
        'Rally.data.util.ArtifactParentAttributeHelper'
    ],

    constructor: function(config){

        config = Ext.Object.merge({
            topLevelModel:'TestFolder',
            childModelTypeForRecordFn: this.childModelTypeForRecordFn,
            givenAParentRecordWhatIsTheAttributeConnectingAChildToThisParentFn: Rally.data.util.ArtifactParentAttributeHelper.parentAttributeForChildRecordOf,
            givenAChildRecordWhatIsTheAttributeConnectingItToTheParentFn: this.givenAChildRecordWhatIsTheAttributeConnectingItToTheParent,
            givenAChildAndParentRecordWhatAttributeShouldConnectTheChildToTheParentFn: this.givenAChildAndParentRecordWhatAttributeShouldConnectTheChildToTheParent,
            canExpandFn: this.canExpandItem,
            enableDragAndDrop: true,
            dragDropGroupFn: this.dragDropGroup,
            dragThisGroupOnMeFn: this.dragThisGroupOnMe,
            scope: this,
            treeItemConfigForRecordFn: this.treeItemConfigForRecordFn,
            listeners: {
                beforerecordsaved: this.beforeRecordSaved
            },
            topLevelStoreConfig: {
                fetch:['TestCases','Children','FormattedID','Name']
            }
        }, config);

        this.callParent([config]);
    },

    treeItemConfigForRecordFn: function(record){
        var config = {
            selectable: false,
            canDrag: false
        };

        if(this._isTestFolder(record)){
            config.xtype = 'tstestfoldertreeitem';
        } else {
            config.xtype = 'rallytreeitem';
        }

        return config;
    },

    beforeRecordSaved: function(record, newParentRecord){
//        if(this._isTestFolder(record)){
//            if(this._isTestFolder(newParentRecord)){
//                record.set('PortfolioItem', '');
//            } else {
//                record.set('Parent', '');
//            }
//        }
    },

    _isTestFolder: function(record) {
        return record.get('_type') === 'testfolder';
    },

    _isTestCase: function(record) {
        return record.get('_type') === 'testcase';
    },

    childModelTypeForRecordFn: function(record){

        if(this._isTestFolder(record)){
            return 'TestFolder';
//            if(this._testFolderHasTestCases(record)){
//                return 'TestCase';
//            } else {
//                return 'TestFolder';
//            }
        }
        return null;

    },

    givenAChildAndParentRecordWhatAttributeShouldConnectTheChildToTheParent: function(childRecord, parentRecord){
        if(this._isTestCase(childRecord)){
            return 'TestFolder';
        } else {
            return 'Parent';
        }
    },

    givenAChildRecordWhatIsTheAttributeConnectingItToTheParent: function (childRecord) {
        if(this._isTestCase(childRecord)){
            return 'TestFolder';
        } else {
            return 'Parent';
        }
    },

    canExpandItem: function(record){
        // return this._testFolderHasChildren(record) || this._testFolderHasTestCases(record);
        return this._testFolderHasChildren(record);
    },

    dragDropGroup: function(record){
        return Rally.util.Ref.getOidFromRef(record.get('Workspace')._ref) + '-' + record.get('_type').toLowerCase();
    },

    dragThisGroupOnMe: function(record){
        var workspace = Rally.util.Ref.getOidFromRef(record.get('Workspace')._ref);

        if(this._isTestCase(record)){
            return [];
        }

        if(this._isTestFolder(record)){
            if(this._testFolderHasTestCases(record)){
                return workspace + '-' + 'testcase';
            } else if(this._testFolderHasChildren){
                return workspace + '-' + 'testfolder';
            } else {
                return [
                    workspace + '-' + 'testcase',
                    workspace + '-' + 'testfolder'
                ];
            }
        }

    },

    _onObjectCreate: function(record){
        this.callParent(arguments);
    },

    _testFolderHasTestCases: function(record){
        var has_cases = false;
        if ( record.get('TestCases') && record.get('TestCases').Count ) {
            if ( record.get('TestCases').Count > 0 ) {
                has_cases = true;
            }
        }
        return has_cases;
    },
    
    _testFolderHasChildren: function(record) {
        var has_kids = false;
        if ( record.get('Children') && record.get('Children').Count ) {
            if ( record.get('Children').Count > 0 ) {
                has_kids = true;
            }
        }
        return has_kids;
    },
    
    _getChildTypeFetchFields: function(parentFieldName) {
        //return this._getDefaultTopLevelFetchFields().concat([parentFieldName, 'WorkProduct', 'Project']);
        return this.config.topLevelStoreConfig.fetch.concat([parentFieldName, 'WorkProduct', 'Project']);
    }
});
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    projects: { target: null, source: null },
    stores: { target: null, source: null },
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'button_box',margin: 5, padding: 5, defaults: { margin: 5 }},
        {xtype:'container',layout: {type:'hbox'}, defaults:{ padding: 5, margin: 5 },items:[
            {xtype:'container',itemId:'source_selection_box',flex:1},
            {xtype:'container',itemId:'source_folder_box', flex:1},
            {xtype:'container',itemId:'target_folder_box', flex:1},
            {xtype:'container',itemId:'target_selection_box',flex:1}
        ]},
        {xtype:'tsinfolink'}
    ],
    launch: function() {        
        this._addProjectSelectors(this.down('#source_selection_box'),this.down('#target_selection_box'));
        this._addButtons();
    },
    _addButtons: function() {
        this.down('#button_box').add({
            xtype:'rallybutton',
            itemId: 'copy_button',
            text:'Copy to Target',
            disabled: true,
            scope: this,
            handler: this._copyFolders
        });
        this.down('#button_box').add({
            xtype:'rallybutton',
            itemId:'clear_button',
            text:'Clear Target & Copy',
            disabled: true
        });
        this.down('#button_box').add({
            xtype:'rallybutton',
            text:'Add to Target',
            itemId:'add_button',
            disabled: true
        });
    },
    _addProjectSelectors:function(source_container,target_container) {
        var workspace = this.getContext().getWorkspace();
        this.logger.log('_addProjectSelectors',workspace);
        source_container.add({
            fieldLabel: 'Source Project',
            labelCls: 'ts-column-header',
            labelAlign: 'top',
            xtype: 'rallyprojectpicker',
            workspace: workspace._ref,
            listeners: {
                scope: this,
                change: function(picker) {
                    this.logger.log("source project ", picker.getSelectedRecord());
                    this._showTestFolders(picker.getSelectedRecord(),this.down('#source_folder_box'),'source');
                }
            }
        });
        target_container.add({
            fieldLabel: 'Target Project',
            labelCls: 'ts-column-header',
            labelAlign: 'top',
            xtype: 'rallyprojectpicker',
            workspace: workspace._ref,
            listeners: {
                scope: this,
                change: function(picker) {
                    this.logger.log("target project ", picker.getSelectedRecord());
                    this._showTestFolders(picker.getSelectedRecord(),this.down('#target_folder_box'),'target');
                }
            }
        });
    },
    _showTestFolders:function(project,container,direction) {
        container.removeAll();
        this.logger.log('_showTestFolders',direction);
        this.stores[direction] = null;
        this.projects[direction] = project;
        this._updateButtonStates();
        this.stores[direction] = Ext.create('Rally.data.wsapi.Store',{
            autoLoad: true,
            model:'TestFolder',
            limit:'Infinity',
            fetch: true,
            sorters: [
                {
                    property: 'Name',
                    direction: 'ASC'
                }
            ],
            context: {
                projectScopeDown: false,
                projectScopeUp: false,
                project: project.get('_ref')
            },
            listeners: {
                scope: this,
                load: function(store,records){
                    this._addGrid(store,container,direction);
                    this._updateButtonStates();
                }
            }
        });
    },
    _addGrid: function(store,container,direction) {
        container.removeAll();
        container.add({
            xtype:'rallygrid',
            store: store,
            showPagingToolbar: false,
            showRowActionsColumn: false,
            columnCfgs: [
                {text:'id',dataIndex:'FormattedID'},
                {text:'Test Folders',dataIndex:'Name'}
            ]
        });
    },
    _updateButtonStates: function() {
        this.down('#copy_button').setDisabled(true);
        this.down('#clear_button').setDisabled(true);
        this.down('#add_button').setDisabled(true);

        var target_store = this.stores['target'];
        var source_store = this.stores['source'];
        var target_project = this.projects['target'];
        var source_project = this.projects['source'];
        
        if ( target_store && source_store && source_project.get('_ref') != target_project.get('_ref') ) {
            if ( source_store.getTotalCount() > 0 ) {
                if ( target_store.getTotalCount() == 0 ) {
                    this.down('#copy_button').setDisabled(false);
                } else {
                    this.down('#clear_button').setDisabled(false);
                    this.down('#add_button').setDisabled(false);
                }
            }
        }
    },
    _copyFolders: function() {
        var me = this;
        this.logger.log("_copyFolders");
        var target_store = this.stores['target'];
        var source_store = this.stores['source'];
        var target_project = this.projects['target'];
        var source_project = this.projects['source'];
        
        var source_folders = source_store.getRecords();
        
        this.setLoading("Copying Folders");
        Rally.data.ModelFactory.getModel({
            type: 'TestFolder',
            success: function(model) {
                var promises = [];
                
                Ext.Array.each( source_folders, function(source_folder){
                    promises.push(me._createItem(model,source_folder,{},me));
                });
                Deft.Promise.all(promises).then({
                    success: function(records) {
                        // result is an array of arrays
                        var new_records_by_original_ref = {};
                        Ext.Array.each(records, function(pair){
                            new_records_by_original_ref[pair[0].get('_ref')] = pair[1];
                        });
                        
                        me._setParentFolders(source_folders,new_records_by_original_ref,me);
                    },
                    failure: function(error) {
                        alert("There was a problem: " + error);
                    }
                });
            }
        });
    },
    _createItem: function(model,source_item,change_fields, scope){
        var deferred = Ext.create('Deft.Deferred');
        var me = scope;
        me.logger.log("Create from ", source_item);
        var item = me._cleanseItem(source_item.getData(),change_fields);
        me.logger.log("Create as ", item);
        var record = Ext.create(model, item );
        record.save({
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    deferred.resolve([source_item,result]);
                } else {
                    deferred.reject("Could not save " + item['Name']);
                }
            }
        });
        return deferred.promise;
    },
    _cleanseItem: function(original_item,change_fields){
        var item = Ext.clone(original_item);
        // remove unnecessary fields
        delete item['ObjectID'];
        delete item['Children'];
        delete item['CreationDate'];
        delete item['FormattedID'];
        delete item['Parent'];
        delete item['Subscription'];
        delete item['TestCases'];
        delete item['Workspace'];
        delete item['_CreatedAt'];
        delete item['_objectVersion'];
        delete item['_p'];
        delete item['_ref'];
        delete item['_refObjectName'];
        // set project
        item['Project'] = this.projects['target'].get('_ref');
        
        return Ext.Object.merge(item, change_fields);;
    },
    _setParentFolders: function(source_folders,new_records_by_original_ref,scope){  
        var me = scope;
        me.logger.log("_setParentFolders",source_folders,new_records_by_original_ref);
        var promises = [];
        Ext.Array.each( source_folders, function(source_folder){
            promises.push(me._setParentFolder(source_folder,new_records_by_original_ref,me));
        });
        Deft.Promise.all(promises).then({
            success: function(records) {
                me.logger.log("done with set parent folder promises");
                me._copyTestCases(source_folders,new_records_by_original_ref,me);
            },
            failure: function(error) {
                alert("There was a problem: " + error);
            }
        });
    },
    _setParentFolder: function(original_record,new_records_by_original_ref,scope){
        var me = scope;
        me.logger.log("_setParentFolder",original_record);
        this.setLoading("Setting Parent Folders");
        var deferred = Ext.create('Deft.Deferred');
        var original_parent = original_record.get('Parent');
        var original_ref = original_record.get('_ref');
        var record = new_records_by_original_ref[original_ref];
        if ( record && original_parent ) {
            me.logger.log("Original Parent", original_parent);
            var original_parent_ref = original_parent._ref;
            var new_parent = new_records_by_original_ref[original_parent_ref];
            if ( new_parent ) {
                record.set("Parent",new_parent.get('ObjectID'));
            }
            me.logger.log("Saving...");
            record.save({
                callback: function(result, operation) {
                    if(operation.wasSuccessful()) {
                        deferred.resolve([result]);
                    } else {
                        deferred.reject("Could not save " + item['Name']);
                    }
                }
            });
        } else {
            me.logger.log("No update");
            deferred.resolve([]);
        }
        
        return deferred.promise;
    },
    _copyTestCases: function(source_folders,new_records_by_original_ref,me){
        me.logger.log('_copyTestCases ',source_folders);
        me.setLoading("Copy Test Cases");
        var promises = [];
        Rally.data.ModelFactory.getModel({
            type: 'TestCase',
            success: function(model) {
                Ext.Array.each( source_folders, function(source_folder){
                    me.logger.log(" TCs", source_folder.get('TestCases').Count);
                    if ( source_folder.get('TestCases').Count > 0 ) {
                        promises.push(me._copyTestCasesForFolder(source_folder,new_records_by_original_ref[source_folder.get('_ref')],model, me));
                    }
                });
                if ( promises.length === 0 ) {
                    me.logger.log("No test cases to copy");
                    me._showTestFolders(me.projects['target'],me.down('#target_folder_box'),'target');
                    me.setLoading(false);
                } else {
                    Deft.Promise.all(promises).then({
                        success: function(records) {
                            me.logger.log("done with copy test case promises");
                            me._showTestFolders(me.projects['target'],me.down('#target_folder_box'),'target');
                            me.setLoading(false);
                        },
                        failure: function(error) {
                            alert("There was a problem: " + error);
                            me._showTestFolders(me.projects['target'],me.down('#target_folder_box'),'target');
                            me.setLoading(false);
                        }
                    });
                }
            }
        });
    },
    _copyTestCasesForFolder: function(source_folder, target_folder, model, scope) {
        var me = scope;
        var deferred = Ext.create('Deft.Deferred');
        source_folder.getCollection('TestCases').load({
            fetch: true,
            callback: function(testcases, operation, success) {
                me.logger.log("Test Cases: ", testcases);
                var promises = [];
                Ext.Array.each(testcases, function(testcase) {
                    me.logger.log("FormattedID: ", testcase.get('FormattedID'));
                    promises.push(me._createItem(model,testcase,{ TestFolder: target_folder.get('ObjectID') }, me));
                });
                Deft.Promise.all(promises).then({
                    success: function(records){
                        deferred.resolve(testcases);
                    },
                    failure: function(error) {
                        deferred.reject(error);
                    }
                });
            }
        });
        return deferred.promise;
    }
});

/*
 */
Ext.define('Rally.technicalservices.Logger',{
    /**
     * 
     * @param {String} A prefix to put into the message between
     *      the timestamp and the message
     */
    class_prefix: null,
    
    constructor: function(config){
        Ext.apply(this,config);
    },
    
    log: function(args){
        var timestamp = "[ " + Ext.util.Format.date(new Date(), "Y-m-d H:i:s.u") + " ]";
        //var output_args = arguments;
        //output_args.unshift( [ "[ " + timestamp + " ]" ] );
        //output_args = Ext.Array.push(output_args,arguments);
        
        var output_args = [];
        output_args = Ext.Array.push(output_args,[timestamp]);
        output_args.push(this._getClassPrefix(this.class_prefix));
        
        output_args = Ext.Array.push(output_args, Ext.Array.slice(arguments,0));

        window.console && console.log.apply(console,output_args);
    },
    
    _getClassPrefix: function(prefix) {
        display_prefix = "";
        if ( Ext.isString(prefix) ) {
            display_prefix = "-" + prefix + "-";
        }
        
        return display_prefix;
    }

});

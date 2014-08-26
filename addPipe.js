/*
    Make the object pipeable.
*/
var addPipe = function addPipe( blueprint ){
    var defineProperty = Object.defineProperty;
    
    var functionNamePattern = /^[a-z][a-zA-Z0-9]+$/;
    
    /*
        Checks if each bucket has a name and the name is unique across all channels.
    */
    var verifyBucketList = function verifyBucketList( bucketList ){
        var result;
        var bucketNamespaceSet = [ ];
        _.each( bucketList,
            function onEachBucket( bucket ){
                if( _.isArray( bucket ) ){
                    result = verifyBucketList( bucket );
                    return result;
                }else if( typeof bucket == "object" ){
                    result = verifyBucketList( _.values( bucket ) );
                    return result;
                }else{
                    //I explicitly made it like this for readability.
                    //This will check if the bucket has a name and it is not empty.
                    result = ( "name" in bucket && bucket.name );
                    
                    //This will check if the bucket is unique across all buckets.
                    result = result && !_.contains( bucketNamespaceSet, bucket.name );
                    
                    //This will check if the bucket is a function.
                    result = result && typeof bucket == "function";
                    
                    //This will check if the function name is proper.
                    result = result && functionNamePattern.test( bucket.name );
                    
                    if( result ){
                        bucketNamespaceSet.push( bucket.name );
                    }
                    return result;
                }
            } );
        return result;
    };
    
    var generateFlow = function generateFlow( entity ){
        switch( entity[ ":level" ] ){
            case "pipe":
                break;
                
            case "channel":
                var channel = entity;
                break;
                
            case "bucket":
                var bucket = entity;
                var preFlow = function preFlow( ){
                    
                };
                var postFlow = function postFlow( ){
                    
                };
                break;
                
            default:
                var error = new Error( "invalid entity for flow generation" );
                console.error( error );
                throw error;
        }    
    };
    
    /*
        This will construct the structure of the bucket map.
    */
    var buildBucketMap = function buildBucketMap( bucketMap, bucketList ){
        _.each( bucketList,
            function onEachBucket( bucket, index ){
                var namespace;
                if( _.isArray( bucket ) ){
                    //Set the bucket as bucket list.
                    var bucketList = bucket;
                    namespace = bucketList[ 0 ].name;
                    
                    bucketMap[ namespace ] = { };
                    defineProperty( bucketMap[ namespace ], ":parent",
                        {
                            "enumerable": false,
                            "configurable": false,
                            "writable": false,
                            "value": bucketList    
                        } );
                    
                }else if( typeof bucket == "object" ){
                    //Set the bucket as bucket set.
                    var bucketSet = bucket;
                    
                    /*
                        The namespace is the first property determined by getting the
                            property list of the bucketSet.
                    */
                    namespace = _.keys( bucketSet )[ 0 ];
                    
                    bucketMap[ namespace ] = { };
                    
                    //Recall the buildBucketMap on this using the namespace.
                    buildBucketMap( bucketMap[ namespace ], _.values( bucketSet ) );
                    
                }else{
                    namespace = bucket.name;
                    
                    bucketMap[ namespace ] = { };
                    defineProperty( bucketMap[ namespace ], ":parent",
                        {
                            "enumerable": false,
                            "configurable": false,
                            "writable": false,
                            "value": bucket    
                        } );
                        
                }
                
                if( index == 0 ){
                    defineProperty( bucketMap, ":bucketMapID",
                        {
                            "enumerable": false,
                            "configurable": false,
                            "writable": false,
                            "value": namespace
                        } );
                }
                
                /*
                    This will let us traverse properly.
                */
                defineProperty( bucketMap[ namespace ], ":parentMap",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "writable": false,
                        "value": bucketMap    
                    } );
                
                /*
                    This is the individual bucket count for each bucket
                        because each bucket can be a bucket map.
                */
                defineProperty( bucketMap[ namespace ], ":bucketCount",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "get": function get( ){
                            return _.keys( bucketMap[ namespace ] ).length    
                        }
                    } );
                
                //Mark level type.
                defineProperty( bucketMap[ namespace ], ":level",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "writable": false,
                        "value": "bucket"
                    } );
            } );    
    };
    
    var pipe = ( function constructPipe( ){
        var propertyList = [ ];
        var propertySet = { };
        
        //Security object let us store security data for secured access in the pipes.
        var securityObject = { };
        var lockDateList = [ ];
        defineProperty( securityObject, "lockDate",
            {
                "enumerable": false,
                "configurable": false,
                "set": function set( value ){
                    if( !_.contains( lockDateList, value ) ){
                        lockDateList.push( value );    
                    }   
                },
                "get": function get( ){
                    return _.toArray( lockDateList ).pop( );    
                }
            } );
            
        /*
            Verify if lock date is one of the cached lock dates.
            
            This will enable us to access multiple lock dates due
                to parallel lock date creations.
        */
        defineProperty( securityObject, "verifyLockDate",
            {
                "enumerable": false,
                "configurable": false,
                "writable": false,
                "value": function verifyLockDate( lockDate ){
                    if( _.contains( lockDateList, lockDate ) ){
                        this.destroyLockDate( lockDate );
                        
                        return true;
                    }
                    return false;
                }
            } );
        
        /*
            This will clear the previously cached lock dates.
        */
        defineProperty( securityObject, "destroyLockDate",
            {
                "enumerable": false,
                "configurable": false,
                "writable": false,
                "value": function destroyLockDate( lockDate ){
                    if( !( lockDate in this ) ){
                        var onTimeout = function onTimeout( lockDate, self ){
                            console.info( "clearing security waste [" + lockDate + "]" );
                            lockDateList = _.without( lockDateList, lockDate );
                            delete self[ lockDate ];
                        }
                        
                        this[ lockDate ] = setTimeout( onTimeout, 1000, lockDate, this );    
                    }        
                }
            } );
        
        //Applies lockDate to the environment.
        var protectedCall = function protectedCall( procedure ){
            if( typeof procedure != "function" ){
                var error = new Error( "invalid procedure" );
                console.error( error );
                throw error;
            }
            
            var parameters = _.toArray( arguments ).slice( 1 );
            
            //This is for security purposes.
            securityObject.lockDate = Date.now( ) * Math.random( );
            
            return procedure.apply( securityObject.lockDate, parameters );         
        };
        
        //Checks if the lockDate matches.
        var securityCheck = function securityCheck( self, errorMessage ){
            if( securityObject.lockDate !== self.valueOf( ) ){
                if( !securityObject.verifyLockDate( self.valueOf( ) ) ){
                    var error = new Error( errorMessage );
                    console.error( error );
                    throw error;    
                }else{
                    console.info( "warning:delayed processing of access detected" );
                }
            }else{
                securityObject.destroyLockDate( self.valueOf( ) );
            }
        };
        
        /*
            This will let us do this,
            
            Let's you bind the piped property to the object itself.
            myObject.pipe.[property].bind( );
            This means that all flows from myData pipe 
                will update myObject.myData property.
            
            Let's you bind the piped property to the other channel.
            myObject.pipe.[property].bind( [channelX] );
            It means all flow from this channel will flow to this channel.
            
            Let's you bind the bucket to another bucket in a channel.
            myObject.pipe.[property].flow.bind( [bucketNamespace] ).to( [bucketNamespaceX] );
            to() is a helper function only you can also do this bind( namespace, namespaceX )
            
            Let's you bind a channel to a bucket.
            myObject.pipe.[property].bind.to( [bucketNamespace] );
            It means all flow from this channel will go to this bucket.
            
            Let's you bind all flows to a specific channel.
            myObject.pipe.bind( [channelX] );
            This means all flows from all channels will flow to this channel
                excluding this channel.
            
            Let's you bind all flows to a specific bucket regardless of channels.
            myObject.pipe.bind.to( [bucketNamespaceX] );
            Since a pipe object can have the same bucket namespace in different channels.
            
            Let's you bind all flows to a specific bucket in a specific channel.
            myObject.pipe.bind( [channelX] ).to( [bucketNamespaceX] );
            
            You can also bind multiple namespaces of buckets or channels.
            
            Note that bound procedures are not part of the flow but rather
                they are like leakages or additions to the flow without disrupting
                the normal flow.
                
            They are not also stored but their paths are cached and retraced everytime
                a flow will begin.
        */
        var constructBind = function constructBind(  ){
            var self = this;
            
            var bind = function bind( namespace ){
                    
            };
            
            return bind;
        };
        
        
        /*
            This will let us do this.
            
            myObject.pipe.[property].flow( function functionName( value ){
            
            } );
        */
        var constructFlow = function constructFlow( property ){
            var self = this;
            
            var flow = function flow( bucket ){
                /*
                    A flow can recieve multiple bucket configuration.
                    
                    If the bucket is an array the flow suggests a waterfall model.
                    
                    If there are multiple parameter buckets, the flow
                        suggest a parallel model.
                    
                    Buckets namespaces should be unique.
                */
                var bucketList = _.toArray( arguments );
                
                //Trap all errors here.
                var error;
                if( !verifyBucketList( bucketList ) ){
                    error = new Error( "invalid bucket configuration" );
                    console.error( error );
                    throw error;
                }else if( !( "pipes" in propertySet[ property ] ) ){
                    //This is rare but we need to be assured.
                    error = new Error( "fatal:no pipes" );
                    console.error( error );
                    throw error;
                }
                
                /*
                    Assemble the bucket map for this flow.
                    Bucket map ID is based on the first bucket.
                */
                var bucketMap = { };
                buildBucketMap( bucketMap, bucketList );
                    
                //This is the global bucket count for the bucket map.
                defineProperty( bucketMap, ":bucketCount",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "get": function get( ){
                            return _.keys( bucketMap ).length    
                        }
                    } );

                //This will help us stop the traversal if root is reached.
                defineProperty( bucketMap, ":root",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "writable": false,
                        "value": true
                    } );
                
                //Mark level type.    
                defineProperty( bucketMap, ":level",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "writable": false,
                        "value": "bucket"
                    } );
                
                protectedCall( propertySet[ property ].pipes.push, bucketMap );
                
                /*
                    All flows will return a flow again so that you can reuse things.
                    TODO: Construct this so that succeeding flows using this will be
                        branched from the former flow creating a hierarchy.
                */
                return constructFlow.call( self, property );
            };
            
            //TODO: Add all the semantic procedures here.
            
            return flow;
        };
  
        var constructChannel = function constructChannel( property ){
            //Cache the property name.
            propertyList.push( property );
            
            var channel = ( function construct( ){
                var pipes = { };
                
                defineProperty( pipes, "length",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "get": function get( ){
                            return _.keys( pipes ).length;
                        }
                    } );
                
                defineProperty( pipes, "push",
                    {
                        "enumerable": false,
                        "writable": false,
                        "configurable": false,
                        "value": function push( bucket ){
                            //This will prevent outside attacks using the pipe :)
                            securityCheck( this, "fatal:security is breached by trying to add flows from pipe outside the environment" );
                            
                            /*
                                If this is accessed outside then throw a fatal security
                                    exception because we don't want to expose
                                    the injected flow so that they can't tamper it.
                            */
                            defineProperty( pipes, pipes.length,
                                {
                                    "enumerable": true,
                                    "configurable": false,
                                    "writable": false,
                                    "value": function bucketHolder( ){
                                        securityCheck( this, "fatal:security is breached by trying to access buckets outside the environment" );
                                        
                                        return bucket;       
                                    }
                                } );
                        }
                    } );

                /*
                    So that we can do this myObject.pipe.[property].destroy( );
                    This will empty the pipes channelled to this property.
                    
                    Take note that this is absolute destruction.
                */
                var destroy = function destroy( ){
                    pipes = { };
                };
                
                /*
                    This will clog the channel making all flows bound to this channel
                        stops flowing.
                        
                    The given namespace will clog the specific flow to the bucket.
                    
                    If no namespace given it will clog the entire channel.
                */
                var clog = function clog( namespace ){
                        
                };
                
                /*
                    Unclog the channel. If the channel is not clogged and you
                        unclog it, it will throw an error.
                */
                var unclog = function unclog( namespace ){
                    
                };
                
                /*
                    Returns the status of the flow if
                    1. CLOGGED
                    2. NORMAL
                    3. DETOURED
                        - if the flow is detoured to the end
                        - or one of the buckets does not recieves flows.
                    4. ABNORMAL
                        - if the flow is circular
                        - if the flow is leaking
                        - if the flow is congested
                */
                var checkFlow = function checkFlow( namespace ){
                    
                };
                
                var propertyData = { };
                
                var self = this;
                
                return {
                    "enumerable": false,
                    "set": function set( value ){
                        propertyData.value = value;
                        
                        /*
                            
                        */
                    },
                    
                    "get": function get( ){
                        var value = { };
                        defineProperty( value, "pipes",
                            {
                                "enumerable": true,
                                "configurable": false,
                                "writable": false,
                                "value": pipes
                            } );
                        
                        defineProperty( value, "destroy",
                            {
                                "enumerable": true,
                                "configurable": false,
                                "writable": false,
                                "value": destroy
                            } );
                          
                        defineProperty( value, "toString",
                            {
                                "enumerable": true,
                                "configurable": false,
                                "writable": false,
                                "value": function toString( ){
                                    if( !( "value" in propertyData ) ){
                                        return "undefined";
                                    }
                                    return propertyData.value.toString( );
                                }
                            } );
                            
                        defineProperty( value, "valueOf",
                            {
                                "enumerable": true,
                                "configurable": false,
                                "writable": false,
                                "value": function valueOf( ){
                                    if( !( "value" in propertyData ) ){
                                        return undefined;
                                    }
                                    return propertyData.value.valueOf( );
                                }
                            } );
                        
                        //Mark level type.    
                        defineProperty( value, ":level",
                            {
                                "enumerable": false,
                                "configurable": false,
                                "writable": false,
                                "value": "channel"
                            } );    
                        return value;
                    }
                };    
            } ).call( this );
            
            defineProperty( propertySet, property, channel );
        };
  
        var setPipe = ( function construct( ){
            return ( function set( value ){
                if( typeof value == "string" ){
                    var property = value;
                    if( !( property in propertySet ) ){
                        constructChannel.call( this, property );
                    }
                }else if( typeof value == "object"
                    && value.constructor.name == "Object" )
                {
                    /*
                        If this is an object it means it is passing multiple
                            property flows.
                    */
                    _.each( value,
                        function onEachProperty( value, property ){
                            if( !( property in propertySet ) ){
                                constructChannel.call( this, property );    
                            }
                            
                            //TODO: Flow the value.
                        }, this );
                }else{
                    //TODO: Flow the value.    
                }
            } ); 
        } )( );
        
        var getPipe = ( function construct( ){
            return ( function get( ){
                var objectEnvironment = { };
                _.each( propertyList,
                    function onEachProperty( property ){
                        /*
                            Make a copy of the environment from the property in
                                the property list.
                        */
                        var environment = objectEnvironment[ property ] 
                                        = _.clone( propertySet[ property ] );
                        
                        //Attach the constructed flow function.
                        environment.flow = constructFlow.call( this, property );
                    }, this );
                
                //Mark level type.    
                defineProperty( objectEnvironment, ":level",
                    {
                        "enumerable": false,
                        "configurable": false,
                        "writable": false,
                        "value": "pipe"
                    } );
                return objectEnvironment;
            } );
        } )( );
  
        return {
            "enumerable": false,
            "set": setPipe,
            "get": getPipe
        };
    } )( );
    
    defineProperty( blueprint.prototype, "pipe", pipe );
};
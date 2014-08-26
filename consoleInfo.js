var consoleInfo = console.info;
console.info = function info( ){
    var outputPane = $( "<div></div>" )
        .mouseover( function onMouseOver( ){
            datePane.show( );    
        } )
        .mouseleave( function onMouseLeave( ){
            datePane.hide( );
        } );
    
    outputPane.append( $( "<span></span>" )
        .text( "[I]" )
        .css( {
            "background-color": "#33ff33",
            "padding": "1px",
            "font-size": "11px",
            "font-family": "Consolas",
            "color": "#000000",
            "margin-right": "3px",
            "margin-bottom": "1px"
        } ) );
    
    var datePane;
    outputPane.append( datePane = $( "<span></span>" )
        .text( new Date( Date.now( ) ) )
        .css( {
            "font-size": "11px",
            "font-family": "Consolas",
            "color": "#aaaaaa"
        } )
        .hide( ) );
        
    _.chain( arguments )
        .toArray( )
        .each( function onEachParameter( parameter, index ){
            var subOutputPane = $( "<span></span>" )
                .css( {
                    "font-size": "12px",
                    "font-family": "Consolas",
                    "color": "#33ff33",
                    "margin-left": "3px",
                    "margin-right": "3px"
                } );
            subOutputPane.text( parameter );
            outputPane.append( subOutputPane );
        } );
        
    $( "body" ).append( outputPane );
    consoleInfo.apply( this, arguments );
};
var consoleError = console.error;
console.error = function error( ){
    var outputPane = $( "<div></div>" )
        .mouseover( function onMouseOver( ){
            datePane.show( );    
        } )
        .mouseleave( function onMouseLeave( ){
            datePane.hide( );
        } );
    
    outputPane.append( $( "<span></span>" )
        .text( "[E]" )
        .css( {
            "background-color": "#ff3333",
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
            "overflow": "hidden",
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
                    "color": "#ff3333",
                    "margin-left": "3px",
                    "margin-right": "3px"
                } );
            subOutputPane.text( parameter );
            outputPane.append( subOutputPane );
        } );
        
    $( "body" ).append( outputPane );
    consoleError.apply( this, arguments );
};
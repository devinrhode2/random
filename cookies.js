defaultOptions = {
    expiresAt: null,
    path: '/',
    domain: null,
    secure: false
};

/**
* resolveOptions - receive an options object and ensure all options are present and valid, replacing with defaults where necessary
*                  would prefer jQuery.extend here, but we want this library to work without jQuery
* @access private
* @static
* @parameter Object options - optional options to start with
* @return Object complete and valid options object
*/
resolveOptions = function( options ) {
    var returnValue, expireDate;

    if( typeof options !== 'object' || options === null ) {
    	returnValue = defaultOptions;
    } else {
    	returnValue = {
    		expiresAt: defaultOptions.expiresAt,
    		path: defaultOptions.path,
    		domain: defaultOptions.domain,
    		secure: defaultOptions.secure
    	};

    	if( typeof options.expiresAt === 'object' && options.expiresAt instanceof Date )
    	{
    		returnValue.expiresAt = options.expiresAt;
    	}
    	else if( typeof options.hoursToLive === 'number' && options.hoursToLive !== 0 )
    	{
    		expireDate = new global.Date();
    		expireDate.setTime( expireDate.getTime() + ( options.hoursToLive * 60 * 60 * 1000 ) );
    		returnValue.expiresAt = expireDate;
    	}

    	if( typeof options.path === 'string' && options.path !== '' )
    	{
    		returnValue.path = options.path;
    	}

    	if( typeof options.domain === 'string' && options.domain !== '' )
    	{
    		returnValue.domain = options.domain;
    	}

    	if( options.secure === true )
    	{
    		returnValue.secure = options.secure;
    	}
    }

    return returnValue;
};
/**
* assembleOptionsString - analyze options and assemble appropriate string for setting a cookie with those options
*
* @access private
* @static
* @parameter options OBJECT - optional options to start with
* @return STRING - complete and valid cookie setting options
*/
assembleOptionsString = function( options )
{
    options = resolveOptions( options );

    return (
    	( typeof options.expiresAt === 'object' && options.expiresAt instanceof Date ? '; expires=' + options.expiresAt.toGMTString() : '' ) +
    	'; path=' + options.path +
    	( typeof options.domain === 'string' ? '; domain=' + options.domain : '' ) +
    	( options.secure === true ? '; secure' : '' )
    );
};

/**
* parseCookies - retrieve document.cookie string and break it into a hash with values decoded and unserialized
*
* @access private
* @static
* @return OBJECT - hash of cookies from document.cookie
*/
parseCookies = ( function()
{
    var parseJSON, rbrace;
    
    parseJSON = global.JSON && global.JSON.parse ?
    	( function()
    	{
    		var rvalidchars, rvalidescape, rvalidtokens, rvalidbraces;

    		rvalidchars = /^[\],:{}\s]*$/;
    		rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    		rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    		rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;

    		return function( data )
    		{
    			var returnValue, validJSON;

    			returnValue = null;

    			if( typeof data === 'string' && data !== '' )
    			{
    				// Make sure leading/trailing whitespace is removed (IE can't handle it)
    				data = trim( data );

    				if( data !== '' )
    				{
    					try
    					{
    						// Make sure the incoming data is actual JSON. Logic borrowed from http://json.org/json2.js
    						validJSON = rvalidchars.test( data.replace( rvalidescape, '@' ).replace( rvalidtokens, ']' ).replace( rvalidbraces, '' ) );

    						returnValue = validJSON ?
    							global.JSON.parse( data ) :
    							null;
    					}
    					catch( e1 )
    					{
    						returnValue = null;
    					}
    				}
    			}

    			return returnValue;
    		};
    	}() ) :
    	function()
    	{
    		return null;
    	};

    rbrace = /^(?:\{.*\}|\[.*\])$/;

    return function()
    {
    	var cookies, splitOnSemiColons, cookieCount, i, splitOnEquals, name, rawValue, value;

    	cookies = {};
    	splitOnSemiColons = document.cookie.split( ';' );
cookieCount = splitOnSemiColons.length;

    	for( i = 0; i < cookieCount; i = i + 1 )
    	{
    		splitOnEquals = splitOnSemiColons[i].split( '=' );

    		name = trim( splitOnEquals.shift() );
    		if( splitOnEquals.length >= 1 )
    		{
    		  rawValue = splitOnEquals.join( '=' );
    	  }
    	  else
    	  {
    rawValue = '';
  }

    		try
    		{
    			value = decodeURIComponent( rawValue );
    		}
    		catch( e2 )
    		{
    			value = rawValue;
    		}

    		//Logic borrowed from http://jquery.com/ dataAttr method
    		try
    		{
    			value = value === 'true' ?
    				true :
    				value === 'false' ?
    					false :
    					! isNaN( value ) ?
    						parseFloat( value ) :
    						rbrace.test( value ) ?
    							parseJSON( value ) :
    							value;
    		}
    		catch( e3 ) {}

    		cookies[name] = value;
    	}
    	return cookies;
    };
}() );

/**
 * get - get one, several, or all cookies
 *
 * @access public
 * @paramater Mixed cookieName - String:name of single cookie; Array:list of multiple cookie names; Void (no param):if you want all cookies
 * @return Mixed - Value of cookie as set; Null:if only one cookie is requested and is not found; Object:hash of multiple or all cookies (if multiple or all requested);
 */
function getCookie( cookieName )
{
    var returnValue, item, cookies;

    cookies = parseCookies();

    if( typeof cookieName === 'string' )
    {
    	returnValue = ( typeof cookies[cookieName] !== 'undefined' ) ? cookies[cookieName] : null;
    }
    else if( typeof cookieName === 'object' && cookieName !== null )
    {
    	returnValue = {};
    	for( item in cookieName )
    	{
    		if( Object.prototype.hasOwnProperty.call( cookieName, item ) )
    		{
    			if( typeof cookies[cookieName[item]] !== 'undefined' )
    			{
    				returnValue[cookieName[item]] = cookies[cookieName[item]];
    			}
    			else
    			{
    				returnValue[cookieName[item]] = null;
    			}
    		}
    	}
    } else {
      returnValue = cookies;
    }
    
    return returnValue;
};

/**
 * set - set or delete a cookie with desired options
 *
 * @access public
 * @paramater String cookieName - name of cookie to set
 * @paramater Mixed value - Any JS value. If not a string, will be JSON encoded (http://code.google.com/p/cookies/wiki/JSON); NULL to delete
 * @paramater Object options - optional list of cookie options to specify
 * @return void
 */
function setCookie(cookieName, value, options) {
  if( typeof options !== 'object' || options === null ) {
    options = {};
  }
  
  // TODO: consider value serialization method to parallel parse cookies
  if( typeof value === 'undefined' || value === null ) {
    value = '';
    options.hoursToLive = -8760;
  } else {
    //Logic borrowed from http://jquery.com/ dataAttr method and reversed
    value = value === true ?
        	'true' :
        	value === false ?
        		'false' :
        		! isNaN( value ) ?
        			'' + value :
        			value;
    if( typeof value !== 'string' ) {
      if( typeof JSON === 'object' && JSON !== null && typeof JSON.stringify === 'function' ) {
        value = JSON.stringify( value );
      } else {
        throw new Error( 'cookies.set() received value which could not be serialized.' );
      }
    }
  }
  
  var optionsString = assembleOptionsString( options );
  
  document.cookie = cookieName + '=' + encodeURIComponent( value ) + optionsString;
};
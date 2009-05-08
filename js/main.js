var currentLocation = window.location.href;
var sideBar;

/**
* Function : dump()
* Arguments: The data - array,hash(associative array),object
*    The level - OPTIONAL
* Returns  : The textual representation of the array.
* This function was inspired by the print_r function of PHP.
* This will accept some data as the argument and return a
* text that will be a more readable version of the
* array/hash/object that is given.
*/
function dump(arr,level) 
{
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects
	 for(var item in arr) {
	  var value = arr[item];
	 
	  if(typeof(value) == 'object') { //If it is an array,
	   dumped_text += level_padding + "'" + item + "' ...\n";
	   dumped_text += dump(value,level+1);
	  } else {
	   dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
	  }
	 }
	} else { //Stings/Chars/Numbers etc.
	 dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
} 

function checkLocation() 
{
	if(window.location.href != currentLocation) 
	{
		reload();
	}
}

function reload() 
{
	currentLocation = window.location.href;
	newLocation = currentLocation
		.replace(/\?(.+)#/, '')
		.replace('#', '/')					// Replace # with /
		.replace(/([^:])\/+/g, '$1/');		// Remove multiple slashes
	$.post(newLocation, {}, function(response) {
		var content = document.getElementById('content');
		content.innerHTML = response;
		var scripts = content.getElementsByTagName('script');
		for(var i = 0; i < scripts.length; i++)
		{
			$.globalEval(scripts[i].innerHTML);
		}
		init();
		AjaxResponse.handle(response);
	});
	return false;
}

function init() 
{
	$('table.list').each(function() {
		var tBody = this.tBodies[0];
		var rowCount = tBody.rows.length;
		for(var i = 0; i < rowCount; i++)
		{
			if(i % 2 == 0)
			{
				tBody.rows[i].className += ' even';
			}
			else
			{
				tBody.rows[i].className += ' odd';
			}
		}
	});
	
	$('div.ui-layout-center form').ajaxForm({
		success: function(responseText, statusText) {
			AjaxResponse.handle(responseText);
			$('div.ui-layout-center').html(responseText);
			init();
		}
	});

	if(currentLocation.match(/schema\/(\w+)#tables\/(\w+)\//))
	{
		schema = RegExp.$1.toString();
		table = RegExp.$2.toString();
		
		$('#bc_table a span').text(table);
		$('#bc_table a').attr('href', baseUrl + '/schema/' + schema + '#tables/' + table + '/structure');
		$('#bc_table').show();
	}
	else 
	{
		$('#bc_table').hide();
	}
	
	// Add checkboxes to respective tables
	try 
	{
		$('table.addCheckboxes').addCheckboxes().removeClass('addCheckboxes');
	}
	catch(exception) {
	}
}

$(document).ready(function()
{
	$('body').layout({
		
		// General
		applyDefaultStyles: true,

		// North
		north__size: 40,
		north__resizable: false,
		north__closable: false,
		north__spacing_open: 1,

		// West
		west__size: userSettings.sidebarWidth,
		west__initClosed: userSettings.sidebarState == 'closed',
		west__onresize_end: function () {
			sideBar.accordion('resize');
			if($('.ui-layout-west').width() != userSettings.sidebarWidth)
			{
				// Save
				userSettings.sidebarWidth = $('.ui-layout-west').width(); 
				$.post(baseUrl + '/ajaxSettings/set', {
						name: 'sidebarWidth',
						value: $('.ui-layout-west').width()
					}
				);
			}
			return;
		},
		west__onclose_end: function () {
			sideBar.accordion('resize');
			// Save
			$.post(baseUrl + '/ajaxSettings/set', {
					name: 'sidebarState',
					value: 'closed'
				}
			);
			return;
		},
		west__onopen_end: function () {
			sideBar.accordion('resize');
			// Save
			$.post(baseUrl + '/ajaxSettings/set', {
					name: 'sidebarState',
					value: 'open'
				}
			);
			return;
		}
	});

	// ACCORDION - inside the West pane
	sideBar = $("#sideBar").accordion({
		animated: "slide",
		addClasses: false,
		autoHeight: true,
		collapsible: false,
		fillSpace: true,
		selectedClass: "active"
	});
	
	// Setup list filters

	$('#tableList').setupListFilter($('#tableSearch'));
	$('#bookmarkList').setupListFilter($('#bookmarkSearch'));
	
	
	/*
	 * Ajax functions
	 */ 
	
	// START
	$(document).ajaxStart(function() {
		$('#loading').css({'background-image': 'url(../images/loading4.gif)'}).fadeIn();
		//$('#loading2').show();
	});
	
	// STOP
	$(document).ajaxStop(function() {
		//$('#loading2').hide();
		$('#loading').css({'background-image': 'url(../images/loading5.gif)'}).fadeOut();
	});
	
	// ERROR
	$(document).ajaxError(function() {
		Notification.add('warning', 'Ajax request failed', 'Click <a href="javascript:void(0);" onclick="reload();">here</a> to reload site.', null);
	});


	/*
	 * Misc
	 */
	setInterval(checkLocation, 100);
	
	if(currentLocation.indexOf('#') > -1)
	{
		reload();
	}
});

var AjaxResponse = {
	
	handle: function(data)
	{
		if(!data)
			return; 
			
		try 
		{
			data = JSON.parse(data);
		}
		catch(Exception) {}
		
		if(data.redirectUrl) 
		{
			window.location.href = data.redirectUrl;
		}
		
		if(data.reload)
		{
			reload();
		}
		
		if(data.notifications && data.notifications.length > 0) 
		{
			$.each(data.notifications, function() {
				
				Notification.add(this.type, this.title, this.message, this.code, this.options);
				
			});
		}
	}
	
};


String.prototype.trim = function() {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

String.prototype.startsWith = function(str)
{
	return (this.match("^"+str)==str);
}


/*
 * Language things
 */

var lang = {
	
	get: function(category, variable, parameters) 
	{
		var package = lang[category];
		if(package && package[variable])
		{
			variable = package[variable];
			if(parameters)
			{
				for(var key in parameters)
				{
					variable = variable.replace(key, parameters[key]);
				}
			}
		}
		return variable;
	}
	
};
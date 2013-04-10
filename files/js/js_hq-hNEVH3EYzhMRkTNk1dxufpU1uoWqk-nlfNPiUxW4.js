(function ($) {

Drupal.behaviors.commentNotify = {
  attach: function (context) {
    $('#edit-notify', context)
      .bind('change', function() {
        $('#edit-notify-type', context)
          [this.checked ? 'show' : 'hide']()
          .find('input[type=checkbox]:checked').attr('checked', 'checked');
      })
      .trigger('change');
  }
}

})(jQuery);
;
(function ($) {
  Drupal.AlterEgo = Drupal.AlterEgo || {};
  
  Drupal.AlterEgo.avatarPopupCache = new Array();
  Drupal.AlterEgo.avatarPopupLoading = false;
  Drupal.AlterEgo.avatarPopupAid = 0;
  
  Drupal.AlterEgo.autoAttach = function() {
	  
	  $("#select-avatar-block-char-arrow").mouseenter(
		function() {
			$(this).css("background-position-y", "-144px");
			$("#select-avatar-block-pulldown").show();
    		// Position pulldown below name
    	    $("#select-avatar-block-pulldown").position({
    	      of: $("#select-avatar-block-name"),
    	      my: "left top",
    	      at: "left bottom",
    	      collision: "none"
    	    });
		}
	  );
	  $("#select-avatar-block-pulldown").mouseleave(
	    function() {
	    	$("#select-toon-block-char-arrow").css("background-position-y", "4px");
	    	$("#select-avatar-block-pulldown").hide();
	    }
	  );
	  // JavaScript is enabled.  Hide select form.
	  $("#alter-ego-set-active-avatar-form").css('display','none');
	  $("#select-avatar-block-char-arrow").css('display','inline');
	  
	  // Make the replacement select DIV trigger the hidden select form.
	  $("#select-avatar-block-pulldown").find(".select-avatar-block-select-item").click(function() {
	    $("#alter-ego-set-active-avatar-form SELECT").val($(this).attr('rel'));
	    $("#alter-ego-set-active-avatar-form").submit();
	    return false;
	  });
	  
	  // Add our popup div to the end of the document.
	  $("BODY").append('<div id="alter-ego-popup"></div>');
      
      // Loop over links and find /avatar/%avatar links.
      $("DIV.content").find("a.avatar-popup").each(function (index) {
    	  //if($(this).attr('href') && ($(this).attr('href').substr(0,8) == '/avatar/' || $(this).attr('href').substr(0,11) == '/?q=avatar/') && !$(this).hasClass('np')) {
    	  var aid = parseInt($(this).attr('rel'));
    	  
    	  if(aid) {
    		  if(aid) {
    			// Remove native browser popup
    			$(this).attr('title','');
    			$(this).mousemove(function(ev) {
    				if(Drupal.AlterEgo.avatarPopupLoading == false) {
    					if(Drupal.AlterEgo.avatarPopupAid != aid) {
    						// We are looking at a new toon.
		    				var found = -999;
		    				for(var i=0;i<Drupal.AlterEgo.avatarPopupCache.length;i++) {
		    					if(Drupal.AlterEgo.avatarPopupCache[i][0] == aid) {
		    						found = i;
		    					}
		    				}
		    				if(found != -999) {
		    					$("#alter-ego-popup").html(Drupal.AlterEgo.avatarPopupCache[found][1]); 
		    					Drupal.AlterEgo.avatarPopupAid = aid;
		    				} else {
		    				  $("#alter-ego-popup").html('<div class="summary-popup"><div class="popup-text-wrapper">loading...</div></div>');
		    				  $("#alter-ego-popup").css('display','block');
		    				  
		    				  var popup_url = 'avatar/' + aid + '/popup';
		    				// See if we are not using clean URLs
		    				  if ($(this).attr('href').indexOf('?q=') != -1) {
		    					popup_url = Drupal.settings.basePath + '?q=' + popup_url; 
		    				  }
		    				  else {
		    					popup_url = Drupal.settings.basePath + popup_url;
		    				  }
		    				  
		    				  
		    				  $("#alter-ego-popup").load(popup_url, function(txt) {
		    					Drupal.AlterEgo.avatarPopupCache.push(new Array(aid,txt));
		    					Drupal.AlterEgo.avatarPopupLoading = false;
		      				    Drupal.AlterEgo.avatarPopupAid = aid;
		      		          });
		    				  // Don't start new requests until this is done loading.
		    				  Drupal.AlterEgo.avatarPopupLoading = true;
		    				}
	    				}
	    				
    				}
    				$("#alter-ego-popup").css('display','block');
    				$("#alter-ego-popup").position({my: "left top", at: "bottom", of: $(this), offset: "0 0", collision: "flip"});
    				//$("#alter-ego-popup").position({my: "left top", at: "bottom right", of: $(ev), offset: "10 0", collision: "flip"});
    			});
    			$(this).mouseleave(function (ev) {
    				$("#alter-ego-popup").css('display','none');
    			});
    		  }
    	  }
      });	  
	};

	$(Drupal.AlterEgo.autoAttach);
})(jQuery);;
(function ($) {
  Drupal.Wowtoon = Drupal.Wowtoon || {};
  Drupal.Wowtoon.allRealms = new Array();
  
  Drupal.Wowtoon.autoAttach = function() {
	  if ($("#edit-field-wowtoon-realm-und").attr('id')) {
		  var optionList = $("#edit-field-wowtoon-realm-und").attr('options');
		  var defaultValue = $("#edit-field-wowtoon-realm-und").val();
		  if (defaultValue == '_none') {
			  defaultValue = '';
		  }
		  // Grab all of the options from the options list.
		  for (var i=0;i<optionList.length;i++) {
			  if (optionList[i].value != '_none') {
				  Drupal.Wowtoon.allRealms.push(optionList[i].value);
			  }
		  }
		  
		  // Create replacement text field.
		  $("#edit-field-wowtoon-realm-und").after('<input type="text" maxLength="255" id="wowguild-replaced-realms-select" value="' + defaultValue + '" value size="60" class="form-text" />');
		  // Allow autocomplete.
		  $("#wowguild-replaced-realms-select").autocomplete({
			  source: Drupal.Wowtoon.allRealms
		  });
		  
		  // If typed text matchs one of the select options, change the select.
		  $("#wowguild-replaced-realms-select").change(function() {
			  var testRealm = $("#wowguild-replaced-realms-select").val();
			  for (var i in Drupal.Wowtoon.allRealms) {
				  if (Drupal.Wowtoon.allRealms[i].toLowerCase() == testRealm.toLowerCase()) {
					  $("#edit-field-wowtoon-realm-und").val(Drupal.Wowtoon.allRealms[i]);
				  }
			  }
		  });
		  
		  // When the user clicks the autocomplete, set the select value.
		  $("UL.ui-autocomplete").click(function() {
			  $("#edit-field-wowtoon-realm-und").val($("#wowguild-replaced-realms-select").val());
		  });
		  
		  // Hide orignal submit.
		  $("#edit-field-wowtoon-realm-und").hide();
      }
	  
	  
	  /*
	  
      
      // Add popup DIV
      $("BODY").append('<div id="wowtoon-popup"></div>');
      
      // Loop over links and find /toon/%toon links.  TODO: Adjust for q=/toon/ links.
      $("DIV.content").find("a").each(function (index) {
    	  // Don't attach to links with the class "np"
    	  if($(this).attr('href') && ($(this).attr('href').substr(0,6) == '/toon/' || $(this).attr('href').substr(0,9) == '/?q=toon/') && !$(this).hasClass('np')) {
    		  var tid_string = $(this).attr('href').split('/');
    		  var tid = parseInt(tid_string.pop());
    		  if(tid) {
    			// Remove native browser popup
    			$(this).attr('title','');
    			$(this).mousemove(function(ev) {
    				if(wowtoon_loading_popup == false) {
    					if(wowtoon_popup_tid != tid) {
    						// We are looking at a new toon.
		    				var found = -999;
		    				for(var i=0;i<wowtoon_popup_cache.length;i++) {
		    					if(wowtoon_popup_cache[i][0] == tid) {
		    						found = i;
		    					}
		    				}
		    				if(found != -999) {
		    					$("#wowtoon-popup").html(wowtoon_popup_cache[found][1]); // 'cache hit ' + 
		      				    wowtoon_popup_tid = tid;
		    				} else {
		    				  $("#wowtoon-popup").html('<div class="summary-popup"><div class="popup-text-wrapper">loading...</div></div>');
		    				  $("#wowtoon-popup").css('display','block');
		    				  var popup_url = $(this).attr('href') + '/popup';
		    				  $("#wowtoon-popup").load(popup_url, function(txt) {
		      				    wowtoon_popup_cache.push(new Array(tid,txt));
		      				    wowtoon_loading_popup = false;
		      				    wowtoon_popup_tid = tid;
		      		          });
		    				  wowtoon_loading_popup = true;
		    				}
	    				}
	    				
    				}
    				//$("#wowtoon-popup").position({my: "left top", at: "top right", of: $(this), offset: "5 0", collision: "flip"});
    				$("#wowtoon-popup").css('display','block');
    				$("#wowtoon-popup").position({my: "left top", at: "top right", of: ev, offset: "10 0", collision: "flip"});
    			});
    			$(this).mouseleave(function (ev) {
    				$("#wowtoon-popup").css('display','none');
    			});
    		  }
    	  }
      });
    };
    
    Drupal.Wowtoon.tabardImagesLoaded = 0;
    Drupal.Wowtoon.tabardImages = {};
    
    Drupal.Wowtoon.tabardLoadImage = function(idx, src) {
    	Drupal.Wowtoon.tabardImages[idx] = new Image();
    	Drupal.Wowtoon.tabardImages[idx].onload = function() {
    		Drupal.Wowtoon.tabardImageLoaded();
    	};
    	Drupal.Wowtoon.tabardImages[idx].src = src;
    };
    Drupal.Wowtoon.tabardImageLoaded = function() {
    	Drupal.Wowtoon.tabardImagesLoaded++;
    	if (Drupal.Wowtoon.tabardImagesLoaded == 7) {
        	
    		var tempImage = new Image();
    		
    		Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['ring'], 0, 0);
    		Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['shadow'], 0, 0);
    		Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['bg'], 0, 0);
    		Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['border'], 0, 0);
        	Drupal.Wowtoon.tabardColorize();
        	//Drupal.Wowtoon.tabardImages['emblem'] = Drupal.Wowtoon.tabardColorize(Drupal.Wowtoon.tabardImages['emblem']);
        	Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['emblem'], 0, 0);
        	Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['overlay'], 0, 0);
        	Drupal.Wowtoon.tabardCanvas.drawImage(Drupal.Wowtoon.tabardImages['hooks'], 0, 0);

    	}
    	*/
    };
    /*
    Drupal.Wowtoon.tabardColorize = function() {
    	var _width = 240;
    	var _height = 240;
		var imageData = Drupal.Wowtoon.tabardCanvas.getImageData(0, 0, _width, _height);
		var pixelData = imageData.data;
		
		var scale_r = 1;
		var added_r = 0;
		var scale_g = 0.7;
		var added_g = 0;
		var scale_b = 0.7;
		var added_b = 0;
		
		var i = pixelData.length;
		do {
			if (pixelData[i + 3] !== 0) {
				pixelData[i] = pixelData[i] * scale_r + added_r;
				pixelData[i + 1] = pixelData[i + 1] * scale_g + added_g;
				pixelData[i + 2] = pixelData[i + 2] * scale_b + added_b;
			}
		} while (i -= 4);
		Drupal.Wowtoon.tabardCanvas.putImageData(imageData, 0, 0);
    }
    
    Drupal.Wowtoon.createTabard = function() {
    	
        Drupal.Wowtoon.tabard = document.getElementById("guild-tabard");
        Drupal.Wowtoon.tabardCanvas = Drupal.Wowtoon.tabard.getContext("2d");
    	
    	Drupal.Wowtoon.tabardLoadImage('ring', '/sites/d7.com/files/tabardcache/us/ring-alliance.png');
    	Drupal.Wowtoon.tabardLoadImage('shadow', '/sites/d7.com/files/tabardcache/us/shadow_00.png');
    	Drupal.Wowtoon.tabardLoadImage('emblem', '/sites/d7.com/files/tabardcache/us/emblem_38.png');
    	Drupal.Wowtoon.tabardLoadImage('border', '/sites/d7.com/files/tabardcache/us/border_03.png');
    	Drupal.Wowtoon.tabardLoadImage('bg', '/sites/d7.com/files/tabardcache/us/bg_00.png');
    	Drupal.Wowtoon.tabardLoadImage('hooks', '/sites/d7.com/files/tabardcache/us/hooks.png');
    	Drupal.Wowtoon.tabardLoadImage('overlay', '/sites/d7.com/files/tabardcache/us/overlay_00.png');
    };
*/

  $(Drupal.Wowtoon.autoAttach);
  //$(Drupal.Wowtoon.createTabard);
})(jQuery);;
(function($) {

Drupal.admin = Drupal.admin || {};
Drupal.admin.behaviors = Drupal.admin.behaviors || {};
Drupal.admin.hashes = Drupal.admin.hashes || {};

/**
 * Core behavior for Administration menu.
 *
 * Test whether there is an administration menu is in the output and execute all
 * registered behaviors.
 */
Drupal.behaviors.adminMenu = {
  attach: function (context, settings) {
    // Initialize settings.
    settings.admin_menu = $.extend({
      suppress: false,
      margin_top: false,
      position_fixed: false,
      tweak_modules: false,
      tweak_permissions: false,
      tweak_tabs: false,
      destination: '',
      basePath: settings.basePath,
      hash: 0,
      replacements: {}
    }, settings.admin_menu || {});
    // Check whether administration menu should be suppressed.
    if (settings.admin_menu.suppress) {
      return;
    }
    var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
    // Client-side caching; if administration menu is not in the output, it is
    // fetched from the server and cached in the browser.
    if (!$adminMenu.length && settings.admin_menu.hash) {
      Drupal.admin.getCache(settings.admin_menu.hash, function (response) {
          if (typeof response == 'string' && response.length > 0) {
            $('body', context).append(response);
          }
          var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
          // Apply our behaviors.
          Drupal.admin.attachBehaviors(context, settings, $adminMenu);
          // Allow resize event handlers to recalculate sizes/positions.
          $(window).triggerHandler('resize');
      });
    }
    // If the menu is in the output already, this means there is a new version.
    else {
      // Apply our behaviors.
      Drupal.admin.attachBehaviors(context, settings, $adminMenu);
    }
  }
};

/**
 * Collapse fieldsets on Modules page.
 */
Drupal.behaviors.adminMenuCollapseModules = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_modules) {
      $('#system-modules fieldset:not(.collapsed)', context).addClass('collapsed');
    }
  }
};

/**
 * Collapse modules on Permissions page.
 */
Drupal.behaviors.adminMenuCollapsePermissions = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_permissions) {
      // Freeze width of first column to prevent jumping.
      $('#permissions th:first', context).css({ width: $('#permissions th:first', context).width() });
      // Attach click handler.
      $modules = $('#permissions tr:has(td.module)', context).once('admin-menu-tweak-permissions', function () {
        var $module = $(this);
        $module.bind('click.admin-menu', function () {
          // @todo Replace with .nextUntil() in jQuery 1.4.
          $module.nextAll().each(function () {
            var $row = $(this);
            if ($row.is(':has(td.module)')) {
              return false;
            }
            $row.toggleClass('element-hidden');
          });
        });
      });
      // Collapse all but the targeted permission rows set.
      if (window.location.hash.length) {
        $modules = $modules.not(':has(' + window.location.hash + ')');
      }
      $modules.trigger('click.admin-menu');
    }
  }
};

/**
 * Apply margin to page.
 *
 * Note that directly applying marginTop does not work in IE. To prevent
 * flickering/jumping page content with client-side caching, this is a regular
 * Drupal behavior.
 */
Drupal.behaviors.adminMenuMarginTop = {
  attach: function (context, settings) {
    if (!settings.admin_menu.suppress && settings.admin_menu.margin_top) {
      $('body:not(.admin-menu)', context).addClass('admin-menu');
    }
  }
};

/**
 * Retrieve content from client-side cache.
 *
 * @param hash
 *   The md5 hash of the content to retrieve.
 * @param onSuccess
 *   A callback function invoked when the cache request was successful.
 */
Drupal.admin.getCache = function (hash, onSuccess) {
  if (Drupal.admin.hashes.hash !== undefined) {
    return Drupal.admin.hashes.hash;
  }
  $.ajax({
    cache: true,
    type: 'GET',
    dataType: 'text', // Prevent auto-evaluation of response.
    global: false, // Do not trigger global AJAX events.
    url: Drupal.settings.admin_menu.basePath.replace(/admin_menu/, 'js/admin_menu/cache/' + hash),
    success: onSuccess,
    complete: function (XMLHttpRequest, status) {
      Drupal.admin.hashes.hash = status;
    }
  });
};

/**
 * TableHeader callback to determine top viewport offset.
 *
 * @see toolbar.js
 */
Drupal.admin.height = function() {
  var $adminMenu = $('#admin-menu');
  var height = $adminMenu.outerHeight();
  // In IE, Shadow filter adds some extra height, so we need to remove it from
  // the returned height.
  if ($adminMenu.css('filter') && $adminMenu.css('filter').match(/DXImageTransform\.Microsoft\.Shadow/)) {
    height -= $adminMenu.get(0).filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

/**
 * @defgroup admin_behaviors Administration behaviors.
 * @{
 */

/**
 * Attach administrative behaviors.
 */
Drupal.admin.attachBehaviors = function (context, settings, $adminMenu) {
  if ($adminMenu.length) {
    $adminMenu.addClass('admin-menu-processed');
    $.each(Drupal.admin.behaviors, function() {
      this(context, settings, $adminMenu);
    });
  }
};

/**
 * Apply 'position: fixed'.
 */
Drupal.admin.behaviors.positionFixed = function (context, settings, $adminMenu) {
  if (settings.admin_menu.position_fixed) {
    $adminMenu.addClass('admin-menu-position-fixed');
    $adminMenu.css('position', 'fixed');
  }
};

/**
 * Move page tabs into administration menu.
 */
Drupal.admin.behaviors.pageTabs = function (context, settings, $adminMenu) {
  if (settings.admin_menu.tweak_tabs) {
    var $tabs = $(context).find('ul.tabs.primary');
    $adminMenu.find('#admin-menu-wrapper > ul').eq(1)
      .append($tabs.find('li').addClass('admin-menu-tab'));
    $(context).find('ul.tabs.secondary')
      .appendTo('#admin-menu-wrapper > ul > li.admin-menu-tab.active')
      .removeClass('secondary');
    $tabs.remove();
  }
};

/**
 * Perform dynamic replacements in cached menu.
 */
Drupal.admin.behaviors.replacements = function (context, settings, $adminMenu) {
  for (var item in settings.admin_menu.replacements) {
    $(item, $adminMenu).html(settings.admin_menu.replacements[item]);
  }
};

/**
 * Inject destination query strings for current page.
 */
Drupal.admin.behaviors.destination = function (context, settings, $adminMenu) {
  if (settings.admin_menu.destination) {
    $('a.admin-menu-destination', $adminMenu).each(function() {
      this.search += (!this.search.length ? '?' : '&') + Drupal.settings.admin_menu.destination;
    });
  }
};

/**
 * Apply JavaScript-based hovering behaviors.
 *
 * @todo This has to run last.  If another script registers additional behaviors
 *   it will not run last.
 */
Drupal.admin.behaviors.hover = function (context, settings, $adminMenu) {
  // Hover emulation for IE 6.
  if ($.browser.msie && parseInt(jQuery.browser.version) == 6) {
    $('li', $adminMenu).hover(
      function () {
        $(this).addClass('iehover');
      },
      function () {
        $(this).removeClass('iehover');
      }
    );
  }

  // Delayed mouseout.
  $('li.expandable', $adminMenu).hover(
    function () {
      // Stop the timer.
      clearTimeout(this.sfTimer);
      // Display child lists.
      $('> ul', this)
        .css({left: 'auto', display: 'block'})
        // Immediately hide nephew lists.
        .parent().siblings('li').children('ul').css({left: '-999em', display: 'none'});
    },
    function () {
      // Start the timer.
      var uls = $('> ul', this);
      this.sfTimer = setTimeout(function () {
        uls.css({left: '-999em', display: 'none'});
      }, 400);
    }
  );
};

/**
 * Apply the search bar functionality.
 */
Drupal.admin.behaviors.search = function (context, settings, $adminMenu) {
  // @todo Add a HTML ID.
  var $input = $('input.admin-menu-search', $adminMenu);
  // Initialize the current search needle.
  var needle = $input.val();
  // Cache of all links that can be matched in the menu.
  var links;
  // Minimum search needle length.
  var needleMinLength = 2;
  // Append the results container.
  var $results = $('<div />').insertAfter($input);

  /**
   * Executes the search upon user input.
   */
  function keyupHandler() {
    var matches, $html, value = $(this).val();
    // Only proceed if the search needle has changed.
    if (value !== needle) {
      needle = value;
      // Initialize the cache of menu links upon first search.
      if (!links && needle.length >= needleMinLength) {
        // @todo Limit to links in dropdown menus; i.e., skip menu additions.
        links = buildSearchIndex($adminMenu.find('li:not(.admin-menu-action, .admin-menu-action li) > a'));
      }
      // Empty results container when deleting search text.
      if (needle.length < needleMinLength) {
        $results.empty();
      }
      // Only search if the needle is long enough.
      if (needle.length >= needleMinLength && links) {
        matches = findMatches(needle, links);
        // Build the list in a detached DOM node.
        $html = buildResultsList(matches);
        // Display results.
        $results.empty().append($html);
      }
    }
  }

  /**
   * Builds the search index.
   */
  function buildSearchIndex($links) {
    return $links
      .map(function () {
        var text = (this.textContent || this.innerText);
        // Skip menu entries that do not contain any text (e.g., the icon).
        if (typeof text === 'undefined') {
          return;
        }
        return {
          text: text,
          textMatch: text.toLowerCase(),
          element: this
        };
      });
  }

  /**
   * Searches the index for a given needle and returns matching entries.
   */
  function findMatches(needle, links) {
    var needleMatch = needle.toLowerCase();
    // Select matching links from the cache.
    return $.grep(links, function (link) {
      return link.textMatch.indexOf(needleMatch) !== -1;
    });
  }

  /**
   * Builds the search result list in a detached DOM node.
   */
  function buildResultsList(matches) {
    var $html = $('<ul class="dropdown admin-menu-search-results" />');
    $.each(matches, function () {
      var result = this.text;
      var $element = $(this.element);

      // Check whether there is a top-level category that can be prepended.
      var $category = $element.closest('#admin-menu-wrapper > ul > li');
      var categoryText = $category.find('> a').text()
      if ($category.length && categoryText) {
        result = categoryText + ': ' + result;
      }

      var $result = $('<li><a href="' + $element.attr('href') + '">' + result + '</a></li>');
      $result.data('original-link', $(this.element).parent());
      $html.append($result);
    });
    return $html;
  }

  /**
   * Highlights selected result.
   */
  function resultsHandler(e) {
    var $this = $(this);
    var show = e.type === 'mouseenter' || e.type === 'focusin';
    $this.trigger(show ? 'showPath' : 'hidePath', [this]);
  }

  /**
   * Closes the search results and clears the search input.
   */
  function resultsClickHandler(e, link) {
    var $original = $(this).data('original-link');
    $original.trigger('mouseleave');
    $input.val('').trigger('keyup');
  }

  /**
   * Shows the link in the menu that corresponds to a search result.
   */
  function highlightPathHandler(e, link) {
    if (link) {
      var $original = $(link).data('original-link');
      var show = e.type === 'showPath';
      // Toggle an additional CSS class to visually highlight the matching link.
      // @todo Consider using same visual appearance as regular hover.
      $original.toggleClass('highlight', show);
      $original.trigger(show ? 'mouseenter' : 'mouseleave');
    }
  }

  // Attach showPath/hidePath handler to search result entries.
  $results.delegate('li', 'mouseenter mouseleave focus blur', resultsHandler);
  // Hide the result list after a link has been clicked, useful for overlay.
  $results.delegate('li', 'click', resultsClickHandler);
  // Attach hover/active highlight behavior to search result entries.
  $adminMenu.delegate('.admin-menu-search-results li', 'showPath hidePath', highlightPathHandler);
  // Attach the search input event handler.
  $input.bind('keyup search', keyupHandler);
};

/**
 * @} End of "defgroup admin_behaviors".
 */

})(jQuery);
;
(function($) {

Drupal.admin = Drupal.admin || {};
Drupal.admin.behaviors = Drupal.admin.behaviors || {};

/**
 * @ingroup admin_behaviors
 * @{
 */

/**
 * Apply active trail highlighting based on current path.
 *
 * @todo Not limited to toolbar; move into core?
 */
Drupal.admin.behaviors.toolbarActiveTrail = function (context, settings, $adminMenu) {
  if (settings.admin_menu.toolbar && settings.admin_menu.toolbar.activeTrail) {
    $adminMenu.find('> div > ul > li > a[href="' + settings.admin_menu.toolbar.activeTrail + '"]').addClass('active-trail');
  }
};

/**
 * Toggles the shortcuts bar.
 */
Drupal.admin.behaviors.shortcutToggle = function (context, settings, $adminMenu) {
  var $shortcuts = $adminMenu.find('.shortcut-toolbar');
  if (!$shortcuts.length) {
    return;
  }
  var storage = window.localStorage || false;
  var storageKey = 'Drupal.admin_menu.shortcut';
  var $body = $(context).find('body');
  var $toggle = $adminMenu.find('.shortcut-toggle');
  $toggle.click(function () {
    var enable = !$shortcuts.hasClass('active');
    $shortcuts.toggleClass('active', enable);
    $toggle.toggleClass('active', enable);
    if (settings.admin_menu.margin_top) {
      $body.toggleClass('admin-menu-with-shortcuts', enable);
    }
    // Persist toggle state across requests.
    storage && enable ? storage.setItem(storageKey, 1) : storage.removeItem(storageKey);
    this.blur();
    return false;
  });

  if (!storage || storage.getItem(storageKey)) {
    $toggle.trigger('click');
  }
};

/**
 * @} End of "ingroup admin_behaviors".
 */

})(jQuery);
;

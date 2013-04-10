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
})(jQuery);
(function ($) {

Drupal.shoutbox = {}
Drupal.behaviors.shoutbox = {
    attach: function(context, settings) {
	// Declare AJAX behavior for the form
	var options = {
	    resetForm: true,
	    beforeSubmit: Drupal.shoutbox.validate,
	    success: Drupal.shoutbox.success
	};
	
	// Detect the shout form
	var shoutForm = $('#shoutbox-add-form:not(.shoutbox-processed)');
	
	if (shoutForm.length) {
	    // Set a class to the form indicating that it's been processed
	    $(shoutForm).addClass('shoutbox-processed');
	    
	    // Add AJAX behavior to the form
	    $(shoutForm).ajaxForm(options);

	    // Tell the form that we have Javascript enabled
	    $(shoutForm).find('#edit-js').val(1);
	    
	    // Empty the shout textfield
	    $(shoutForm).find('#edit-message').val('');
	    
	    // Close errors if they're clicked
	    $('#shoutbox-error').click(function() {
		$(this).hide(); 
	    });

	    // Show the admin links on hover
	    Drupal.shoutbox.adminHover();
	    
	    // Initialize the timer for shout updates
	    Drupal.shoutbox.shoutTimer('start');
	}
    }
};


/**
 * Attach a hover event to the shoutbox admin links
 */
Drupal.shoutbox.adminHover = function() {
  // Remove binded events
  $('#shoutbox-body .shoutbox-msg').unbind();
  
  // Bind hover event on admin links
  $('#shoutbox-body .shoutbox-msg').hover(
    function() {
      $(this).find('.shoutbox-admin-links').show();
    },
    function() {
      $(this).find('.shoutbox-admin-links').hide();
    }
  );
}

/**
 * Fix the destination query on shout admin link URLs
 * 
 * This is required because on an AJAX reload of shouts, the
 * ?destination= query on shout admin links points to the JS
 * callback URL
 */
Drupal.shoutbox.adminFixDestination = function() {
  var href = '';
  $('.shoutbox-admin-links').find('a').each(function() {
    // Extract the current href
    href= $(this).attr('href');
    // Remove the query
    href = href.substr(0, href.indexOf('?'));
    // Add the new destination
    href = href + '?destination=' + Drupal.settings.shoutbox.currentPath;
    // Set the new href
    $(this).attr('href', href);
  });
}

/**
 * Callback for a successful shout submission
 */
Drupal.shoutbox.success = function(responseText) {
  // Load the latest shouts
  Drupal.shoutbox.loadShouts(true);
}

/**
 * Starts or stops a timer that triggers every delay seconds.
 */
Drupal.shoutbox.shoutTimer = function(op) {
  var delay = Drupal.settings.shoutbox.refreshDelay;
  if (delay > 0) {
    switch (op) {
      case 'start':
        Drupal.shoutbox.interval = setInterval("Drupal.shoutbox.loadShouts()", delay);
        break;
      
      case 'stop':
        clearInterval(Drupal.shoutbox.interval);
        break;
    }
	}	
}

/**
 * Reloads all shouts from the server.
 */
Drupal.shoutbox.loadShouts = function(restoreForm) {
  // Stop the timer
  Drupal.shoutbox.shoutTimer('stop');
  
	$.ajax({
    url: Drupal.settings.shoutbox.refreshPath,
    type: "GET",
    cache: "false",
    dataType: "json",
    data: {mode: Drupal.settings.shoutbox.mode},
    success: function (response) {
      // Update the shouts
      $("#shoutbox-body").html(response.data);
      
      // Rebind the hover for admin links
      Drupal.shoutbox.adminHover();
      
      // Fix the destination URL queries on admin links
      Drupal.shoutbox.adminFixDestination();
      
      // Resume the timer
      Drupal.shoutbox.shoutTimer('start');
      
      // Hide any errors
      $('#shoutbox-error').hide();
      
      // Invoke a hook for other modules to act on the added shout.
      $.each(Drupal.shoutbox.afterPost, function (func) {
        if ($.isFunction(this.execute)) {
          this.execute();
        }
      });
      
      // Restore the button
      if (restoreForm) {
        $('#shoutbox-add-form input#edit-submit').show();
        $('#shoutbox-throbber').hide();
      }
    },
    error: function() {
      $('#shoutbox-error').html(Drupal.t('Error updating shouts. Please refresh the page.'));
      $('#shoutbox-error').show();
    }
  });
}

/**
 * Validate input before submitting.
 * Don't accept default values or empty strings.
 */
Drupal.shoutbox.validate = function (formData, jqForm, options) {
  var errorMsg = '';
  var errorDiv = $('#shoutbox-error');
  var form = jqForm[0];

  // Check if a message is present
  if ((!form.message.value)) {
	  errorMsg = Drupal.t('Enter a message');
  }
  
  // If a maxlength is set, enforce it
  if ((Drupal.settings.shoutbox.maxLength > 0) && (form.message.value.length > Drupal.settings.shoutbox.maxLength)) {
	  errorMsg = Drupal.t('The shout you entered is too long');
  }    
  
  if (errorMsg) {
    // Show the message and stop heres
    errorDiv.html(errorMsg);
    errorDiv.show();
    return false;
  }
  else {
    // No errors registered, continue
    errorDiv.hide();
    errorDiv.html('');
  }
  
  // Clear the form input 
  $('#shoutbox-add-form').resetForm();
  $('#shoutbox-throbber').show();
  $('#shoutbox-add-form input#edit-submit').hide();
  return true;	
};

})(jQuery);
;
(function($){
Drupal.behaviors.contextReactionBlock = {attach: function(context) {
  $('form.context-editor:not(.context-block-processed)')
    .addClass('context-block-processed')
    .each(function() {
      var id = $(this).attr('id');
      Drupal.contextBlockEditor = Drupal.contextBlockEditor || {};
      $(this).bind('init.pageEditor', function(event) {
        Drupal.contextBlockEditor[id] = new DrupalContextBlockEditor($(this));
      });
      $(this).bind('start.pageEditor', function(event, context) {
        // Fallback to first context if param is empty.
        if (!context) {
          context = $(this).data('defaultContext');
        }
        Drupal.contextBlockEditor[id].editStart($(this), context);
      });
      $(this).bind('end.pageEditor', function(event) {
        Drupal.contextBlockEditor[id].editFinish();
      });
    });

  //
  // Admin Form =======================================================
  //
  // ContextBlockForm: Init.
  $('#context-blockform:not(.processed)').each(function() {
    $(this).addClass('processed');
    Drupal.contextBlockForm = new DrupalContextBlockForm($(this));
    Drupal.contextBlockForm.setState();
  });

  // ContextBlockForm: Attach block removal handlers.
  // Lives in behaviors as it may be required for attachment to new DOM elements.
  $('#context-blockform a.remove:not(.processed)').each(function() {
    $(this).addClass('processed');
    $(this).click(function() {
      $(this).parents('tr').eq(0).remove();
      Drupal.contextBlockForm.setState();
      return false;
    });
  });

  // Conceal Section title, subtitle and class
  $('div.context-block-browser', context).nextAll('.form-item').hide();
}};

/**
 * Context block form. Default form for editing context block reactions.
 */
DrupalContextBlockForm = function(blockForm) {
  this.state = {};

  this.setState = function() {
    $('table.context-blockform-region', blockForm).each(function() {
      var region = $(this).attr('id').split('context-blockform-region-')[1];
      var blocks = [];
      $('tr', $(this)).each(function() {
        var bid = $(this).attr('id');
        var weight = $(this).find('select,input').first().val();
        blocks.push({'bid' : bid, 'weight' : weight});
      });
      Drupal.contextBlockForm.state[region] = blocks;
    });

    // Serialize here and set form element value.
    $('form input.context-blockform-state').val(JSON.stringify(this.state));

    // Hide enabled blocks from selector that are used
    $('table.context-blockform-region tr').each(function() {
      var bid = $(this).attr('id');
      $('div.context-blockform-selector input[value='+bid+']').parents('div.form-item').eq(0).hide();
    });
    // Show blocks in selector that are unused
    $('div.context-blockform-selector input').each(function() {
      var bid = $(this).val();
      if ($('table.context-blockform-region tr#'+bid).size() === 0) {
        $(this).parents('div.form-item').eq(0).show();
      }
    });

  };

  // make sure we update the state right before submits, this takes care of an
  // apparent race condition between saving the state and the weights getting set
  // by tabledrag
  $('#ctools-export-ui-edit-item-form').submit(function() { Drupal.contextBlockForm.setState(); });

  // Tabledrag
  // Add additional handlers to update our blocks.
  $.each(Drupal.settings.tableDrag, function(base) {
    var table = $('#' + base + ':not(.processed)', blockForm);
    if (table && table.is('.context-blockform-region')) {
      table.addClass('processed');
      table.bind('mouseup', function(event) {
        Drupal.contextBlockForm.setState();
        return;
      });
    }
  });

  // Add blocks to a region
  $('td.blocks a', blockForm).each(function() {
    $(this).click(function() {
      var region = $(this).attr('href').split('#')[1];
      var base = "context-blockform-region-"+ region;
      var selected = $("div.context-blockform-selector input:checked");
      if (selected.size() > 0) {
        var weight_warn = false;
        var min_weight_option = -10;
        var max_weight_option = 10;
        var max_observed_weight = min_weight_option - 1;
        $('table#' + base + ' tr').each(function() {
          var weight_input_val = $(this).find('select,input').first().val();
          if (+weight_input_val > +max_observed_weight) {
            max_observed_weight = weight_input_val;
          }
        });

        selected.each(function() {
          // create new block markup
          var block = document.createElement('tr');
          var text = $(this).parents('div.form-item').eq(0).hide().children('label').text();
          var select = '<div class="form-item form-type-select"><select class="tabledrag-hide form-select">';
          var i;
          weight_warn = true;
          var selected_weight = max_weight_option;
          if (max_weight_option >= (1 + +max_observed_weight)) {
            selected_weight = ++max_observed_weight;
            weight_warn = false;
          }

          for (i = min_weight_option; i <= max_weight_option; ++i) {
            select += '<option';
            if (i == selected_weight) {
              select += ' selected=selected';
            }
            select += '>' + i + '</option>';
          }
          select += '</select></div>';
          $(block).attr('id', $(this).attr('value')).addClass('draggable');
          $(block).html("<td>"+ text + "</td><td>" + select + "</td><td><a href='' class='remove'>X</a></td>");

          // add block item to region
          //TODO : Fix it so long blocks don't get stuck when added to top regions and dragged towards bottom regions
          Drupal.tableDrag[base].makeDraggable(block);
          $('table#'+base).append(block);
          if ($.cookie('Drupal.tableDrag.showWeight') == 1) {
            $('table#'+base).find('.tabledrag-hide').css('display', '');
            $('table#'+base).find('.tabledrag-handle').css('display', 'none');
          }
          else {
            $('table#'+base).find('.tabledrag-hide').css('display', 'none');
            $('table#'+base).find('.tabledrag-handle').css('display', '');
          }
          Drupal.attachBehaviors($('table#'+base));

          Drupal.contextBlockForm.setState();
          $(this).removeAttr('checked');
        });
        if (weight_warn) {
          alert(Drupal.t('Desired block weight exceeds available weight options, please check weights for blocks before saving'));
        }
      }
      return false;
    });
  });
};

/**
 * Context block editor. AHAH editor for live block reaction editing.
 */
DrupalContextBlockEditor = function(editor) {
  this.editor = editor;
  this.state = {};
  this.blocks = {};
  this.regions = {};

  return this;
};

DrupalContextBlockEditor.prototype = {
  initBlocks : function(blocks) {
    var self = this;
    this.blocks = blocks;
    blocks.each(function() {
      if($(this).hasClass('context-block-empty')) {
        $(this).removeClass('context-block-hidden');
      }
      $(this).addClass('draggable');
      $(this).prepend($('<a class="context-block-handle"></a>'));
      $(this).prepend($('<a class="context-block-remove"></a>').click(function() {
        $(this).parent ('.block').eq(0).fadeOut('medium', function() {
          $(this).remove();
          self.updateBlocks();
        });
        return false;
      }));
    });
  },
  initRegions : function(regions) {
    this.regions = regions;
    var ref = this;

    $(regions).not('.context-ui-processed')
      .each(function(index, el) {
        $('.context-ui-add-link', el).click(function(e){
          ref.showBlockBrowser($(this).parent());
        }).addClass('context-ui-processed');
      });
    $('.context-block-browser').hide();
  },
  showBlockBrowser : function(region) {
    var toggled = false;
    //figure out the id of the context
    var activeId = $('.context-editing', this.editor).attr('id').replace('-trigger', ''),
    context = $('#' + activeId)[0];

    this.browser = $('.context-block-browser', context).addClass('active');

    //add the filter element to the block browser
    if (!this.browser.has('input.filter').size()) {
      var parent = $('.block-browser-sidebar .filter', this.browser);
      var list = $('.blocks', this.browser);
      new Drupal.Filter (list, false, '.context-block-addable', parent);
    }
    //show a dialog for the blocks list
    this.browser.show().dialog({
      modal : true,
      close : function() {
        $(this).dialog('destroy');
        //reshow all the categories
        $('.category', this).show();
        $(this).hide().appendTo(context).removeClass('active');
      },
      height: (.8 * $(window).height()),
      minHeight:400,
      minWidth:680,
      width:680
    });

    //handle showing / hiding block items when a different category is selected
    $('.context-block-browser-categories', this.browser).change(function(e) {
      //if no category is selected we want to show all the items
      if ($(this).val() == 0) {
        $('.category', self.browser).show();
      } else {
        $('.category', self.browser).hide();
        $('.category-' + $(this).val(), self.browser).show();
      }
    });

    //if we already have the function for a different context, rebind it so we don't get dupes
    if(this.addToRegion) {
      $('.context-block-addable', this.browser).unbind('click.addToRegion')
    }

    //protected function for adding a clicked block to a region
    var self = this;
    this.addToRegion = function(e){
      var ui = {
        'item' : $(this).clone(),
        'sender' : $(region)
      };
      $(this).parents('.context-block-browser.active').dialog('close');
      $(region).after(ui.item);
      self.addBlock(e, ui, this.editor, activeId.replace('context-editable-', ''));
    };

    $('.context-block-addable', this.browser).bind('click.addToRegion', this.addToRegion);
  },
  // Update UI to match the current block states.
  updateBlocks : function() {
    var browser = $('div.context-block-browser');

    // For all enabled blocks, mark corresponding addables as having been added.
    $('.block, .admin-block').each(function() {
      var bid = $(this).attr('id').split('block-')[1]; // Ugh.
    });
    // For all hidden addables with no corresponding blocks, mark as addable.
    $('.context-block-item', browser).each(function() {
      var bid = $(this).attr('id').split('context-block-addable-')[1];
    });

    // Mark empty regions.
    $(this.regions).each(function() {
      if ($('.block:has(a.context-block)', this).size() > 0) {
        $(this).removeClass('context-block-region-empty');
      }
      else {
        $(this).addClass('context-block-region-empty');
      }
    });
  },
  // Live update a region
  updateRegion : function(event, ui, region, op) {
    switch (op) {
      case 'over':
        $(region).removeClass('context-block-region-empty');
        break;
      case 'out':
        if (
          // jQuery UI 1.8
          $('.draggable-placeholder', region).size() === 1 &&
          $('.block:has(a.context-block)', region).size() == 0
        ) {
          $(region).addClass('context-block-region-empty');
        }
        break;
    }
  },
  // Remove script elements while dragging & dropping.
  scriptFix : function(event, ui, editor, context) {
    if ($('script', ui.item)) {
      var placeholder = $(Drupal.settings.contextBlockEditor.scriptPlaceholder);
      var label = $('div.handle label', ui.item).text();
      placeholder.children('strong').html(label);
      $('script', ui.item).parent().empty().append(placeholder);
    }
  },
  // Add a block to a region through an AJAX load of the block contents.
  addBlock : function(event, ui, editor, context) {
    var self = this;
    if (ui.item.is('.context-block-addable')) {
      var bid = ui.item.attr('id').split('context-block-addable-')[1];

      // Construct query params for our AJAX block request.
      var params = Drupal.settings.contextBlockEditor.params;
      params.context_block = bid + ',' + context;
      if (!Drupal.settings.contextBlockEditor.block_tokens || !Drupal.settings.contextBlockEditor.block_tokens[bid]) {
        alert(Drupal.t('An error occurred trying to retrieve block content. Please contact a site administer.'));
        return;
     }
     params.context_token = Drupal.settings.contextBlockEditor.block_tokens[bid];

      // Replace item with loading block.
      //ui.sender.append(ui.item);

      var blockLoading = $('<div class="context-block-item context-block-loading"><span class="icon"></span></div>');
      ui.item.addClass('context-block-added');
      ui.item.after(blockLoading);


      $.getJSON(Drupal.settings.contextBlockEditor.path, params, function(data) {
        if (data.status) {
          var newBlock = $(data.block);
          if ($('script', newBlock)) {
            $('script', newBlock).remove();
          }
          blockLoading.fadeOut(function() {
            $(this).replaceWith(newBlock);
            self.initBlocks(newBlock);
            self.updateBlocks();
            Drupal.attachBehaviors(newBlock);
          });
        }
        else {
          blockLoading.fadeOut(function() { $(this).remove(); });
        }
      });
    }
    else if (ui.item.is(':has(a.context-block)')) {
      self.updateBlocks();
    }
  },
  // Update form hidden field with JSON representation of current block visibility states.
  setState : function() {
    var self = this;

    $(this.regions).each(function() {
      var region = $('.context-block-region', this).attr('id').split('context-block-region-')[1];
      var blocks = [];
      $('a.context-block', $(this)).each(function() {
        if ($(this).attr('class').indexOf('edit-') != -1) {
          var bid = $(this).attr('id').split('context-block-')[1];
          var context = $(this).attr('class').split('edit-')[1].split(' ')[0];
          context = context ? context : 0;
          var block = {'bid': bid, 'context': context};
          blocks.push(block);
        }
      });
      self.state[region] = blocks;
    });
    // Serialize here and set form element value.
    $('input.context-block-editor-state', this.editor).val(JSON.stringify(this.state));
  },
  //Disable text selection.
  disableTextSelect : function() {
    if ($.browser.safari) {
      $('.block:has(a.context-block):not(:has(input,textarea))').css('WebkitUserSelect','none');
    }
    else if ($.browser.mozilla) {
      $('.block:has(a.context-block):not(:has(input,textarea))').css('MozUserSelect','none');
    }
    else if ($.browser.msie) {
      $('.block:has(a.context-block):not(:has(input,textarea))').bind('selectstart.contextBlockEditor', function() { return false; });
    }
    else {
      $(this).bind('mousedown.contextBlockEditor', function() { return false; });
    }
  },
  //Enable text selection.
  enableTextSelect : function() {
    if ($.browser.safari) {
      $('*').css('WebkitUserSelect','');
    }
    else if ($.browser.mozilla) {
      $('*').css('MozUserSelect','');
    }
    else if ($.browser.msie) {
      $('*').unbind('selectstart.contextBlockEditor');
    }
    else {
      $(this).unbind('mousedown.contextBlockEditor');
    }
  },
  // Start editing. Attach handlers, begin draggable/sortables.
  editStart : function(editor, context) {
    var self = this;
    // This is redundant to the start handler found in context_ui.js.
    // However it's necessary that we trigger this class addition before
    // we call .sortable() as the empty regions need to be visible.
    $(document.body).addClass('context-editing');
    this.editor.addClass('context-editing');
    this.disableTextSelect();
    this.initBlocks($('.block:has(a.context-block.edit-'+context+')'));
    this.initRegions($('.context-block-region').parent());
    this.updateBlocks();

    $('a.context_ui_dialog-stop').hide();

    $('.editing-context-label').remove();
    var label = $('#context-editable-trigger-'+context+' .label').text();
    label = Drupal.t('Now Editing: ') + label;
    editor.parent().parent()
      .prepend('<div class="editing-context-label">'+ label + '</div>');

    // First pass, enable sortables on all regions.
    $(this.regions).each(function() {
      var region = $(this);
      var params = {
        revert: true,
        dropOnEmpty: true,
        placeholder: 'draggable-placeholder',
        forcePlaceholderSize: true,
        items: '> .block:has(a.context-block.editable)',
        handle: 'a.context-block-handle',
        start: function(event, ui) { self.scriptFix(event, ui, editor, context); },
        stop: function(event, ui) { self.addBlock(event, ui, editor, context); },
        receive: function(event, ui) { self.addBlock(event, ui, editor, context); },
        over: function(event, ui) { self.updateRegion(event, ui, region, 'over'); },
        out: function(event, ui) { self.updateRegion(event, ui, region, 'out'); },
        cursorAt: {left: 300, top: 0}
      };
      region.sortable(params);
    });

    // Second pass, hook up all regions via connectWith to each other.
    $(this.regions).each(function() {
      $(this).sortable('option', 'connectWith', ['.ui-sortable']);
    });

    // Terrible, terrible workaround for parentoffset issue in Safari.
    // The proper fix for this issue has been committed to jQuery UI, but was
    // not included in the 1.6 release. Therefore, we do a browser agent hack
    // to ensure that Safari users are covered by the offset fix found here:
    // http://dev.jqueryui.com/changeset/2073.
    if ($.ui.version === '1.6' && $.browser.safari) {
      $.browser.mozilla = true;
    }
  },
  // Finish editing. Remove handlers.
  editFinish : function() {
    this.editor.removeClass('context-editing');
    this.enableTextSelect();

    $('.editing-context-label').remove();

    // Remove UI elements.
    $(this.blocks).each(function() {
      $('a.context-block-handle, a.context-block-remove', this).remove();
      if($(this).hasClass('context-block-empty')) {
        $(this).addClass('context-block-hidden');
      }
      $(this).removeClass('draggable');
    });

    $('a.context_ui_dialog-stop').show();

    this.regions.sortable('destroy');

    this.setState();

    // Unhack the user agent.
    if ($.ui.version === '1.6' && $.browser.safari) {
      $.browser.mozilla = false;
    }
  }
}; //End of DrupalContextBlockEditor prototype

})(jQuery);
;
(function ($) {

// Behavior to load FlexSlider
Drupal.behaviors.flexslider = {
  attach: function(context, settings) {
    $('.flexslider', context).once('flexslider', function() {
      $(this).each(function() {
        var $this = $(this);
        var id = $this.attr('id');
        if (settings.flexslider !== undefined) {
          var optionset = settings.flexslider.instances[id];
          if (optionset) {
            $this.flexslider(settings.flexslider.optionsets[optionset]);
          }
          else {
            $this.flexslider();
          }
        }
      });
      // Remove width/height attributes
      $(this).find('ul.slides li img').removeAttr('height');
      $(this).find('ul.slides li img').removeAttr('width');  
    });
  }
};

}(jQuery));
;
(function ($) {
  // @todo convert to use Drupal.behaviors
  // @todo add configuration options

  // Register callback to save references to flexslider instances. Allows
  // Views Slideshow controls to affect the slider
  function flexslider_views_slideshow_register(fullId, slider) {
    Drupal.flexsliderViewsSlideshow.active = Drupal.flexsliderViewsSlideshow.active || {};
    Drupal.flexsliderViewsSlideshow.active[fullId] = slider;
  }

  Drupal.behaviors.flexsliderViewsSlideshow = {
    attach: function (context) {
      $('.flexslider_views_slideshow_main:not(.flexslider_views_slideshow-processed)', context).addClass('flexslider_views_slideshow-processed').each(function() {
        // Get the ID of the slideshow
        var fullId = '#' + $(this).attr('id');

        // Create settings container
        var settings = Drupal.settings.flexslider_views_slideshow[fullId];

        //console.log(settings);

        // @todo map the settings from the form to their javascript equivalents
        settings.targetId = fullId;
        
        settings.loaded = false;

        // Assign default settings
        settings.opts = {
          animation:settings.animation,
          slideDirection:settings.slideDirection,
          slideshow:settings.slideshow,
          slideshowSpeed:settings.slideshowSpeed,
          animationDuration:settings.animationDuration,
          directionNav:settings.directionNav,
          controlNav:settings.controlNav,
          keyboardNav:settings.keyboardNav,
          mousewheel:settings.mousewheel,
          prevText:settings.prevText,
          nextText:settings.nextText,
          pausePlay:settings.pausePlay,
          pauseText:settings.pauseText,
          playText:settings.playText,
          randomize:settings.randomize,
          slideToStart:settings.slideToStart,
          animationLoop:settings.animationLoop,
          pauseOnAction:settings.pauseOnAction,
          pauseOnHover:settings.pauseOnHover,
          controlsContainer:settings.controlsContainer,
          manualControls:settings.manualControls,
          start: function(slider) {
            flexslider_views_slideshow_register(fullId, slider);
          }
        };

        Drupal.flexsliderViewsSlideshow.load(fullId);
      });
    }
  };


  // Initialize the flexslider object
  Drupal.flexsliderViewsSlideshow = Drupal.flexsliderViewsSlideshow || {};

  // Load mapping from Views Slideshow to FlexSlider
  Drupal.flexsliderViewsSlideshow.load = function(fullId) {
    var settings = Drupal.settings.flexslider_views_slideshow[fullId];

    // Ensure the slider isn't already loaded
    if (!settings.loaded) {
      $(settings.targetId + " .flexslider").flexslider(settings.opts);
      settings.loaded = true;
    }
  }

  // Pause mapping from Views Slideshow to FlexSlider
  Drupal.flexsliderViewsSlideshow.pause = function (options) {
    Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].pause();
    Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].manualPause = true;
  }

  // Play mapping from Views Slideshow to FlexSlider
  Drupal.flexsliderViewsSlideshow.play = function (options) {
    Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].resume();
    Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].manualPause = false;
  }
  
  Drupal.flexsliderViewsSlideshow.nextSlide = function (options) {
    var target = Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].getTarget('next');

    if (Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].canAdvance(target)) {
      Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].flexAnimate(target, Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].vars.pauseOnAction);
    }
  }
  Drupal.flexsliderViewsSlideshow.previousSlide = function (options) {
    var target = Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].getTarget('prev');

    if (Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].canAdvance(target)) {
      Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].flexAnimate(target, Drupal.flexsliderViewsSlideshow.active['#flexslider_views_slideshow_main_' + options.slideshowID].vars.pauseOnAction);
    }
  }
  // @todo add support for jquery mobile page init
})(jQuery);;
(function ($) {

/**
 * Attach the machine-readable name form element behavior.
 */
Drupal.behaviors.machineName = {
  /**
   * Attaches the behavior.
   *
   * @param settings.machineName
   *   A list of elements to process, keyed by the HTML ID of the form element
   *   containing the human-readable value. Each element is an object defining
   *   the following properties:
   *   - target: The HTML ID of the machine name form element.
   *   - suffix: The HTML ID of a container to show the machine name preview in
   *     (usually a field suffix after the human-readable name form element).
   *   - label: The label to show for the machine name preview.
   *   - replace_pattern: A regular expression (without modifiers) matching
   *     disallowed characters in the machine name; e.g., '[^a-z0-9]+'.
   *   - replace: A character to replace disallowed characters with; e.g., '_'
   *     or '-'.
   *   - standalone: Whether the preview should stay in its own element rather
   *     than the suffix of the source element.
   *   - field_prefix: The #field_prefix of the form element.
   *   - field_suffix: The #field_suffix of the form element.
   */
  attach: function (context, settings) {
    var self = this;
    $.each(settings.machineName, function (source_id, options) {
      var $source = $(source_id, context).addClass('machine-name-source');
      var $target = $(options.target, context).addClass('machine-name-target');
      var $suffix = $(options.suffix, context);
      var $wrapper = $target.closest('.form-item');
      // All elements have to exist.
      if (!$source.length || !$target.length || !$suffix.length || !$wrapper.length) {
        return;
      }
      // Skip processing upon a form validation error on the machine name.
      if ($target.hasClass('error')) {
        return;
      }
      // Figure out the maximum length for the machine name.
      options.maxlength = $target.attr('maxlength');
      // Hide the form item container of the machine name form element.
      $wrapper.hide();
      // Determine the initial machine name value. Unless the machine name form
      // element is disabled or not empty, the initial default value is based on
      // the human-readable form element value.
      if ($target.is(':disabled') || $target.val() != '') {
        var machine = $target.val();
      }
      else {
        var machine = self.transliterate($source.val(), options);
      }
      // Append the machine name preview to the source field.
      var $preview = $('<span class="machine-name-value">' + options.field_prefix + Drupal.checkPlain(machine) + options.field_suffix + '</span>');
      $suffix.empty();
      if (options.label) {
        $suffix.append(' ').append('<span class="machine-name-label">' + options.label + ':</span>');
      }
      $suffix.append(' ').append($preview);

      // If the machine name cannot be edited, stop further processing.
      if ($target.is(':disabled')) {
        return;
      }

      // If it is editable, append an edit link.
      var $link = $('<span class="admin-link"><a href="#">' + Drupal.t('Edit') + '</a></span>')
        .click(function () {
          $wrapper.show();
          $target.focus();
          $suffix.hide();
          $source.unbind('.machineName');
          return false;
        });
      $suffix.append(' ').append($link);

      // Preview the machine name in realtime when the human-readable name
      // changes, but only if there is no machine name yet; i.e., only upon
      // initial creation, not when editing.
      if ($target.val() == '') {
        $source.bind('keyup.machineName change.machineName', function () {
          machine = self.transliterate($(this).val(), options);
          // Set the machine name to the transliterated value.
          if (machine != '') {
            if (machine != options.replace) {
              $target.val(machine);
              $preview.html(options.field_prefix + Drupal.checkPlain(machine) + options.field_suffix);
            }
            $suffix.show();
          }
          else {
            $suffix.hide();
            $target.val(machine);
            $preview.empty();
          }
        });
        // Initialize machine name preview.
        $source.keyup();
      }
    });
  },

  /**
   * Transliterate a human-readable name to a machine name.
   *
   * @param source
   *   A string to transliterate.
   * @param settings
   *   The machine name settings for the corresponding field, containing:
   *   - replace_pattern: A regular expression (without modifiers) matching
   *     disallowed characters in the machine name; e.g., '[^a-z0-9]+'.
   *   - replace: A character to replace disallowed characters with; e.g., '_'
   *     or '-'.
   *   - maxlength: The maximum length of the machine name.
   *
   * @return
   *   The transliterated source string.
   */
  transliterate: function (source, settings) {
    var rx = new RegExp(settings.replace_pattern, 'g');
    return source.toLowerCase().replace(rx, settings.replace).substr(0, settings.maxlength);
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;

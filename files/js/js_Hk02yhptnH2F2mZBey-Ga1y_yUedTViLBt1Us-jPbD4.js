
/**
 * @files js for collapsible tree view with some helper functions for updating tree structure
 */

(function ($) {

Drupal.behaviors.TaxonomyManagerTree = {
  attach: function(context, settings) {
    var treeSettings = settings.taxonomytree || [];
    if (treeSettings instanceof Array) {
      for (var i=0; i<treeSettings.length; i++) {
        if (!$('#'+ treeSettings[i].id +'.tm-processed').length) {
          new Drupal.TaxonomyManagerTree(treeSettings[i].id, treeSettings[i].vid, treeSettings[i].parents);
        }
      }
    }
    //only add throbber for TM sites
    var throbberSettings = settings.TMAjaxThrobber || [];
    if (throbberSettings['add']) {
      if (!$('#taxonomy-manager-toolbar-throbber.tm-processed').length) {
        $('#taxonomy-manager-toolbar-throbber').addClass('tm-processed');
        Drupal.attachThrobber();
        Drupal.attachResizeableTreeDiv();
        Drupal.attachGlobalSelectAll();
      }
    }
    Drupal.attachMsgCloseLink(context);

  }
}


Drupal.TaxonomyManagerTree = function(id, vid, parents) {
  this.div = $("#"+ id);
  this.ul = $(this.div).children();

  this.form = $(this.div).parents('form');
  this.form_build_id = $(this.form).children().children(':input[name="form_build_id"]').val();
  this.form_id = $(this.form).children().children(' :input[name="form_id"]').val();
  this.form_token = $(this.form).children().children(' :input[name="form_token"]').val();
  this.language = this.getLanguage();
  this.treeId = id;
  this.vocId = vid;
  this.formParents = parents;
  this.childFormUrl = Drupal.settings.childForm['url'];
  this.siblingsFormUrl = Drupal.settings.siblingsForm['url'];

  this.attachTreeview(this.ul);
  this.attachSiblingsForm(this.ul);
  this.attachSelectAllChildren(this.ul);
  this.attachLanguageSelector();

  //attach term data js, if enabled
  var term_data_settings = Drupal.settings.termData || [];
  if (term_data_settings['url']) {
    Drupal.attachTermData(this.ul);
  }
  $(this.div).addClass("tm-processed");
}

/**
 * adds collapsible treeview to a given list
 */
Drupal.TaxonomyManagerTree.prototype.attachTreeview = function(ul, currentIndex) {
  var tree = this;
  if (currentIndex) {
    ul = $(ul).slice(currentIndex);
  }
  var expandableParent = $(ul).find("div.hitArea");
  $(expandableParent).click(function() {
    var li = $(this).parent();
    tree.loadChildForm(li);
    tree.toggleTree(li);
  });
  $(expandableParent).parent("li.expandable, li.lastExpandable").children("ul").hide();
}

/**
 * toggles a collapsible/expandable tree element by swaping classes
 */
Drupal.TaxonomyManagerTree.prototype.toggleTree = function(node) {
  $(node).children("ul").toggle();
  this.swapClasses(node, "expandable", "collapsable");
  this.swapClasses(node, "lastExpandable", "lastCollapsable");
}

/**
 * helper function for swapping two classes
 */
Drupal.TaxonomyManagerTree.prototype.swapClasses = function(node, c1, c2) {
  if ($(node).hasClass(c1)) {
    $(node).removeClass(c1).addClass(c2);
  }
  else if ($(node).hasClass(c2)) {
    $(node).removeClass(c2).addClass(c1);
  }
}


/**
 * loads child terms and appends html to list
 * adds treeview, weighting etc. js to inserted child list
 */
Drupal.TaxonomyManagerTree.prototype.loadChildForm = function(li, update, callback) {
  var tree = this;
  if ($(li).is(".has-children") || update == true) {
    $(li).removeClass("has-children");
    if (update) {
      $(li).children("ul").remove();
    }
    var parentId = Drupal.getTermId(li);
    var url = tree.childFormUrl +'/'+ this.treeId +'/'+ this.vocId +'/'+ parentId;
    var param = new Object();
    param['form_build_id'] = this.form_build_id;
    param['form_id'] = this.form_id;
    param['tree_id'] = this.treeId;
    param['form_parents'] = this.formParents;
    param['language'] = this.language;

    $.ajax({
      data: param,
      type: "GET",
      url: url,
      dataType: 'json',
      success: function(response, status) {
         $(li).append(response.data);
        var ul = $(li).children("ul");
        tree.attachTreeview(ul);
        tree.attachSiblingsForm(ul);
        tree.attachSelectAllChildren(ul);

        //only attach other features if enabled!
        var weight_settings = Drupal.settings.updateWeight || [];
        if (weight_settings['up']) {
          Drupal.attachUpdateWeightTerms(li);
        }
        var term_data_settings = Drupal.settings.termData || [];
        if (term_data_settings['url']) {
          Drupal.attachTermDataLinks(ul);
        }
        if (typeof(callback) == "function") {
          callback(li, tree);
        }
      }
    });
  }
}

/**
 * function for reloading root tree elements
 */
Drupal.TaxonomyManagerTree.prototype.loadRootForm = function(tids) {
  var tree = this;
  var url = this.childFormUrl +'/'+ this.treeId +'/'+ this.vocId +'/0/';

  var param = new Object();
  param['form_build_id'] = this.form_build_id;
  param['form_id'] = this.form_id;
  param['tree_id'] = this.treeId;
  param['form_parents'] = this.formParents;
  param['language'] = this.language;
  param['terms_to_expand'] = tids; // can either be a single term id or concatinated ids

   $.ajax({
      data: param,
      type: "GET",
      url: url,
      dataType: 'json',
      success: function(response, status) {
        $('#'+ tree.treeId).html(response.data);
        var ul = $('#'+ tree.treeId).children("ul");
        tree.attachTreeview(ul);
        tree.attachSiblingsForm(ul);
        tree.attachSelectAllChildren(ul);
        Drupal.attachUpdateWeightTerms(ul);
        Drupal.attachTermDataLinks(ul);

        var lang = $('#edit-'+ tree.treeId +'-language').val();
        if (lang != "" && lang != tree.langauge) {
          $(tree.div).parent().siblings("div.taxonomy-manager-tree-top").find("select.language-selector option[value="+ lang +"]").attr("selected", "selected");
        }
      }
  });
}


/**
 * adds link for loading next siblings terms, when click terms get loaded through ahah
 * adds all needed js like treeview, weightning, etc.. to new added terms
 */
Drupal.TaxonomyManagerTree.prototype.attachSiblingsForm = function(ul) {
  var tree = this;
  var url = this.siblingsFormUrl;

  var list = "li.has-more-siblings div.term-has-more-siblings";
  if (ul) {
    list = $(ul).find(list);
  }

  $(list).bind('click', function() {
    $(this).unbind("click");
    var li = this.parentNode;
    var all = $('li', li.parentNode);
    var currentIndex = all.index(li);

    var page = Drupal.getPage(li);
    var prev_id = Drupal.getTermId(li);
    var parentId = Drupal.getParentId(li);

    url += '/'+ tree.treeId +'/'+ page +'/'+ prev_id +'/'+ parentId;

    var param = new Object();
    param['form_build_id'] = tree.form_build_id;
    param['form_id'] = tree.form_id;
    param['tree_id'] = tree.treeId;
    param['form_parents'] = tree.formParents;
    param['language'] = tree.language;

    $.ajax({
      data: param,
      type: "GET",
      url: url,
      dataType: 'json',
      success: function(response, status) {
        $(list).remove();
        $(li).after(response.data);
        tree.attachTreeview($('li', li.parentNode), currentIndex);
        tree.attachSelectAllChildren($('li', li.parentNode), currentIndex);

        //only attach other features if enabled!
        var weight_settings = Drupal.settings.updateWeight || [];
        if (weight_settings['up']) {
          Drupal.attachUpdateWeightTerms($('li', li.parentNode), currentIndex);
        }
        var term_data_settings = Drupal.settings.termData || [];
        if (term_data_settings['url']) {
          Drupal.attachTermDataToSiblings($('li', li.parentNode), currentIndex);
        }

        $(li).removeClass("last").removeClass("has-more-siblings");
        $(li).children().children('.term-operations').hide();
        tree.swapClasses(li, "lastExpandable", "expandable");
        tree.attachSiblingsForm($(li).parent());
      }
    });
  });
}


/**
 * helper function for getting out the current page
 */
Drupal.getPage = function(li) {
  return $(li).find("input:hidden[class=page]").attr("value");
}


/**
 * returns terms id of a given list element
 */
Drupal.getTermId = function(li) {
  return $(li).children().children("input:hidden[class=term-id]").attr("value");
}

/**
 * return term id of a prent of a given list element
 * if no parent exists (root level), returns 0
 */
Drupal.getParentId = function(li) {
  var parentId;
  try {
    var parentLi = $(li).parent("ul").parent("li");
    parentId = Drupal.getTermId(parentLi);
  } catch(e) {
    return 0;
  }
  return parentId;
}

/**
 * update classes for tree view, if list elements get swaped
 */
Drupal.updateTree = function(upTerm, downTerm) {
  if ($(upTerm).is(".last")) {
    $(upTerm).removeClass("last");
    Drupal.updateTreeDownTerm(downTerm);
  }
  else if ($(upTerm).is(".lastExpandable")) {
    $(upTerm).removeClass("lastExpandable").addClass("expandable");
    Drupal.updateTreeDownTerm(downTerm);
  }
  else if ($(upTerm).is(".lastCollapsable")) {
    $(upTerm).removeClass("lastCollapsable").addClass("collapsable");
    Drupal.updateTreeDownTerm(downTerm);
  }
}

/**
 * update classes for tree view for a list element moved downwards
 */
Drupal.updateTreeDownTerm = function(downTerm) {
  if ($(downTerm).is(".expandable")) {
    $(downTerm).removeClass("expandable").addClass("lastExpandable");
  }
  else if ($(downTerm).is(".collapsable")) {
    $(downTerm).removeClass("collapsable").addClass("lastCollapsable");
  }
  else {
    $(downTerm).addClass("last");
  }
}

/**
 * Adds button next to parent term to select all available child checkboxes
 */
Drupal.TaxonomyManagerTree.prototype.attachSelectAllChildren = function(parent, currentIndex) {
  var tree = this;
  if (currentIndex) {
    parent = $(parent).slice(currentIndex);
  }
  $(parent).find('span.select-all-children').click(function() {
    tree.SelectAllChildrenToggle(this);
  });
}

/**
 * (un-)selects nested checkboxes
 */
Drupal.TaxonomyManagerTree.prototype.SelectAllChildrenToggle = function(span) {
  var tree = this;
  if ($(span).hasClass("select-all-children")) {
    var li = $(this).parents("li:first");
    if ($(li).hasClass("has-children")) {
      this.loadChildForm(li, true, function(li, tree1) {
        tree.swapClasses(li, "expandable", "collapsable");
        tree.swapClasses(li, "lastExpandable", "lastCollapsable");
        var this_span = $(li).find('span.select-all-children:first');
        tree.SelectAllChildrenToggle(this_span);
        return;
      });
    }
    else {
      $(span).removeClass("select-all-children").addClass("unselect-all-children");
      $(span).attr("title", Drupal.t("Unselect all children"));
      $(span).parents("li:first").find('ul:first').each(function() {
        var first_element = $(this).find('.term-line:first');
        $(first_element).parent().siblings("li").find('div.term-line:first :checkbox').attr('checked', true);
        $(first_element).find(' :checkbox').attr('checked', true);
      });
    }
  }
  else {
    $(span).removeClass("unselect-all-children").addClass("select-all-children");
    $(span).parents(".term-line").siblings("ul").find(':checkbox').attr("checked", false);
    $(span).attr("title", Drupal.t("Select all children"));
  }
}

/**
 * language selector
 */
Drupal.TaxonomyManagerTree.prototype.attachLanguageSelector = function() {
  var tree = this;
  var selector = $(tree.div).parent().siblings("div.taxonomy-manager-tree-top").find("select.language-selector");
  $(selector).not(".selector-processed").change(function() {
    tree.language = $(this).val();
    tree.loadRootForm();
  });
  $(selector).addClass("selector-processed");

}
Drupal.TaxonomyManagerTree.prototype.getLanguage = function() {
  var lang = $('#edit-taxonomy-manager-top-language').val();
  if (typeof(lang) == "undefined") {
    return "";
  }
  return lang;
}

/**
 * return array of selected terms
 */
Drupal.TaxonomyManagerTree.prototype.getSelectedTerms = function() {
  var terms = new Array();
  $(this.div).find("input[type=checkbox][checked]").each(function() {
    var term = $(this).parents("li").eq(0);
    terms.push(term);
  });
  return terms;
}

/**
 * returns li node for a given term id, if it exists in the tree
 */
Drupal.TaxonomyManagerTree.prototype.getLi = function(termId) {
  return $(this.div).find("input:hidden[class=term-id][value="+ termId +"]").parent().parent();
}

Drupal.attachMsgCloseLink = function(context) {
  $(context).find('div.messages').once(function() {
    $('<span class="taxonomy-manager-message-close"><a href="" title="'+ Drupal.t('Close') +'">x</a></span>').appendTo(this).click(function() {
      $(this).parent().fadeOut('fast', function() {
        $(this).remove();
      });
      return false;
    });
    // Remove the message after 10sec.
    $(this).parent().delay(10000).fadeOut('slow', function() {
      $(this).remove();
    });
  });
}

/**
 * attaches a throbber element to the taxonomy manager
 */
Drupal.attachThrobber = function() {
  var div = $('#taxonomy-manager');
  var throbber = $('<img src="'+ Drupal.settings.taxonomy_manager['modulePath'] +'images/ajax-loader.gif" alt="" height="25">');
  throbber.appendTo("#taxonomy-manager-toolbar-throbber").hide();

  throbber.ajaxStart(function() {
    $(this).show();
  });
  throbber.ajaxStop(function() {
    $(this).hide();
  });
  throbber.ajaxError(function() {
    alert("An AJAX error occurred. Reload the page and check your logs.");
    $(this).hide();
  });
}

/**
* makes the div resizeable
*/
Drupal.attachResizeableTreeDiv = function() {
  $('img.div-grippie').each(function() {
    var staticOffset = null;
    var div = $(this).parents("fieldset").parent();
    $(this).mousedown(startDrag);

    function startDrag(e) {
      staticOffset = div.width() - e.pageX;
      div.css('opacity', 0.5);
      $(document).mousemove(performDrag).mouseup(endDrag);
      return false;
    }

    function performDrag(e) {
      div.width(Math.max(200, staticOffset + e.pageX) + 'px');
      return false;
    }

    function endDrag(e) {
      $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
      div.css('opacity', 1);
    }
  });
}

/**
 * Adds select all / remove selection functionality.
 */
Drupal.attachGlobalSelectAll = function() {
  $('span.taxonomy-manager-select-helpers').once(function() {
    var form = $(this).parents('.form-wrapper:first');
    $(this).find('span.select-all-children').click(function() {
      // Only select those that are visible to the end user.
      $(form).parent().find(' :checkbox:visible').attr('checked', true);
    });
    $(this).find('span.unselect-all-children').click(function() {
      $(form).parent().find(':checkbox').attr("checked", false);
    });
  });
}


})(jQuery);

;
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
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
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
(function ($) {

/**
 * Attaches the autocomplete behavior to all required fields.
 */
Drupal.behaviors.autocomplete = {
  attach: function (context, settings) {
    var acdb = [];
    $('input.autocomplete', context).once('autocomplete', function () {
      var uri = this.value;
      if (!acdb[uri]) {
        acdb[uri] = new Drupal.ACDB(uri);
      }
      var $input = $('#' + this.id.substr(0, this.id.length - 13))
        .attr('autocomplete', 'OFF')
        .attr('aria-autocomplete', 'list');
      $($input[0].form).submit(Drupal.autocompleteSubmit);
      $input.parent()
        .attr('role', 'application')
        .append($('<span class="element-invisible" aria-live="assertive"></span>')
          .attr('id', $input.attr('id') + '-autocomplete-aria-live')
        );
      new Drupal.jsAC($input, acdb[uri]);
    });
  }
};

/**
 * Prevents the form from submitting if the suggestions popup is open
 * and closes the suggestions popup when doing so.
 */
Drupal.autocompleteSubmit = function () {
  return $('#autocomplete').each(function () {
    this.owner.hidePopup();
  }).length == 0;
};

/**
 * An AutoComplete object.
 */
Drupal.jsAC = function ($input, db) {
  var ac = this;
  this.input = $input[0];
  this.ariaLive = $('#' + this.input.id + '-autocomplete-aria-live');
  this.db = db;

  $input
    .keydown(function (event) { return ac.onkeydown(this, event); })
    .keyup(function (event) { ac.onkeyup(this, event); })
    .blur(function () { ac.hidePopup(); ac.db.cancel(); });

};

/**
 * Handler for the "keydown" event.
 */
Drupal.jsAC.prototype.onkeydown = function (input, e) {
  if (!e) {
    e = window.event;
  }
  switch (e.keyCode) {
    case 40: // down arrow.
      this.selectDown();
      return false;
    case 38: // up arrow.
      this.selectUp();
      return false;
    default: // All other keys.
      return true;
  }
};

/**
 * Handler for the "keyup" event.
 */
Drupal.jsAC.prototype.onkeyup = function (input, e) {
  if (!e) {
    e = window.event;
  }
  switch (e.keyCode) {
    case 16: // Shift.
    case 17: // Ctrl.
    case 18: // Alt.
    case 20: // Caps lock.
    case 33: // Page up.
    case 34: // Page down.
    case 35: // End.
    case 36: // Home.
    case 37: // Left arrow.
    case 38: // Up arrow.
    case 39: // Right arrow.
    case 40: // Down arrow.
      return true;

    case 9:  // Tab.
    case 13: // Enter.
    case 27: // Esc.
      this.hidePopup(e.keyCode);
      return true;

    default: // All other keys.
      if (input.value.length > 0 && !input.readOnly) {
        this.populatePopup();
      }
      else {
        this.hidePopup(e.keyCode);
      }
      return true;
  }
};

/**
 * Puts the currently highlighted suggestion into the autocomplete field.
 */
Drupal.jsAC.prototype.select = function (node) {
  this.input.value = $(node).data('autocompleteValue');
};

/**
 * Highlights the next suggestion.
 */
Drupal.jsAC.prototype.selectDown = function () {
  if (this.selected && this.selected.nextSibling) {
    this.highlight(this.selected.nextSibling);
  }
  else if (this.popup) {
    var lis = $('li', this.popup);
    if (lis.length > 0) {
      this.highlight(lis.get(0));
    }
  }
};

/**
 * Highlights the previous suggestion.
 */
Drupal.jsAC.prototype.selectUp = function () {
  if (this.selected && this.selected.previousSibling) {
    this.highlight(this.selected.previousSibling);
  }
};

/**
 * Highlights a suggestion.
 */
Drupal.jsAC.prototype.highlight = function (node) {
  if (this.selected) {
    $(this.selected).removeClass('selected');
  }
  $(node).addClass('selected');
  this.selected = node;
  $(this.ariaLive).html($(this.selected).html());
};

/**
 * Unhighlights a suggestion.
 */
Drupal.jsAC.prototype.unhighlight = function (node) {
  $(node).removeClass('selected');
  this.selected = false;
  $(this.ariaLive).empty();
};

/**
 * Hides the autocomplete suggestions.
 */
Drupal.jsAC.prototype.hidePopup = function (keycode) {
  // Select item if the right key or mousebutton was pressed.
  if (this.selected && ((keycode && keycode != 46 && keycode != 8 && keycode != 27) || !keycode)) {
    this.input.value = $(this.selected).data('autocompleteValue');
  }
  // Hide popup.
  var popup = this.popup;
  if (popup) {
    this.popup = null;
    $(popup).fadeOut('fast', function () { $(popup).remove(); });
  }
  this.selected = false;
  $(this.ariaLive).empty();
};

/**
 * Positions the suggestions popup and starts a search.
 */
Drupal.jsAC.prototype.populatePopup = function () {
  var $input = $(this.input);
  var position = $input.position();
  // Show popup.
  if (this.popup) {
    $(this.popup).remove();
  }
  this.selected = false;
  this.popup = $('<div id="autocomplete"></div>')[0];
  this.popup.owner = this;
  $(this.popup).css({
    top: parseInt(position.top + this.input.offsetHeight, 10) + 'px',
    left: parseInt(position.left, 10) + 'px',
    width: $input.innerWidth() + 'px',
    display: 'none'
  });
  $input.before(this.popup);

  // Do search.
  this.db.owner = this;
  this.db.search(this.input.value);
};

/**
 * Fills the suggestion popup with any matches received.
 */
Drupal.jsAC.prototype.found = function (matches) {
  // If no value in the textfield, do not show the popup.
  if (!this.input.value.length) {
    return false;
  }

  // Prepare matches.
  var ul = $('<ul></ul>');
  var ac = this;
  for (key in matches) {
    $('<li></li>')
      .html($('<div></div>').html(matches[key]))
      .mousedown(function () { ac.select(this); })
      .mouseover(function () { ac.highlight(this); })
      .mouseout(function () { ac.unhighlight(this); })
      .data('autocompleteValue', key)
      .appendTo(ul);
  }

  // Show popup with matches, if any.
  if (this.popup) {
    if (ul.children().length) {
      $(this.popup).empty().append(ul).show();
      $(this.ariaLive).html(Drupal.t('Autocomplete popup'));
    }
    else {
      $(this.popup).css({ visibility: 'hidden' });
      this.hidePopup();
    }
  }
};

Drupal.jsAC.prototype.setStatus = function (status) {
  switch (status) {
    case 'begin':
      $(this.input).addClass('throbbing');
      $(this.ariaLive).html(Drupal.t('Searching for matches...'));
      break;
    case 'cancel':
    case 'error':
    case 'found':
      $(this.input).removeClass('throbbing');
      break;
  }
};

/**
 * An AutoComplete DataBase object.
 */
Drupal.ACDB = function (uri) {
  this.uri = uri;
  this.delay = 300;
  this.cache = {};
};

/**
 * Performs a cached and delayed search.
 */
Drupal.ACDB.prototype.search = function (searchString) {
  var db = this;
  this.searchString = searchString;

  // See if this string needs to be searched for anyway.
  searchString = searchString.replace(/^\s+|\s+$/, '');
  if (searchString.length <= 0 ||
    searchString.charAt(searchString.length - 1) == ',') {
    return;
  }

  // See if this key has been searched for before.
  if (this.cache[searchString]) {
    return this.owner.found(this.cache[searchString]);
  }

  // Initiate delayed search.
  if (this.timer) {
    clearTimeout(this.timer);
  }
  this.timer = setTimeout(function () {
    db.owner.setStatus('begin');

    // Ajax GET request for autocompletion. We use Drupal.encodePath instead of
    // encodeURIComponent to allow autocomplete search terms to contain slashes.
    $.ajax({
      type: 'GET',
      url: db.uri + '/' + Drupal.encodePath(searchString),
      dataType: 'json',
      success: function (matches) {
        if (typeof matches.status == 'undefined' || matches.status != 0) {
          db.cache[searchString] = matches;
          // Verify if these are still the matches the user wants to see.
          if (db.searchString == searchString) {
            db.owner.found(matches);
          }
          db.owner.setStatus('found');
        }
      },
      error: function (xmlhttp) {
        alert(Drupal.ajaxError(xmlhttp, db.uri));
      }
    });
  }, this.delay);
};

/**
 * Cancels the current autocomplete request.
 */
Drupal.ACDB.prototype.cancel = function () {
  if (this.owner) this.owner.setStatus('cancel');
  if (this.timer) clearTimeout(this.timer);
  this.searchString = '';
};

})(jQuery);
;

/**
 * @file shows / hides form elements
 */

(function ($) {

Drupal.behaviors.TaxonomyManagerHideForm = {
  attach: function(context, settings) {
    $('#taxonomy-manager-toolbar', context).once('hideForm', function() {
      for (var key in settings.hideForm) {
        Drupal.attachHideForm(settings.hideForm[key].div, settings.hideForm[key].show_button, settings.hideForm[key].hide_button);
      }
    });
  }
}

/**
 * adds click events to show / hide button
 */
Drupal.attachHideForm = function(div, show_button, hide_button) {
  var hide = true;
  var div = $("#"+ div);
  var show_button = $("#"+ show_button);
  var hide_button = $("#"+ hide_button);

  // don't hide if there is an error in the form
  $(div).find("input").each(function() {
    if ($(this).hasClass("error")) {
      hide = false;
    }
  });

  if (!hide) {
    $(div).show();
  }
  $(show_button).click(function() {
    Drupal.hideOtherForms(div);
    $(div).toggle();
    return false;
  });

  $(hide_button).click(function() {
    $(div).hide();
    return false;
  });
}

/**
 * Helper function that hides all forms, except the current one.
*/
Drupal.hideOtherForms = function(currentFormDiv) {
  var currentFormDivId = $(currentFormDiv).attr('id');
  var settings = Drupal.settings.hideForm || [];
  for (var key in settings) {
    var div = settings[key].div;
    if (div != currentFormDivId) {
      $('#' + div).hide();
    }
  }
}

})(jQuery);
;

/**
 * @file js for changing weights of terms with Up and Down arrows
 */

(function ($) {

//object to store weights (tid => weight)
var weights = new Object();

Drupal.behaviors.TaxonomyManagerWeights = {
  attach: function(context, settings) {
    var weightSettings = settings.updateWeight || [];
    if (!$('#taxonomy-manager-toolbar.tm-weights-processed').length) {
      $('#taxonomy-manager-toolbar').addClass('tm-weights-processed');
      Drupal.attachUpdateWeightToolbar(weightSettings['up'], weightSettings['down']);
      Drupal.attachUpdateWeightTerms();   
    }  
  }
}

/**
 * adds click events for Up and Down buttons in the toolbar, which
 * allow the moving of selected (can be more) terms
 */
Drupal.attachUpdateWeightToolbar = function(upButton, downButton) {
  var selected;
  var url = Drupal.settings.updateWeight['url'];  
  
  $('#'+ upButton).click(function() {
    selected = Drupal.getSelectedTerms();
    for (var i=0; i < selected.length; i++) {
      var upTerm = selected[i];
      var downTerm = $(upTerm).prev(); 
    
      Drupal.orderTerms(upTerm, downTerm);
    }
    if (selected.length > 0) {
      $.post(url, weights);
    }
  });
  
  
  $('#'+ downButton).click(function() {
    selected = Drupal.getSelectedTerms();
    for (var i=selected.length-1; i >= 0; i--) {
      var downTerm = selected[i];
      var upTerm = $(downTerm).next();
      
      Drupal.orderTerms(upTerm, downTerm);
    }
    if (selected.length > 0) {
      $.post(url, weights);
    }
  });
}

/**
 * adds small up and down arrows to each term
 * arrows get displayed on mouseover
 */
Drupal.attachUpdateWeightTerms = function(parent, currentIndex) {
  var settings = Drupal.settings.updateWeight || [];
  var disable = settings['disable_mouseover'];
 	 
  if (!disable) {
    var url = Drupal.settings.updateWeight['url'];
  
    var termLineClass = 'div.term-line';
    var termUpClass = 'img.term-up';
    var termDownClass = 'img.term-down';
  
    if (parent && currentIndex) {
      parent = $(parent).slice(currentIndex);
    }
    if (parent) {
      termLineClass = $(parent).find(termLineClass);
      termUpClass = $(parent).find(termUpClass);
      termDownClass = $(parent).find(termDownClass);
    }
  
    $(termLineClass).mouseover(function() {
      $(this).find('div.term-operations').show(); 
    });
  
    $(termLineClass).mouseout(function() {
      $(this).find('div.term-operations').hide(); 
    });
  
    $(termUpClass).click(function() {
      var upTerm = $(this).parents("li").eq(0);
      var downTerm = $(upTerm).prev(); 
    
      Drupal.orderTerms(upTerm, downTerm);
      $.post(url, weights);
    
      $(downTerm).find(termLineClass).unbind('mouseover');
      setTimeout(function() {
        $(upTerm).find('div.term-operations').hide();
        $(downTerm).find(termLineClass).mouseover(function() {
          $(this).find('div.term-operations').show();
        });
      }, 1500);
    
    });
  
  
    $(termDownClass).click(function() {
      var downTerm = $(this).parents("li").eq(0);
      var upTerm = $(downTerm).next();
    
      Drupal.orderTerms(upTerm, downTerm);
      $.post(url, weights);
    
      $(upTerm).find(termLineClass).unbind('mouseover');
      setTimeout(function() {
        $(downTerm).find('div.term-operations').hide();
        $(upTerm).find(termLineClass).mouseover(function() {
          $(this).find('div.term-operations').show();
        });
      }, 1500);
    
    });
  }

}

/**
 * return array of selected terms
 */
Drupal.getSelectedTerms = function() {
  var terms = new Array();
  $('.treeview').find("input:checked").each(function() {
    var term = $(this).parents("li").eq(0);
    terms.push(term);
  });
  
  return terms;
}

/**
 * reorders terms
 *   - swap list elements in DOM
 *   - post updated weights to callback in php
 *   - update classes of tree view
 */
Drupal.orderTerms = function(upTerm, downTerm) {
  try {
    Drupal.getTermId(upTerm);
    Drupal.swapTerms(upTerm, downTerm);
    Drupal.swapWeights(upTerm, downTerm);
    Drupal.updateTree(upTerm, downTerm);
  } catch(e) {
    //no next item, because term to update is last child, continue
  }
}

/**
 * simple swap of two elements
 */
Drupal.swapTerms = function(upTerm, downTerm) { 
  $(upTerm).after(downTerm);
  $(downTerm).before(upTerm);
}

/**
 * updating weights of swaped terms
 * if two terms have different weights, then weights are being swapped
 * else, if both have same weights, upTerm gets decreased
 *
 * if prev/next siblings of up/down terms have same weights as current
 * swapped, they have to be updated by de/increasing weight (by 1) to ensure
 * unique position of swapped terms
 */
Drupal.swapWeights = function(upTerm, downTerm) {
  var upWeight = Drupal.getWeight(upTerm);
  var downWeight = Drupal.getWeight(downTerm);
  var downTid = Drupal.getTermId(downTerm);
  var upTid = Drupal.getTermId(upTerm);
  
  //same weight, decrease upTerm
  if (upWeight == downWeight) {
    weights[upTid] = --upWeight;
  }
  //different weights, swap
  else {
    weights[upTid] = downWeight;
    weights[downTid] = upWeight;
  }
  
  //update prev siblings if necessary
  try {
    if (Drupal.getWeight($(upTerm).prev()) >= upWeight) {
      $(upTerm).prevAll().each(function() {
        var id = Drupal.getTermId(this);
        var weight = Drupal.getWeight(this);
        weights[id] = --weight;
      });
    }
  } catch(e) {
    //no prev
  }
  
  //update next siblings if necessary
  try {
    if (Drupal.getWeight($(downTerm).next()) <= downWeight) {
      $(downTerm).nextAll().each(function() {
        var id = Drupal.getTermId(this);
        var weight = Drupal.getWeight(this);
        weights[id] = ++weight;
      });
    }
  } catch(e) {
    //no next
  }

}

/**
 * helper to return weight of a term
 */
Drupal.getWeight = function(li) {
  var id = Drupal.getTermId(li);
  var weight;
  
  if (weights[id] != null) {
    weight = weights[id];
  }
  else {
    weight = $(li).find("input:hidden[class=weight-form]").attr("value");
  }
  
  return weight;
}

})(jQuery);
;

/**
 * @file js support for term editing form for ajax saving and tree updating
 */


(function ($) {
  
//global var that holds the current term link object
var active_term = new Object();

/** 
 * attaches term data form, used after 'Saves changes' submit
 */
Drupal.behaviors.TaxonomyManagerTermData = {
  attach: function(context) {
    if (!$('#taxonomy-term-data-replace').hasClass('processed')) {
      $('#taxonomy-term-data-replace').addClass('processed');
      Drupal.attachTermDataForm();
    }
  }
}

/**
 * attaches Term Data functionality, called by tree.js
 */
Drupal.attachTermData = function(ul) {
  Drupal.attachTermDataLinks(ul);
}

/**
 * adds click events to the term links in the tree structure
 */
Drupal.attachTermDataLinks = function(ul) {
  $(ul).find('a.term-data-link').click(function() {
    Drupal.activeTermSwapHighlight(this);
    var li = $(this).parents("li:first");
    Drupal.loadTermDataForm(Drupal.getTermId(li), false);
    return false;
  });
}

/**
 * attaches click events to next siblings
 */
Drupal.attachTermDataToSiblings = function(all, currentIndex) {
  var nextSiblings = $(all).slice(currentIndex);
  $(nextSiblings).find('a.term-data-link').click(function() {
    var li = $(this).parents("li:first");
    Drupal.loadTermDataForm(Drupal.getTermId(li), false);
    return false;
  });
}

/**
 * adds click events to term data form, which is already open, when page gets loaded
 */
Drupal.attachTermDataForm = function() {
  active_term = $('div.highlightActiveTerm').find('a');
  var tid = $('#taxonomy-term-data').find('input:hidden[name="tid"]').val();
  if (tid) {
    new Drupal.TermData(tid).form();
  }
}

/**
 * loads term data form
 */
Drupal.loadTermDataForm = function(tid, refreshTree) {
  // Triggers an AJAX button
  $('#edit-load-tid').val(tid);
  if (refreshTree) {
    $('#edit-load-tid-refresh-tree').attr("checked", "checked");
  }
  else {
    $('#edit-load-tid-refresh-tree').attr("checked", "");
  }
  $('#edit-load-tid-submit').click();
}

/**
 * TermData Object
 */
Drupal.TermData = function(tid) {
  this.tid = tid;
  this.div = $('#taxonomy-term-data');
}

/**
 * adds events to possible operations
 */
Drupal.TermData.prototype.form = function() {
  var termdata = this;
  
  $(this.div).find('#term-data-close span').click(function() {
    termdata.div.children().hide();
  });
  
  $(this.div).find('a.taxonomy-term-data-name-link').click(function() {
    var tid = this.href.split("/").pop();
    Drupal.loadTermDataForm(tid, true);
    return false;
  });
  
  $(this.div).find("legend").each(function() {
    var staticOffsetX, staticOffsetY = null;
    var left, top = 0;
    var div = termdata.div; 
    var pos = $(div).position();
    $(this).mousedown(startDrag);  
  
    function startDrag(e) {
      if (staticOffsetX == null && staticOffsetY == null) {
        staticOffsetX = e.pageX;
        staticOffsetY = e.pageY;
      }
      $(document).mousemove(performDrag).mouseup(endDrag);
      return false;
    }
 
    function performDrag(e) {
      left = e.pageX - staticOffsetX;
      top = e.pageY - staticOffsetY;
      $(div).css({position: "absolute", "left": pos.left + left +"px", "top": pos.top + top +"px"});
      return false;
    }
 
    function endDrag(e) {
      $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
    }
  });
}

/**
* hightlights current term
*/
Drupal.activeTermSwapHighlight = function(link) {
  try {
    $(active_term).parents('div.term-line').removeClass('highlightActiveTerm');
  } catch(e) {}
  active_term = link;
  $(active_term).parents('div.term-line:first').addClass('highlightActiveTerm');
}

})(jQuery);
;

(function($) {
  Drupal.behaviors.CToolsJumpMenu = {
    attach: function(context) {
      $('.ctools-jump-menu-hide')
        .once('ctools-jump-menu')
        .hide();

      $('.ctools-jump-menu-change')
        .once('ctools-jump-menu')
        .change(function() {
          var loc = $(this).val();
          var urlArray = loc.split('::');
          if (urlArray[1]) {
            location.href = urlArray[1];
          }
          else {
            location.href = loc;
          }
          return false;
        });

      $('.ctools-jump-menu-button')
        .once('ctools-jump-menu')
        .click(function() {
          // Instead of submitting the form, just perform the redirect.

          // Find our sibling value.
          var $select = $(this).parents('form').find('.ctools-jump-menu-select');
          var loc = $select.val();
          var urlArray = loc.split('::');
          if (urlArray[1]) {
            location.href = urlArray[1];
          }
          else {
            location.href = loc;
          }
          return false;
        });
    }
  }
})(jQuery);
;
/** 
 * CSV Export
 *
 * adds click event to export button and makes AJAX call to get the CSV data
 */
(function ($) {

Drupal.behaviors.TaxonomyManagerCSVExport = {
  attach: function(context, settings) {    
    if (!$('#edit-export-show.csv-processed').length) {
      $('#edit-export-show').addClass('csv-processed');
      var url = settings.exportCSV['url'];
      var vid = settings.taxonomytree[0].vid;
  
      $("#edit-export-submit").click(function() {
        var area = $("#edit-export-csv");
        var param = new Object();
        param['delimiter'] = $("#edit-export-delimiter").val();
        param['depth'] = $("#edit-export-depth").val();
        param['option'] = $("#taxonomy_manager_export_options").find("input:checked").val();
        param['vid'] = vid;
        var tid = 0;
        $('.treeview').find("input:checked").each(function() {
         tid = Drupal.getTermId($(this).parents("li").eq(0));
        });
        param['tid'] = tid;
    
        $.post(url, param, function(data) {
          $(area).val(data['csv']);
        });
        return false;
      });
    }
  }
}

})(jQuery);
;

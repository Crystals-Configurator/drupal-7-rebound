(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? eval(Drupal.settings.tableHeaderOffset + '()') : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.css('width'));
  }
};

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

$(document).ready(function() {

  // Expression to check for absolute internal links.
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");

  // Attach onclick event to document only and catch clicks on all elements.
  $(document.body).click(function(event) {
    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      var ga = Drupal.settings.googleanalytics;
      // Expression to check for special links like gotwo.module /go/* links.
      var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
      // Expression to check for download links.
      var isDownload = new RegExp("\\.(" + ga.trackDownloadExtensions + ")$", "i");

      // Is the clicked URL internal?
      if (isInternal.test(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox')) {
          // Do nothing here. The custom event will handle all tracking.
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (ga.trackDownload && isDownload.test(this.href)) {
          // Download link clicked.
          var extension = isDownload.exec(this.href);
          _gaq.push(["_trackEvent", "Downloads", extension[1].toUpperCase(), this.href.replace(isInternal, '')]);
        }
        else if (isInternalSpecial.test(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          _gaq.push(["_trackPageview", this.href.replace(isInternal, '')]);
        }
      }
      else {
        if (ga.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          _gaq.push(["_trackEvent", "Mails", "Click", this.href.substring(7)]);
        }
        else if (ga.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (ga.trackDomainMode == 2 && isCrossDomain($(this).attr('hostname'), ga.trackCrossDomains)) {
            // Top-level cross domain clicked. document.location is handled by _link internally.
            event.preventDefault();
            _gaq.push(["_link", this.href]);
          }
          else {
            // External link clicked.
            _gaq.push(["_trackEvent", "Outbound links", "Click", this.href]);
          }
        }
      }
    });
  });

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  $(document).bind("cbox_complete", function() {
    var href = $.colorbox.element().attr("href");
    if (href) {
      _gaq.push(["_trackPageview", href.replace(isInternal, '')]);
    }
  });

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
function isCrossDomain(hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, http://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
}

})(jQuery);
;

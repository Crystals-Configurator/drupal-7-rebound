(function ($) {

Drupal.behaviors.rebound = {
  attach: function (context, settings) {

		// EXPANDING THE AVATAR PANE
		var tasks = $('#tasks .tabs');
				tasks.before('<div class="tasks-toggle"><span></span></div>');
				tasks.hide();
    $('#tasks .tasks-toggle').click(function() {
			tasks.slideToggle();													
		});

  }
};

})(jQuery);

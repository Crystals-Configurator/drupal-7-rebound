<?php

/**
 * @file
 * Process theme data.
 *
 * Use this file to run your theme specific implimentations of theme functions,
 * such preprocess, process, alters, and theme function overrides.
 *
 * Preprocess and process functions are used to modify or create variables for
 * templates and theme functions. They are a common theming tool in Drupal, often
 * used as an alternative to directly editing or adding code to templates. Its
 * worth spending some time to learn more about these functions - they are a
 * powerful way to easily modify the output of any template variable.
 * 
 * Preprocess and Process Functions SEE: http://drupal.org/node/254940#variables-processor
 * 1. Rename each function and instance of "adaptivetheme_subtheme" to match
 *    your subthemes name, e.g. if your theme name is "footheme" then the function
 *    name will be "footheme_preprocess_hook". Tip - you can search/replace
 *    on "adaptivetheme_subtheme".
 * 2. Uncomment the required function to use.
 */


/**
 * Preprocess variables for the html template.
 */
/* -- Delete this line to enable.
function adaptivetheme_subtheme_preprocess_html(&$vars) {
  global $theme_key;

  // Two examples of adding custom classes to the body.
  
  // Add a body class for the active theme name.
  // $vars['classes_array'][] = drupal_html_class($theme_key);

  // Browser/platform sniff - adds body classes such as ipad, webkit, chrome etc.
  // $vars['classes_array'][] = css_browser_selector();

}
// */


/**
 * Process variables for the html template.
 */
/* -- Delete this line if you want to use this function
function adaptivetheme_subtheme_process_html(&$vars) {
}
// */


/**
 * Override or insert variables for the page templates.
 */
/* -- Delete this line if you want to use these functions
function adaptivetheme_subtheme_preprocess_page(&$vars) {
}
function adaptivetheme_subtheme_process_page(&$vars) {
}
// */


/**
 * Override or insert variables into the node templates.
 */
function rebound_preprocess_node(&$variables) {
	// some handy node theme suggestions
	$variables['theme_hook_suggestions'][] = 'node__' . $variables['view_mode'];

	// change the default meta data on nodes
  if ($variables['submitted']) {
    $variables['submitted'] = t('<span class="meta-label by">BY //</span> !username <span class="meta-label on">ON //</span> !datetime', array('!username' => $variables['name'], '!datetime' => format_date($variables['node']->created, 'short')));
  }
}
// */

/**
 * Override or insert variables into the comments templates.
 */
function rebound_preprocess_comment(&$variables) {
	// change the default meta data on nodes
	//var_dump($variables);
  if ($variables['submitted']) {
    $variables['submitted'] = t('BY // !username - !datetime', array('!username' => $variables['author'], '!datetime' => format_date($variables['node']->created, 'short')));
  }
}
// */

/**
 * Override all links to remove the Log in to comment
 */
function rebound_links($links, $attributes = array()) {
  global $user;
  if (!$user->uid) {
    unset($links['links']['comment_forbidden']);
  }
  return theme_links($links, $attributes);
}
// */

/**
 * Override or insert variables into the comment templates.
 */
/* -- Delete this line if you want to use these functions
function adaptivetheme_subtheme_preprocess_comment(&$vars) {
}
function adaptivetheme_subtheme_process_comment(&$vars) {
}
// */


/**
 * Override or insert variables into the block templates.
 */
/* -- Delete this line if you want to use these functions
function adaptivetheme_subtheme_preprocess_block(&$vars) {
}
function adaptivetheme_subtheme_process_block(&$vars) {
}
// */


/**
 * Implements hook_theme()
 *
 * @param $existing
 * @param $type
 * @param $theme
 * @param $path
 *
 * @see http://api.drupal.org/api/drupal/modules!system!system.api.php/function/hook_theme/7
 */
function rebound_theme(&$existing, $type, $theme, $path) {
 $hooks['user_login_block'] = array(
	 'template' => 'templates/user/user-login-block',
	 'render element' => 'form',
 );
 return $hooks;
}
 
/**
 * Spliting elements out for user login block.
 */
function rebound_preprocess_user_login_block(&$vars) {
  $vars['name'] = render($vars['form']['name']);
  $vars['pass'] = render($vars['form']['pass']);
  $vars['submit'] = render($vars['form']['actions']['submit']);
  $vars['rendered'] = drupal_render_children($vars['form']);
}

/**
 * Removing the Text Formatting options and description from the comments box
 */
function rebound_form_alter(&$form, &$form_state) {
  $form['comment_body']['#after_build'][] = 'rebound_customize_form';
	
	if($form['#node']->type == "guild_application") {
		$form['body']['#after_build'][] = 'rebound_customize_form';
		$form['application_references']['#after_build'][] = 'rebound_customize_form';
		$form['application_raid_experience']['#after_build'][] = 'rebound_customize_form';
		$form['application_raid_availablity']['#after_build'][] = 'rebound_customize_form';
	}

}

function rebound_customize_form(&$form) {
  $form[LANGUAGE_NONE][0]['format']['#access'] = FALSE;
  return $form;
}

/**
 * Adding classes to the wowguild menu tasks
 */
function rebound_menu_local_tasks_alter(&$data, $router_item, $root_path) {
	function addClasses(&$array){
		for ($i=0; $i<count($array); $i++) {
			$name_clean = $array[$i]['#link']['title'];
			$name_clean = str_replace(' ', '-', $name_clean);
			$name_clean = strtolower($name_clean);
			
			$classes = 'af-button-large ' . $name_clean . '-link';
			$array[$i]['#link']['localized_options']['attributes']['class'] = $classes;
		}
	}
	
	
  if ($router_item['path'] == 'avatar/%') {
    if ($router_item['page_arguments'][0]->type == 'wowtoon') {
			addClasses($data['actions']['output']);
		}
	}
	
	if ($router_item['path'] == 'guild/%') {
		addClasses($data['actions']['output']);
	}
	
	if (user_access('access user profiles')) {
  	if (!empty($router_item['page_arguments'][0]->uid)) {
			addClasses($data['actions']['output']);
		}
	}
}

function rebound_preprocess_wowguild_recruitment_block(&$variables) {
	//var_dump($variables);
	$variables['application_link'] = wowguild_can_apply_to_guild()?l(t('Apply to Guild'), 'node/add/guild-application'):'';
}
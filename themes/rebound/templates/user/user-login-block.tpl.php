<div class="user-login-popup">
	<?php print $name; // Display username field ?>
  <?php print $pass; // Display Password field ?>
  <div class="link-forgot-pass"><a href="/user/password">Forgot Password</a></div>
  <?php print $submit; // Display submit button ?>
  <?php print $rendered; // Display hidden elements (required for successful login) ?>
</div>
<div class="links">
	<?php //print $links; //Original links replaced by ones below ?>
  <a href="/user" class="link-login">Log in</a> <span class="delimeter">//</span> <a href="/user/register">Register</a>
</div>

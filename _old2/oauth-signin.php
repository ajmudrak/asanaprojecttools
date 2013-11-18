<?php
require_once 'asana-oauth.php';
$asana = new AsanaOauth();

?><a href="<?php echo $asana->getSignInUrl(); ?>"><img src="/images/asana-oauth-button-blue.png" alt="Sign in with Asana" /></a>
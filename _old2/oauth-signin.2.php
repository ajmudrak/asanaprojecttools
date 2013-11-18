<?php

require_once 'asana-oauth.2.php';

?><a href="<?php echo $api->getAuthorizeUri($context); ?>"><img src="/images/asana-oauth-button-blue.png" alt="Sign in with Asana" /></a>
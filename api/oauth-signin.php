<?php

require_once 'lib/oauth-proxy-config.php';

// redirect to the sign in url
header('Location: ' . $_OAUTH_SERVICE->getSignInUrl());

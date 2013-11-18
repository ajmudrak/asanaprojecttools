<?php

require_once 'lib/oauth-proxy-config.php';

if ($_OAUTH_PATH_INFO !== '') {
    // Nothing should be after the callback service name
    header('HTTP/1.1 400 Bad Request');
    exit;
}

if (session_id() === '') {
    session_start();
}
unset($_SESSION[get_class($_OAUTH_SERVICE)]);

header('Location: ' . $_OAUTH_SERVICE->getAppUrl());

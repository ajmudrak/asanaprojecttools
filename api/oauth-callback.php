<?php

require_once 'lib/oauth-proxy-config.php';

if ($_OAUTH_PATH_INFO !== '') {
    // Nothing should be after the callback service name
    header('HTTP/1.1 400 Bad Request');
    exit;
}

/// TODO: add security features (whitelist ip for service)

$exchange_code = $_GET['code'];

$token = $_OAUTH_SERVICE->authorize($exchange_code);
if (session_id() === '') {
    session_start();
}
ProxyApiConfig::storeTokens();

header('Location: ' . $_OAUTH_SERVICE->getAppUrl());

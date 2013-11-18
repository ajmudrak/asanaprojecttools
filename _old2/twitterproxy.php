<?php

require_once 'twitter.php';

$proxy = new TwitterOAuth();
$proxy->proxyApiCallWithBearerAccessToken();

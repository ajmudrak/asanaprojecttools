<?php

require_once 'vendor/autoload.php';

$clientConfig = new \fkooman\OAuth\Client\ClientConfig(
    array(
        "authorize_endpoint" => "https://api.twitter.com/oauth/authorize",
        "client_id" => "L3GvfNww98AfJL46MIZA",
        "client_secret" => "0h4hgtYuFDnyrdQfdkjwLZj5e5iHzRy5oLtl8WsTfjU",
        "token_endpoint" => "https://api.twitter.com/oauth/access_token",
        "redirect_uri" => "https://asanaprojecttools-c9-ajmudrak.c9.io/tc.php"
    )
);

$tokenStorage = new \fkooman\OAuth\Client\SessionStorage();
$httpClient = new \Guzzle\Http\Client();
$api = new fkooman\OAuth\Client\Api("foo", $clientConfig, $tokenStorage, $httpClient);

$context = new \fkooman\OAuth\Client\Context("L3GvfNww98AfJL46MIZA", array());


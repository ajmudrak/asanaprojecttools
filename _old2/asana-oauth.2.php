<?php

require_once 'vendor/autoload.php';

$clientConfig = new \fkooman\OAuth\Client\ClientConfig(
    array(
        "authorize_endpoint" => "https://app.asana.com/-/oauth_authorize",
        "client_id" => "8553566333610",
        "client_secret" => "f88b25a10daa85f09a9eb35d3bda0b85",
        "token_endpoint" => "https://app.asana.com/-/oauth_token",
        "redirect_uri" => "https://asanaprojecttools-c9-ajmudrak.c9.io/oauth-callback.php"
    )
);

$tokenStorage = new \fkooman\OAuth\Client\SessionStorage();
$httpClient = new \Guzzle\Http\Client();
$api = new fkooman\OAuth\Client\Api("foo", $clientConfig, $tokenStorage, $httpClient);

$context = new \fkooman\OAuth\Client\Context("8553566333610", array());


<?php

require_once(dirname(__FILE__) . '/oauthservice.php');
/// TODO: update redirect_baseuri so it uses the classname automatically

// Define classes that extend OAuthService as shown below.  Utilize the 'OAuthService_' prefix for class names.
class OAuthService_Asana extends OAuthService {
    public $consumerkey = '8553566333610';
    public $consumersecret = 'f88b25a10daa85f09a9eb35d3bda0b85';
    public $apibaseurl = 'https://app.asana.com/api/1.0';
    public $tokenurl = 'https://app.asana.com/-/oauth_token';
    public $authorizeurl = 'https://app.asana.com/-/oauth_authorize';
    public $redirect_baseuri = 'https://asanaprojecttools-c9-ajmudrak.c9.io/api/oauth-callback.php/Asana';
    public $response_type = 'code';
    public $grant_type = 'authorization_code'; // authorization_code, password
    public $app_url = '/';
}

class OAuthService_TwitterClient extends OAuthService {
    public $consumerkey = 'L3GvfNww98AfJL46MIZA';
    public $consumersecret = '0h4hgtYuFDnyrdQfdkjwLZj5e5iHzRy5oLtl8WsTfjU';
    public $apibaseurl = 'https://api.twitter.com/1.1';
    public $tokenurl = 'https://api.twitter.com/oauth2/token';

    public $oauth_version = 2;
    public $grant_type = 'client_credentials';
}

class OAuthService_Twitter extends OAuthService {
    public $consumerkey = 'L3GvfNww98AfJL46MIZA';
    public $consumersecret = '0h4hgtYuFDnyrdQfdkjwLZj5e5iHzRy5oLtl8WsTfjU';
    public $apibaseurl = 'https://api.twitter.com/1.1';
    public $tokenurl = 'https://api.twitter.com/oauth/access_token';
    public $authorizeurl = 'https://api.twitter.com/oauth/authorize';
    public $redirect_baseuri = 'https://asanaprojecttools-c9-ajmudrak.c9.io/api/oauth-callback.php/Twitter';
    public $response_type = 'code';
    public $app_url = '/twittertest2.html';
    
    public $oauth_version = 1;
    public $requesttokenurl = 'https://api.twitter.com/oauth/request_token';
    public $signature_method = 'HMAC-SHA1';
}

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
    public $app_url = '/';
}

<?php

require_once 'lib/oauthservice.php';

class TwitterOauth extends OAuthService {
    
    public function __construct() {
        $key = 'L3GvfNww98AfJL46MIZA';
        $secret = '0h4hgtYuFDnyrdQfdkjwLZj5e5iHzRy5oLtl8WsTfjU';
        $url = 'https://api.twitter.com/1.1';
        $tokenurl = 'https://api.twitter.com/oauth2/token';
        parent::__construct($key, $secret, $url, $tokenurl);
    }
    
}

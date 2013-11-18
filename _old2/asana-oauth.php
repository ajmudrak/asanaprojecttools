<?php

require_once 'lib/oauthservice.php';

class AsanaOauth extends OAuthService {
    
    var $authorize_url = 'https://app.asana.com/-/oauth_authorize';
    var $redirect_uri = 'https://asanaprojecttools-c9-ajmudrak.c9.io/oauth-callback.php';
    var $response_type = 'code';
    var $app_url = '/';
    
    public function __construct() {
        $key = '8553566333610';
        $secret = 'f88b25a10daa85f09a9eb35d3bda0b85';
        $url = 'https://app.asana.com/api/1.0';
        $tokenurl = 'https://app.asana.com/-/oauth_token';
        parent::__construct($key, $secret, $url, $tokenurl);
    }
    
    public function getSignInUrl() {
        return $this->authorize_url . "?" . http_build_query(array (
                'client_id' => $this->consumerkey,
                'redirect_uri' => $this->redirect_uri,
                'response_type' => $this->response_type
            ));
    }
    
    public function getAppUrl() {
        return $this->app_url;
    }
    
    public function authorize($code) {
        $headers = array(
            'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'
        );
        $post = http_build_query(array(
            'grant_type' => 'authorization_code',
            'client_id' => $this->consumerkey,
            'client_secret' => $this->consumersecret,
            'redirect_uri' => $this->redirect_uri,
            'code' => $code
        ));
        $response = $this->httpCall('POST', $this->tokenurl, $post, $headers);
        if ( $response->success && $response->responseCode == 200 ) {
            $data = json_decode($response->responseBody);
            $this->bearerAccessToken = $data->access_token;
            return $this->bearerAccessToken;
        } else {
            return FALSE;
        }
    }

}

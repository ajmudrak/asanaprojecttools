<?php

class OAuthServiceApiResponse {
    
    public $success = FALSE;
    public $errorno = null;
    public $errormsg = null;
    
    public $responseCode = null;
    public $responseMessage = null;
    public $responseBody = null;
    
    public $contentType = null;
    
}

abstract class OAuthService {

    public $consumerkey = '';
    public $consumersecret = '';
    public $apibaseurl = '';
    public $tokenurl = '';
    public $authorizeurl = '';
    public $redirect_baseuri = '';
    public $response_type = '';
    public $app_url = '';
    public $tryrefreshstatuscodes = array(401);

    protected $appname = '';
    protected $config = null;

    public $bearerAccessToken = FALSE;
    public $bearerRefreshToken = FALSE;
    
    public function __construct() {
        $this->appname = get_class();
        $this->config = $config;
    }
    
    public function getBearerAccessToken() {
        if (!$this->bearerAccessToken) {
            $this->loadBearerAccessToken();
        }
        return $this->bearerAccessToken;
    }

    public function loadBearerAccessToken() {
        $bearerCredentials = $this->consumerkey . ':' . $this->consumersecret;
        $bearerEncoded = base64_encode($bearerCredentials);
        
        $headers = array(
            'Authorization: Basic ' . $bearerEncoded,
            'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'
        );
        $post = http_build_query(array(
            'grant_type' => 'client_credentials'
        ));
        $response = $this->apiTokenCall('POST', $post, $headers);
        
        if (!$response->success || $response->responseCode != 200) {
            return FALSE;
        } else {
            $responseData = json_decode($response->responseBody);
            $access_token = $responseData->access_token;
            $this->bearerAccessToken = $access_token;
            
            return $this->bearerAccessToken;
        }
    }
    
    public function apiCall($method, $query, $apipath, $post, $apiheaders, $allow_refresh = true) {
        if ($this->bearerAccessToken) {
            $newheaders = array_merge($apiheaders, array(
                'Authorization: Bearer ' . $this->bearerAccessToken
            ));
        } else {
            $newheaders = $apiheaders;
        }
        $apiurl = $this->apibaseurl . $apipath . ($query ? "?$query" : '');
        $result = $this->httpCall($method, $apiurl, $post, $newheaders);
        if ($allow_refresh && $result->responseCode != 200 && in_array($result->responseCode, $this->tryrefreshstatuscodes)) {
            $oldrefresh = $this->bearerRefreshToken;
            $oldtoken = $this->bearerAccessToken;
            $newtoken = $this->refresh();
            // print_r($result);
            // print_r("new token: $newtoken, $this->bearerAccessToken; oldrefresh: $oldrefresh, $this->bearerRefreshToken\r\n");
            // try refresh token
            if ($newtoken) {
                // one more try after successful refresh
                $newresult = $this->apiCall($method, $query, $apipath, $post, $apiheaders, false);
                $newresult->refreshAttempt = true;
                $newresult->refreshResult = true;
                $newresult->oldtoken = $oldtoken;
                // die("refresh success\r\n" . print_r($newresult, true));
                return $newresult;
            } else {
                $result->refreshAttempt = true;
                $result->refreshResult = false;
                // refresh failed, return original result
                // die("refresh failed\r\n" . print_r($result, true));
                return $result;
            }
        } else {
            return $result;
        }
    }
    
    public function apiTokenCall($method, $post, $apiheaders) {
        $apiurl = $this->tokenurl;
        return $this->httpCall($method, $apiurl, $post, $apiheaders);
    }
    
    protected function httpCall($method, $apiurl, $post, $apiheaders) {
        $api_request = curl_init($apiurl);
        $options = array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $apiheaders,
            CURLOPT_POSTFIELDS => $post,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HEADER => true
        );
        // print_r( $apiheaders );
        curl_setopt_array(
            $api_request, 
            $options
        );
        $result = new OAuthServiceApiResponse();
        $rawresponse = curl_exec($api_request);
        $result->responseCode = curl_getinfo($api_request, CURLINFO_HTTP_CODE);

        if ($rawresponse === FALSE) {
            $result->success = FALSE;
            $result->errorno = curl_errno($api_request);
            $result->errormsg = curl_error();
        } else {
            $result->success = TRUE;
        }
        $result->responseMessage = substr($rawresponse, 0, strpos($rawresponse, "\r\n"));
        $result->contentType = curl_getinfo($api_request, CURLINFO_CONTENT_TYPE);
        $result->responseBody = substr($rawresponse, strpos($rawresponse, "\r\n\r\n") + 4);
        curl_close($api_request);

        return $result;
    }

    public function getSignInUrl() {
        return $this->authorizeurl . "?" . http_build_query(array (
                'client_id' => $this->consumerkey,
                'redirect_uri' => $this->redirect_baseuri,
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
            'redirect_uri' => $this->redirect_baseuri,
            'code' => $code
        ));
        $response = $this->httpCall('POST', $this->tokenurl, $post, $headers);
        if ( $response->success && $response->responseCode == 200 ) {
            $data = json_decode($response->responseBody);
            $this->bearerAccessToken = $data->access_token;
            $this->bearerRefreshToken = $data->refresh_token;
            return $this->bearerAccessToken;
        } else {
            return FALSE;
        }
    }
    
    public function refresh() {
        if (!$this->bearerRefreshToken) {
            return FALSE;
        }
        $headers = array(
            'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'
        );
        $post = http_build_query(array(
            'grant_type' => 'refresh_token',
            'client_id' => $this->consumerkey,
            'client_secret' => $this->consumersecret,
            'redirect_uri' => $this->redirect_baseuri,
            'refresh_token' => $this->bearerRefreshToken
        ));
        $response = $this->httpCall('POST', $this->tokenurl, $post, $headers);
        if ( $response->success && $response->responseCode == 200 ) {
            // print_r( $response);
            $data = json_decode($response->responseBody);
            $this->bearerAccessToken = $data->access_token;
            if ($data->refresh_token) {
                // only reset if there is one that is specified in the result
                $this->bearerRefreshToken = $data->refresh_token;
            }
            return $this->bearerAccessToken;
        } else {
            return FALSE;
        }
    }

}


class ProxyApi {
    
    protected $service = null;
    
    public function __construct(OAuthService $service) {
        $this->service = $service;
    }
    
    public function proxyApiCallWithBearerAccessToken() {
        $token = $this->service->getBearerAccessToken();
        if (!$token) {
            header('HTTP/1.0 401 Could not obtain access token');
            return FALSE;
        }
        return $this->proxyApiCall();
    }
    
    public function proxyApiCallWithBearerAccessToken2() {
        if (!$this->service->bearerAccessToken) {
            header('HTTP/1.0 401 Could not obtain access token');
            return FALSE;
        }
        return $this->proxyApiCall();
    }
    
    protected function proxyApiCall($apiheaders = array()) {
        $apimethod = $_SERVER['REQUEST_METHOD'];
        $query = $_SERVER['QUERY_STRING'];
        $apipath = $GLOBALS['_OAUTH_PATH_INFO'];
        $apiurl = $this->service->apibaseurl . $apipath . ($query ? "?$query" : '');
        
        if ($_SERVER['CONTENT_TYPE']) {
            array_push($apiheaders, 'Content-Type: ' . $_SERVER['CONTENT_TYPE']);
        }
        $post = http_build_query($_POST);
        /// TODO: figure out how to get file_get_contents for stdin working to forward post data
        // $post = file_get_contents('php://stdin');
        $response = $this->service->apiCall($apimethod, $query, $apipath, $post, $apiheaders);
        if (!$response->success) {
            header("HTTP/1.1 500 Server Error");
            $response->responseBody = 'API Request Failed - ' . curl_error($api_request);
            // $response->responseBody += "\r\n" . print_r( $response, true );
            $response->contentType = 'text/plain';
        } else if ($response->responseCode != 200) {
            header("HTTP/1.1 $response->responseCode $response->responseMessage");
        }
        // header("X-OAuthServiceInfo-Url: " . $apiurl);
        if ($response->contentType) {
            header("Content-Type: " . $response->contentType);
        }
        echo $response->responseBody;
        return $response;
    }
    
    public static function getRedirectUri($proxyapi_baseurl, $servicename) {
        return $proxyapi_baseurl . 'oauth-callback.php/' . $servicename;
    }
    
}

<?php

require_once 'asana-oauth.2.php';

$cb = new \fkooman\OAuth\Client\Callback("foo", $clientConfig, $tokenStorage, $httpClient);
try {
    $cb->handleCallback($_GET);

    print_r( $cb );
    print_r( $_SESSION );
    print_r( $_GET );

} catch (\fkooman\OAuth\Client\AuthorizeException $e) {
    print_r( $cb );
    print_r( $_SESSION );
    print_r( $_GET );

    // this exception is thrown by Callback when the OAuth server returns a
    // specific error message for the client, e.g.: the user did not authorize
    // the request
    die(sprintf("ERROR: %s, DESCRIPTION: %s", $e->getMessage(), $e->getDescription()));
} catch (\Exception $e) {
    print_r( $cb );
    print_r( $_SESSION );
    print_r( $_GET );

    // other error, these should never occur in the normal flow
    die(sprintf("ERROR: %s", $e->getMessage()));
    echo 'x';
}

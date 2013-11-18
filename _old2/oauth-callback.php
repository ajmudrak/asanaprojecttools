<?php

require_once 'asana-oauth.php';

$exchange_code = $_GET['code'];

$path = $_SERVER['PATH_INFO'];
echo "path: $path\r\n";
if (preg_match('@^/[a-zA-Z0-9_]+$@', $path) !== 1) {
    die('bad data');
    header('HTTP/1.1 400 Bad Request');
    return;
}
$classname = substr($path, 1);
if (!class_exists($classname)) {
    die('not exist');
    header('HTTP/1.1 400 Bad Request');
    return;
}
die('class: ' . $classname);

$asana = new $classname();
$token = $asana->authorize($exchange_code);
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
$_SESSION[$this->appname] = $token;

header('Location: ' + $asana->getAppUrl());

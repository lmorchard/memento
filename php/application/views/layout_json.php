<?php
$callback = @$_GET['callback'];
if (!$callback) {
    header('Content-Type: application/json');
} else {
    header('Content-Type: text/javascript');
    // Whitelist the callback to alphanumeric and a few mostly harmless
    // characters, none of which can be used to form HTML or escape a JSONP call
    // wrapper.
    $callback = preg_replace(
        '/[^0-9a-zA-Z\(\)\[\]\,\.\_\-\+\=\/\|\\\~\?\!\#\$\^\*\: \'\"]/', '', 
        $callback
    );
    echo "$callback(";
}

echo $content;

if ($callback) echo ')';

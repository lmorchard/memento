<?php
$callback = @$_GET['callback'];
if ($callback) {
    header('Content-Type: text/javascript');
    // Whitelist the callback to alphanumeric and a few mostly harmless
    // characters, none of which can be used to form HTML or escape a JSONP call
    // wrapper.
    $callback = preg_replace(
        '/[^0-9a-zA-Z\(\)\[\]\,\.\_\-\+\=\/\|\\\~\?\!\#\$\^\*\: \'\"]/', '', 
        $callback
    );
    echo "$callback(";
} else {
    header('Content-Type: application/json');
}

$out = array();
foreach ($notes as $note) {
    $a = array();
    foreach (array('uuid', 'name', 'created', 'modified') as $name) {
        $a[$name] = $note->{$name};
    }
    $a['href'] = "notes/{$note->uuid}";
    $out[] = $a;
}

echo json_encode($out);

if ($callback) echo ')';

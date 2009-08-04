<?php
$out = array(
    'href' => "notes/{$note->uuid}"
);
foreach ($note->as_array() as $name => $value) {
    if ('id' == $name) continue;
    $out[$name] = $value;
}
echo json_encode($out);

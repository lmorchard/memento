<?php
$out = array(
    'href' => "profiles/{$profile->screen_name}/notes/{$note->uuid}"
);
foreach ($note->as_array() as $name => $value) {
    if ('id' == $name) continue;
    if ($name == 'created' || $name == 'modified') {
        $value = gmdate('c', strtotime($value . 'Z'));
    }
    $out[$name] = $value;
}
echo json_encode($out);

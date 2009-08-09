<?php
$out = array();

if (!empty($notes)) foreach ($notes as $note) {
    $a = array('href' => "notes/{$note->uuid}");
    foreach (array('uuid', 'etag', 'name', 'created', 'modified') as $name) {
        if ($name == 'created' || $name == 'modified') {
            $val = gmdate('c', strtotime($note->{$name} . 'Z'));
        } else {
            $val = $note->{$name};
        }
        $a[$name] = $val;
    }
    $out[] = $a;
}

if (!empty($tombstones)) foreach ($tombstones as $tombstone) {
    $a = array(
        'tombstone' => true,
        'href'      => "notes/{$tombstone->uuid}"
    );
    foreach (array('uuid', 'created') as $name) {
        if ($name == 'created') {
            $val = gmdate('c', strtotime($tombstone->{$name} . 'Z'));
            $name = 'modified';
        } else {
            $val = $tombstone->{$name};
        }
        $a[$name] = $val;
    }
    $out[] = $a;
}

usort($out, create_function(
    '$a,$b',
    'return strcmp($a["modified"], $b["modified"]);'
));

echo json_encode($out);

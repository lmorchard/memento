<?php
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

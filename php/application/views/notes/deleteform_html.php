<?php
    $note_data = $note->as_array();
    $h = html::escape_array($note_data);
    $u = html::urlencode_array($note_data);
    $h['screen_name'] = html::specialchars($screen_name);
    
    $home_url = url::base() . 'profiles/'.$screen_name.'/notes/';

    slot::set('page_title', "{$h['name']} - {$h['screen_name']}");
?>
<?php slot::start('crumbs') ?>
    / <?=$h['screen_name']?> / <a href="<?=$home_url?>">notes</a> / <?=$h['name']?> (delete?)
<?php slot::end() ?>

<?php
    $form_url = url::base() . 'profiles/' . $screen_name .
        '/notes/' . $u['uuid'] . '?_method=DELETE';
?>
<form id="editor" method="POST" action="<?=$form_url?>">
    <p>Delete "<?=$h['name']?>"? Are you sure?</p>
    <input class="delete" type="submit" value="confirm delete" id="delete" />
</form>

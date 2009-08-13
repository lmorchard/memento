<?php
    $note_data = $note->as_array();
    $h = html::escape_array($note_data);
    $u = html::urlencode_array($note_data);
?>
<?php slot::set('page_title', $h['name']) ?>

<?php
    $form_url = url::base() . 'profiles/' . $screen_name .
        '/notes/' . $u['uuid'] . '?_method=DELETE';
?>
<form id="editor" method="POST" action="<?=$form_url?>">
    <div class="header">        
        <h1><?=$h['name']?></h1>
    </div>
    <input class="delete" type="submit" value="delete?" id="delete" />
</form>

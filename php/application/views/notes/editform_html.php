<?php
    $note_data = $note->as_array();
    $h = html::escape_array($note_data);
    $u = html::urlencode_array($note_data);
?>
<?php slot::set('page_title', $h['name']) ?>

<?php
    $form_url = url::base() . 'profiles/' . $screen_name .
        '/notes/' . $u['uuid'] . '?_method=PUT';
?>
<form id="editor" method="POST" action="<?=$form_url?>">
    <input type="hidden" name="modified" value="true" />
    <div class="header">        
        <h1><?=$h['name']?></h1>
        <a class="back" href="<?=url::base() . 'profiles/'.$screen_name.'/notes/'?>">&lt;&lt; back</a>
    </div>
    <textarea cols="70" rows="20" name="text" id="text"><?=$h['text']?></textarea>
    <div class="footer">
        <input type="checkbox" name="autosave" id="autosave" />
        <label for="autosave">autosave?</label>
        <input class="save" type="submit" value="save" id="save" />
    </div>
</form>

<?php
    $note_data = $note->as_array();
    $h = html::escape_array($note_data);
    $u = html::urlencode_array($note_data);
?>
<?php slot::set('page_title', $h['name']) ?>

<form id="editor" method="POST" action="<?=url::base().url::current()?>">
    <div class="header">        
        <h1><?=$h['name']?></h1>
    </div>
    <textarea cols="70" rows="20" name="content" id="content"><?=$h['content']?></textarea>
    <div class="footer">
        <input type="checkbox" name="autosave" id="autosave" />
        <label for="autosave">autosave?</label>
        <input class="save" type="submit" value="save" id="save" />
        <a class="back" href="<?=url::base()?>notes/">notes list</a>
    </div>
</form>

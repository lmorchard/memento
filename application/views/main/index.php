<?php slot::set('page_title', 'all notes') ?>

<form method="POST" action="<?=url::base() . 'notes'?>">
    <label>name</label>
    <input type="text" size="30" name="name" id="name" />
    <input type="submit" value="new" />
</form>

<ul>
    <?php foreach ($notes as $note): ?>
        <?php
            $note_data = $note->as_array();
            $h = html::escape_array($note_data);
            $u = html::urlencode_array($note_data);
        ?>
        <li><a href="<?=url::base() . 'notes/' . $u['name'] ?>"><?=$h['name']?></a></li>
    <?php endforeach ?>
</ul>

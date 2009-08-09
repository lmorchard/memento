<?php slot::set('page_title', 'all notes') ?>

<form method="POST" action="<?=url::base() . 'notes/?format=html'?>">
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
        <li>
            <a href="<?=url::base() . 'notes/' . $u['uuid'] ?>;edit"><?=$h['name']?></a>
            <?=gmdate('c', strtotime($h['modified'].'Z'))?>
            [<a href="<?=url::base() . 'notes/' . $u['uuid'] ?>;delete">delete</a>]
            [<a href="<?=url::base() . 'notes/' . $u['uuid'] ?>">raw</a>]
        </li>
    <?php endforeach ?>
</ul>

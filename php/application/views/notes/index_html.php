<?php
$u_screen_name = html::specialchars($screen_name);
$home_url = url::base() . 'profiles/'.$screen_name.'/notes/';
slot::set('page_title', $u_screen_name);
?>
<?php slot::start('crumbs') ?>
    / <?=$u_screen_name?> / <a href="<?=$home_url?>">notes</a> /
<?php slot::end() ?>

<?php
$form_url = url::base() . 'profiles/'.$screen_name.'/notes/'
?>
<form method="POST" action="<?=$form_url?>">
    <fieldset class="new_note">
        <legend>new note</legend>
        <label for="name">name</label>
        <input type="text" size="60" name="name" id="name" />
        <input type="submit" class="submit" value="new" />
    </fieldset>
</form>

<ul>
    <?php foreach ($notes as $note): ?>
        <?php
            $note_data = $note->as_array();
            $h = html::escape_array($note_data);
            $u = html::urlencode_array($note_data);
            $note_url = url::base() . 'profiles/' . $screen_name . 
                '/notes/' . $u['uuid'];
        ?>
        <li>
            <a href="<?=$note_url?>;edit"><?=$h['name']?></a>
            <?=gmdate('c', strtotime($h['modified'].'Z'))?>
            [<a href="<?=$note_url?>;delete">delete</a>]
            [<a href="<?=$note_url?>">raw</a>]
        </li>
    <?php endforeach ?>
</ul>

<?php
$u_screen_name = html::specialchars($screen_name);
$home_url = url::base() . 'profiles/'.$screen_name.'/notes/';
slot::set('page_title', $u_screen_name);
?>
<?php slot::start('crumbs') ?>
    / <?=$u_screen_name?> / <a href="<?=$home_url?>">notes</a> /
    <?php $form_url = url::base() . 'profiles/'.$screen_name.'/notes/' ?>
    <form class="new_note" method="POST" action="<?=$form_url?>">
        <input type="text" size="20" name="name" id="name" />
        <input type="submit" class="submit" value="new" />
    </form>
<?php slot::end() ?>

<ul class="notes">
    <?php foreach ($notes as $note): ?>
        <?php
            $note_data = $note->as_array();

            $h = html::escape_array($note_data);
            $u = html::urlencode_array($note_data);

            $note_url = url::base() . 
                'profiles/' . $screen_name . 
                '/notes/' . $u['uuid'];

            $h_date = gmdate('F j, Y g:i A', 
                strtotime($note_data['modified']));
        ?>
        <li class="note">
            <h4>
                <a href="<?=$note_url?>;edit"><?=$h['name']?></a>
            </h4>
            <p class="date"><?=$h_date?></p>
            <ul class="actions">
                <li><a href="<?=$note_url?>;delete">delete</a></li>
                <li><a href="<?=$note_url?>">raw</a></li>
            </ul>
        </li>
    <?php endforeach ?>
</ul>

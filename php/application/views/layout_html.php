<!DOCTYPE HTML>
<?php

$page_title = slot::get('page_title');
$head_title = slot::get('head_title');
if (empty($head_title)) $head_title = $page_title;
if (!empty($head_title)) $head_title .= ' - ';

$is_mobile = (NULL !== Kohana::user_agent('mobile'));

$page_classes = array();
if ($is_mobile) {
    $page_classes[] = 'mobile';
}

?>
<html>
    <head>
    <title><?=$head_title?>pre-pad</title>

        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta http-equiv="Content-Language" content="en-us" />
        <link rel="stylesheet" type="text/css" href="<?=url::base()?>css/main.css" />
        <?php if ($is_mobile): ?>
            <!-- <meta name="viewport" content="width=320; initial-scale=0.6666; maximum-scale=1.0; minimum-scale=0.6666" />  -->
            <meta name="viewport" content="width=320; initial-scale=1.0; maximum-scale=1.0; minimum-scale=1.0" /> 
            
        <?php endif ?>

    </head>
    <body id="<?= Router::$controller . '_' . Router::$method ?>" class="<?= Router::$controller . '_' . Router::$method ?> c_<?=Router::$controller?> m_<?=Router::$method?>">
        <div id="pagebody" class="<?=join(' ', $page_classes)?>">
            <?=$content?>
        </div>

        <script type="text/javascript" src="<?=url::base()?>js/prototype-1.6.0.3.js"></script>
        <script type="text/javascript" src="<?=url::base()?>js/main.js"></script>
        <script type="text/javascript">
            if (typeof Main == 'undefined') Main = {};
            Main.IS_MOBILE = <?= json_encode($is_mobile) ?>;
        </script>

    </body>
</html>

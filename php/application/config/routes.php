<?php defined('SYSPATH') OR die('No direct access allowed.');

$config['profiles/([^/]+)/'] = 
    'notes/index/screen_name/$1';
$config['profiles/([^/]+)/notes/'] = 
    'notes/index/screen_name/$1';
$config['profiles/([^/]+)/notes/([^;]+);delete'] = 
    'notes/deleteform/screen_name/$1/uuid/$2';
$config['profiles/([^/]+)/notes/([^;]+);edit'] = 
    'notes/editform/screen_name/$1/uuid/$2';
$config['profiles/([^/]+)/notes/(.*)'] = 
    'notes/view/screen_name/$1/uuid/$2';

$config['~([^/]+)/'] = 
    'notes/index/screen_name/$1';
$config['~([^/]+)/notes/'] = 
    'notes/index/screen_name/$1';
$config['~([^/]+)/notes/(.*);delete'] = 
    'notes/deleteform/screen_name/$1/uuid/$2';
$config['~([^/]+)/notes/(.*);edit'] = 
    'notes/editform/screen_name/$1/uuid/$2';
$config['~([^/]+)/notes/(.*)'] = 
    'notes/view/screen_name/$1/uuid/$2';

$config['_default'] = 'index';

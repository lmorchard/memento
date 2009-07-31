<?php defined('SYSPATH') OR die('No direct access allowed.');
/**
 * @package  Core
 *
 * Sets the default route to "welcome"
 */

$config['notes']             = 'main/index/$1';
$config['notes/(.*);delete'] = 'main/deleteform/$1';
$config['notes/(.*);edit']   = 'main/editform/$1';
$config['notes/(.*)']        = 'main/view/$1';

$config['_default'] = 'main';
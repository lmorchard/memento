<?php defined('SYSPATH') OR die('No direct access allowed.');
/**
 * @package  Core
 *
 * Sets the default route to "welcome"
 */

$config['notes']             = 'notes/index/$1';
$config['notes/(.*);delete'] = 'notes/deleteform/$1';
$config['notes/(.*);edit']   = 'notes/editform/$1';
$config['notes/(.*)']        = 'notes/view/$1';

$config['_default'] = 'notes';

<?php
/**
 * Profile model
 *
 * @package    auth_profiles
 * @subpackage models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Profile_Model extends Auth_Profile_Model
{
    // {{{ Model attributes

    public $has_many = array('notes');

    // }}}

}

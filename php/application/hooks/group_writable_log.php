<?php
/**
 * Quick hacky hook to try to ensure that log files stay group writable.
 *
 * @package    LMO_Utils
 * @subpackage hooks
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class GroupWritableLogHook {
    public static function init()
    {
        @chmod(Kohana::log_directory().date('Y-m-d').'.log'.EXT, 0664);
    }
}
Event::add('system.ready', array('GroupWritableLogHook', 'init'));

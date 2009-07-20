<?php
/**
 * Initialization hook
 */
class PrePad_Init {

    /**
     * Initialize and wire up event responders.
     */
    public static function init()
    {
        // HACK: Attempt to ensure log file is always group-writable
        @chmod(Kohana::log_directory().date('Y-m-d').'.log'.EXT, 0664);
    }

}
Event::add('system.ready', array('PrePad_Init', 'init'));

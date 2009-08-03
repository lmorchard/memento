<?php
/**
 * NotesTombstone model
 * 
 * @package    Memento
 * @subpackage Models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Note_tombstone_Model extends ORM
{
    /**
     * Allow UUID to be used as unique key for searches & etc.
     */
    public function unique_key($id) {
        if (!empty($id) && is_string($id) && !ctype_digit($id) ) {
            return 'uuid';
        }
        return parent::unique_key($id);
    }

}

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

    /**
     * Find tombstones in a time range, ideally in ISO8601 format.
     *
     * Using the term "modified" although the column "created" is searched, to 
     * maintain consistency with Note_Model
     *
     * @param string Time since
     * @param string Time until
     * @return ORM_Iterator
     */
    public function find_modified_in_timerange($since=null, $until=null)
    {
        $since = strtotime($since);
        if ($since) $this->where('created >=', gmdate('c', $since));
        $until = strtotime($until);
        if ($until) $this->where('created <=', gmdate('c', $until));
        return $this->find_all();
    }

}

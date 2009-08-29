<?php
/**
 * Note model
 * 
 * @package    Memento
 * @subpackage Models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Note_Model extends ORM
{
    // {{{ Model properties

    public $belongs_to = array('profile');    

    protected $sorting = array(
        'modified' => 'desc',
        'created'  => 'desc'
    );

    // }}}

    /**
     * Find notes in a time range, ideally in ISO8601 format.
     *
     * @param string Time since
     * @param string Time until
     * @return ORM_Iterator
     */
    public function find_modified_in_timerange($profile_id, $since=null, $until=null)
    {
        $this->where('profile_id', $profile_id);
        $since = strtotime($since);
        if ($since) $this->where('modified >=', gmdate('c', $since));
        $until = strtotime($until);
        if ($until) $this->where('modified <=', gmdate('c', $until));
        return $this->find_all();
    }

    /**
     * Save this note, updating etag.
     */
    public function save()
    {
        $this->etag = $this->etag();

        $rv = parent::save();

        // If there's a tombstone for this UUID, delete it since we just saved 
        // it. (undeleted it?)
        $ts = ORM::factory('note_tombstone', $this->uuid);
        if ($ts->loaded) $ts->delete();

        return $rv;
    }

    /**
     * Produce an array, ensuring an up-to-date etag is included in the array.
     *
     * @return array
     */
    public function as_array() {
        $this->etag = $this->etag();
        return parent::as_array();
    }

    /**
     * Produce an etag hash unique to the note content.
     *
     * @return string
     */
    public function etag() {
        $vals = array();
        foreach ($this->table_columns as $name=>$meta) {
            if (in_array($name, array('id', 'etag', 'created', 'modified'))) {
                // Skip a few non-content properties.
                continue;
            }
            $vals[] = "{$name}: {$this->{$name}}";
        }
        return md5(join("---\n", $vals));
    }

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
     * On deletion, try leaving a tombstone behind.
     *
     * @param string ID or null
     */
    public function delete($id = NULL) {
        $uuid = NULL;
    
        if ($id === NULL AND $this->loaded) {
            $uuid = $this->uuid;
            $id   = $this->id;
            $note = $this;
        } else if ($id !== null) {
            $note = $this->find($id);
            if ($note->loaded) $uuid = $note->uuid;
        }

        if (NULL !== $uuid) {
            ORM::factory('note_tombstone')
                ->set(array('uuid'=>$uuid, 'etag'=>$note->etag()))->save();
        }

		$rv = $this->db->where('id', $id)->delete($this->table_name);

		return $this->clear();
    }

    /**
     * Delete all or a set of notes by calling the delete() method, thus 
     * triggering creation of tombstones.
     */
    public function delete_all($ids=null)
    {
        $notes = $this->find_all($ids);
        foreach ($notes as $note) {
            $note->delete();
        }
        return $this->clear();
    }

}

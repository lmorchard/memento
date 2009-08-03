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

    /**
     * Save this note, updating etag.
     */
    public function save()
    {
        $this->etag = $this->etag();
        return parent::save();
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
            if (in_array($name, array('etag', 'created', 'modified'))) {
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
        } else if ($id !==null) {
            $note = $this->find($id);
            if ($note->loaded) $uuid = $note->uuid;
        }

        if (NULL !== $uuid) {
            ORM::factory('note_tombstone')
                ->set(array('uuid'=>$uuid))->save();
        }

        return parent::delete($id);
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

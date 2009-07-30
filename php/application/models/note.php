<?php
/**
 * Note model
 * 
 * @package    Memento
 * @subpackage Models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Note_Model extends Model
{
    public $base_dir = null;

    public $loaded   = false;

    public $uuid     = null;
    public $name     = null;
    public $text     = null;
    public $etag     = null;
    public $created  = null;
    public $modified = null;

    public $table_columns = array(
        'uuid'     => array('type' => 'string'),
        'name'     => array('type' => 'string'),
        'text'     => array('type' => 'string'),
        'etag'     => array('type' => 'string'),
        'created'  => array('type' => 'string'),
        'modified' => array('type' => 'string'),
    );

    public function __construct($uuid=null, $base_dir=null)
    {
        // parent::__construct(); // No need for DB yet?
        $this->base_dir = APPPATH . 'data/notes';
        if (null !== $uuid) $this->find($uuid);
    }

    private function _filename()
    {
        $fn = "{$this->base_dir}/{$this->uuid}.txt";
        return $fn;
    }

    public function find_all()
    {
        $notes = array();
        foreach (glob($this->base_dir . '/*.txt') as $fn)  {
            if (is_file($fn)) {
                $name = substr($fn, strlen($this->base_dir)+1, -4);
                $notes[] = new Note_Model($name);
            }
        }
        return $notes;
    }

    public function find($uuid)
    {
        $this->uuid = $uuid;
        if (is_file($this->_filename())) {
            $data = json_decode(file_get_contents($this->_filename(), true));
            foreach ($data as $name=>$value) {
                $this->{$name} = $value;
            }
            $this->etag   = $this->etag();
            $this->loaded = true;
        } else {
            $this->uuid   = null;
            $this->loaded = false;
        }
        return $this;
    }

    public function save()
    {
        if (empty($this->uuid)) 
            $this->uuid = uuid::uuid();

        // Using microseconds to stay friendly with JS times.
        $now = number_format(( time() + microtime() ) * 1000, 0, '.', '');
        if (empty($this->created)) $this->created = $now;
        $this->modified = $now;

        $data = $this->as_array();

        $out = json_encode($data);
        file_put_contents($this->_filename(), $out);
        chmod($this->_filename(), 0664);
        $this->loaded = true;
    }

    public function delete()
    {
        if (!$this->loaded) return;
        return unlink($this->_filename());
    }

    public function delete_all()
    {
        if (Kohana::config('notes.enable_delete_all') !== true) {
            throw new Exception('delete_all not enabled');
        }
        $all = $this->find_all();
        foreach ($all as $note) {
            $note->delete();
        }
    }

    public function as_array()
    {
        $arr = array();
        foreach ($this->table_columns as $name=>$meta) {
            $arr[$name] = $this->{$name};
        }
        $arr['etag'] = $this->etag();
        return $arr;
    }

    public function etag() {
        $vals = array();
        foreach ($this->table_columns as $name=>$meta) {
            if ($name=='etag') continue;
            $vals[] = $this->{$name};
        }
        return md5(join("---\n", $vals));
    }

}

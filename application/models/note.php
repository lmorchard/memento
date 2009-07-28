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

    public $loaded  = false;
    public $name    = null;

    public $table_columns = array(
        'name'    => array('type' => 'string'),
        'content' => array('type' => 'string'),
    );

    public function __construct($name=null)
    {
        // parent::__construct(); // No need for DB yet?
        $this->base_dir = APPPATH . 'data/notes';
        if (null !== $name) $this->find($name);
    }

    private function _filename()
    {
        $fn = "{$this->base_dir}/{$this->name}.txt";
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

    public function find($name)
    {
        $this->name = $name;
        if (is_file($this->_filename())) {
            $this->loaded = true;
        } else {
            $this->name = null;
        }
        return $this;
    }

    public function save()
    {
        file_put_contents($this->_filename(), $this->content);
        chmod($this->_filename(), 0664);
        Kohana::log('debug', 'saved ' . $this->_filename());
        $this->loaded = true;
    }

    public function as_array()
    {
        $arr = array();
        foreach ($this->table_columns as $name=>$meta) {
            $arr[$name] = $this->{$name};
        }
        return $arr;
    }

    public function __isset($name)
    {
        if ('content' === $name && $this->loaded) {
            return true; 
        }
        return isset($this->{$name});
    }

    public function __get($name)
    {
        if ('content' === $name) {
            // Lazy load the content on-demand.
            return $this->content = 
                file_get_contents($this->_filename());
        }
        return $this->{$name};
    }

}

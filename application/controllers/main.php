<?php
/**
 * Main controller for the application
 * 
 * @package    Memento
 * @subpackage Models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Main_Controller extends Local_Controller
{
    protected $auto_render = TRUE;

    public function __construct()
    {
        parent::__construct();
        $this->note_model = new Note_Model();
    }

    public function _getparams()
    {
        if (strpos($_SERVER['CONTENT_TYPE'], 'application/x-www-form-urlencoded')!==FALSE) {
            // Accept a standard form POST
            $params = $_POST;
        } else if ($_SERVER['CONTENT_LENGTH'] > 0) {
            // Accept JSON-encoded parameters
            $params = json_decode(file_get_contents('php://input'), true);
        } else {
            // Accept a standard form GET
            $params = $_GET;
        }
        return $params;
    }

    public function index() 
    {
        $notes = $this->note_model->find_all();

        if ('post' == request::method()) {
            $params = $this->_getparams();

            $note = new Note_Model();
            $note->name = $params['name'];
            $note->content = 'Your notes go here.';
            $note->save();

            return url::redirect('notes/' . $note->name);
        }

        $this->view->set_global(array(
            'notes' => $notes
        ));
    }

    public function view($name)
    {
        $note = $this->note_model->find($name);

        if ('post' == request::method()) {
            Kohana::log('debug', "Gwarr?");
            $params = $this->_getparams();
            $note->content = $params['content'];
            $note->save();
        }

        $this->view->set_global(array(
            'note' => $note
        ));
    }

    public function create()
    {

    }

}

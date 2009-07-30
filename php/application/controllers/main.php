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

    public function index() 
    {
        $notes = $this->note_model->find_all();

        $format = $this->input->get('format', '');

        if ('post' == request::method()) {
            $note = $this->_createNoteFromParams();
            if ('html' == $format) {
                // Redirect to an edit form.
                return url::redirect('notes/' . $note->uuid . ';edit');
            } else if ('json' == $format) {
                // Redirect to the resource itself with a 201 code.
                header("HTTP/1.0 201 Created");
                return url::redirect('notes/' . $note->uuid . '?format=json');
            } else {
                // Redirect to the resource itself with a 201 code.
                header("HTTP/1.0 201 Created");
                return url::redirect('notes/' . $note->uuid);
            }
        } else if ('delete' == request::method()) {
            Kohana::log('debug', "Deleting all!");
            $this->note_model->delete_all(); 
            header('HTTP/1.0 410 Gone');
            exit;
        }

        $this->view->notes = $notes;

        if ('json' == $format) {
            $this->layout = null;
            $this->view->set_filename('main/index_json');
        }
    }

    public function view($uuid)
    {
        $note = $this->note_model->find($uuid);

        header('ETag: ' . $note->etag);
        header('Last-Modified: ' . date('r', ($note->modified / 1000)) );

        if ('put' == request::method()) {
            $this->_updateNoteFromParams($note);
        } else if ('delete' == request::method()) {
            $note->delete(); 
            header('HTTP/1.0 410 Gone');
            exit;
        } else if ('head' == request::method()) {
            exit;
        }

        $this->view->note = $note;

        $format = $this->input->get('format', 'text');
        if ('json' == $format) {
            $this->layout = null;
            $this->view->set_filename('main/view_json');
        } else {
            $this->layout = null;
        }
    }

    public function editform($uuid)
    {
        $note = $this->note_model->find($uuid);
        if ('post' == request::method()) {
            $this->_updateNoteFromParams($note);
        }
        $this->view->note = $note;
    }

    public function deleteform($uuid)
    {
        $note = $this->note_model->find($uuid);
        if ('post' == request::method()) {
            $note->delete(); 
            return url::redirect('notes');
        }
        $this->view->note = $note;
    }

    public function _createNoteFromParams()
    {
        $params = $this->_getparams();

        $note = new Note_Model();
        $note->uuid = isset($params['uuid']) ? 
            $params['uuid'] : null;
        $note->name = isset($params['name']) ? 
            $params['name'] : 'Untitled';
        $note->text = isset($params['text']) ? 
            $params['text'] : 'Your notes go here.';
        $note->save();

        return $note;
    }

    public function _updateNoteFromParams($note)
    {
        $params = $this->_getparams();
        if (isset($params['name']))
            $note->name = $params['name'];
        if (isset($params['text']))
            $note->text = $params['text'];
        $note->save();
    }

    public function _getparams()
    {
        if (strpos($_SERVER['CONTENT_TYPE'], 
                'application/x-www-form-urlencoded')!==FALSE) {
            // Accept a standard form POST
            $params = $_POST;
        } else if ($_SERVER['CONTENT_LENGTH'] > 0) {
            // Accept JSON-encoded parameters
            $data = file_get_contents('php://input');
            $params = json_decode($data, true);
        } else {
            // Accept a standard form GET
            $params = $_GET;
        }

        if (!empty($params['uuid'])) {
            if (!preg_match('/^[0-9a-z\-]+$/', $params['uuid'])) {
                $params['uuid'] = null;
            }
        }

        return $params;
    }

}

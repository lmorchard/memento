<?php
/**
 * Main controller for the application
 * 
 * @package    Memento
 * @subpackage Models
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Main_Controller extends Layout_Controller
{
    protected $auto_render = TRUE;

    protected $known_types = array(
        'text/html', 'text/plain', 'application/json'
    );

    /**
     * Controller constructor, cross-method setup.
     */
    public function __construct()
    {
        parent::__construct();

        $this->note_model = new Note_Model();

        if ('post' == request::method()) {
            // If this is a POST request, check if it's another kind in 
            // disguise...
            if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
                // See also: http://code.google.com/apis/gdata/docs/2.0/basics.html
                $force_method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
            } else {
                // Thanks, Prototype.
                $force_method = $this->input->post('_method', 
                    $this->input->get('_method'));
            }
            if (!empty($force_method)) {
                $_SERVER['REQUEST_METHOD'] = strtoupper($force_method);
            }
        }

        Event::add('system.403', array($this, 'show_403'));
    }

    /**
     * In reaction to a 403 Forbidden event, throw up a forbidden view.
     */
    public function show_403()
    {
        header('403 Forbidden');
        $this->view = View::factory('forbidden');
        $this->_display();
        exit();
    }


    /**
     * Method for index resource.
     */ 
    public function index() 
    {
        $notes = $this->note_model->find_all();

        if ('post' == request::method()) {

            // Create a new note from POST to index
            $note = $this->_createNoteFromParams();
            switch (request::preferred_accept($this->known_types)) {
                case 'text/html': 
                    return url::redirect('notes/' . $note->uuid . ';edit');
                default:
                    header("HTTP/1.0 201 Created");
                    return url::redirect('notes/' . $note->uuid);
            }

        } else if ('delete' == request::method()) {

            // Delete all notes (if enabled, for testing) on DELETE to index.
            $this->note_model->delete_all(); 
            header('HTTP/1.0 410 Gone');
            exit;

        }

        // Display list of notes on GET.
        $this->view->notes = $notes;
        switch (request::preferred_accept($this->known_types)) {
            case 'application/json':
                $this->layout = null;
                $this->view->set_filename('main/index_json');
            default:
                break;
        }

    }

    /**
     * Method for single note view resource.
     */
    public function view($uuid)
    {
        $note = $this->note_model->find($uuid);

        if ('delete' == request::method()) {
            $note->delete(); 
            header('HTTP/1.0 410 Gone');
            exit;
        }

        if ('put' == request::method()) {
            $this->_updateNoteFromParams($note);
        } 

        header('ETag: ' . $note->etag);
        header('Last-Modified: ' . date('r', ($note->modified / 1000)) );

        if ('head' == request::method()) exit;

        $this->view->note = $note;

        switch (request::preferred_accept($this->known_types)) {
            case 'application/json':
                $this->layout = null;
                $this->view->set_filename('main/view_json');
                break;
            default:
                $this->layout = null;
                break;
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
        $params = $this->_getParams();

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

    public function _updateNoteFromParams(&$note)
    {
        $params = $this->_getParams();
        if (isset($params['name']))
            $note->name = $params['name'];
        if (isset($params['text']))
            $note->text = $params['text'];
        $note->save();
    }

    public function _getParams()
    {
        $params = $_GET;
        $ct = $_SERVER['CONTENT_TYPE'];
        if (strpos($ct, 'application/x-www-form-urlencoded')!==FALSE) {
            // Accept a standard form POST
            $params = $_POST;
        } else if (strpos($ct, 'application/json')!==FALSE) { 
            if ($_SERVER['CONTENT_LENGTH'] > 0) {
                // Accept JSON-encoded parameters
                $params = json_decode(file_get_contents('php://input'), true);
            }
        }

        if (!empty($params['uuid'])) {
            if (!preg_match('/^[0-9a-z\-]+$/', $params['uuid'])) {
                $params['uuid'] = null;
            }
        }

        return $params;
    }

}

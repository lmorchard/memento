<?php
/**
 * Main controller for the application
 * 
 * @package    Memento
 * @subpackage controllers
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Notes_Controller extends Rest_Controller
{
    // {{{ Object properties
    
    protected $auto_render = TRUE;
    
    // }}}

    /**
     * Controller constructor, cross-method setup.
     */
    public function __construct()
    {
        $this->note_model = new Note_Model();
        parent::__construct();
    }


    /**
     * Index resource setup for all HTTP methods
     */
    public function index_setup()
    {
    }

    /**
     * Accept a GET to the index resource to list all notes.
     */ 
    public function index_GET() 
    {
        // Display list of notes on GET.
        $this->notes = $this->note_model->find_all();
        $this->view->notes = $this->notes;
    }

    /**
     * Accept a POST to the index resource to create a new note.
     */
    public function index_POST()
    {
        // Create a new note from POST to index
        $params = $this->getRequestParameters();

        $note = new Note_Model();
        $note->uuid = isset($params['uuid']) ? 
            $params['uuid'] : null;
        $note->name = isset($params['name']) ? 
            $params['name'] : 'Untitled';
        $note->text = isset($params['text']) ? 
            $params['text'] : 'Your notes go here.';
        $note->save();

        header("HTTP/1.1 201 Created");
        switch ($this->preferredAccept()) {
            case 'text/html': 
                return url::redirect('notes/' . $note->uuid . ';edit');
            default:
                $href = url::base() . 'notes/' . $note->uuid;
                header("HTTP/1.1 201 Created");
                header("Location: {$href}");
                echo json_encode(array('href' => $href));
                exit;
        }
    }

    /**
     * Accept a DELETE to the index resource to delete all notes.
     */
    public function index_DELETE()
    {
        // Delete all notes (if enabled, for testing) on DELETE to index.
        if (Kohana::config('notes.enable_delete_all') !== true) {
            Event::run('system.403');
        } else {
            $this->note_model->delete_all(); 
            header('HTTP/1.1 410 Gone');
            exit;
        }
    }


    /**
     * View resource setup for all HTTP methods
     */
    public function view_setup($uuid) {
        $this->note = $this->note_model->find($uuid);
        if (!$this->note->loaded) {
            return Event::run('system.404');
        }
        header('ETag: ' . $this->note->etag);
        header('Last-Modified: ' . date('r', strtotime($this->note->modified)));
    }

    /**
     * Method for single note view resource.
     */
    public function view_GET($uuid)
    {
        $this->view->note = $this->note;
    }

    /**
     * Respond with just metadata for the note.
     */
    public function view_HEAD($uuid)
    {
        $this->auto_render = FALSE;
    }

    /**
     * Save details for a note.
     */
    public function view_PUT($uuid)
    {
        $params = $this->getRequestParameters();
        if (isset($params['name']))
            $this->note->name = $params['name'];
        if (isset($params['text']))
            $this->note->text = $params['text'];
        $this->note->save();

        switch ($this->preferredAccept()) {
            case 'text/html': 
                header('HTTP/1.0 200 OK');
                return url::redirect('notes/' . $this->note->uuid . ';edit');
            default:
                header('HTTP/1.0 204 No Content');
                exit;
        }
    }

    /**
     * Delete a note.
     */
    public function view_DELETE($uuid)
    {
        $this->note->delete(); 
        switch ($this->preferredAccept()) {
            case 'text/html': 
                return url::redirect('notes/');
            default:
                header('HTTP/1.0 410 Gone');
                exit;
        }
        $this->auto_render = FALSE;
    }


    /**
     * Display an edit form for a note.
     */
    public function editform_GET($uuid)
    {
        $this->view->note = $this->note_model->find($uuid);
    }

    /**
     * Display a delete form for a note.
     */
    public function deleteform_GET($uuid)
    {
        $this->view->note = $this->note_model->find($uuid);
    }
}

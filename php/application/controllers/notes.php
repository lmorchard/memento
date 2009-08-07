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
    public function index()
    {
        if ('post' == request::method()) return;

        $since = $this->input->get('since', null);
        $until = $this->input->get('until', null);
        
        $this->notes = $this->note_model
            ->find_modified_in_timerange($since, $until);

        $tombstones = $this->input->get('tombstones', null);
        if (null !== $tombstones) {
            $this->tombstones = ORM::factory('note_tombstone')
                ->find_modified_in_timerange($since, $until);
        }
    }

    /**
     * Accept a GET to the index resource to list all notes.
     */ 
    public function index_GET() 
    {
        $this->view->notes = $this->notes;
        if (!empty($this->tombstones))
            $this->view->tombstones = $this->tombstones;
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
            foreach ($this->notes as $note) {
                $note->delete();
            }
            if (!empty($this->tombstones)) {
                foreach ($this->tombstones as $tombstone) {
                    $tombstone->delete();
                }
            }
            header('HTTP/1.1 410 Gone');
            exit;
        }
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

        switch ($this->preferredAccept()) {
            case 'text/html': 
                return url::redirect('notes/' . $note->uuid . ';edit');
            case 'application/json':
                
                header("HTTP/1.1 201 Created");
                header('Content-Type: application/json');
                
                $href = url::base() . 'notes/' . $note->uuid;
                header("Location: {$href}");

                $this->view->note = $note;
                $this->view->set_filename('notes/view_json');
                
                return;
            default:
                header("HTTP/1.1 201 Created");
                $href = url::base() . 'notes/' . $note->uuid;
                header("Location: {$href}");
                exit;
        }
    }


    /**
     * View resource setup for all HTTP methods
     */
    public function view($uuid) {

        if (ctype_digit($uuid)) {
            // Disallow pure numeric UUIDs
            return Event::run('system.403');
        }

        $this->note = $this->note_model->find($uuid);

        if ('put' === request::method()) {
            if (!$this->note->loaded) {
                // Require an If-[None-]Match header on blind save.
                if (!$this->input->server('HTTP_IF_MATCH', null) &&
                        !$this->input->server('HTTP_IF_NONE_MATCH', null)) {
                    return Event::run('system.403');
                }

                // PUT request is allowed to blindly save an unknown note.
                $this->note = ORM::factory('note');
                $this->note->uuid = $uuid;
            }
        } else {
            if (!$this->note->loaded) {
                // All other methods throw an error.
                return Event::run('system.404');
            }
        }

        // TODO: Optimize model to look up just etag and modified using uuid.
        $etag = $this->note->loaded ? $this->note->etag() : null;
        $modified = date('r', strtotime($this->note->modified));

        header('ETag: ' .  $etag);
        header('Last-Modified: ' . $modified);

        $this->enforceConditionalHeaders($etag, $modified);
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

        header('ETag: ' . $this->note->etag());
        header('Last-Modified: ' . 
            date('r', strtotime($this->note->modified)));

        switch ($this->preferredAccept()) {
            case 'text/html': 
                header('HTTP/1.1 200 OK');
                return url::redirect('notes/' . $this->note->uuid . ';edit');
            case 'application/json':
                header("HTTP/1.1 200 OK");
                header('Content-Type: application/json');
                $this->view->note = $this->note;
                $this->view->set_filename('notes/view_json');
                return;
            default:
                header('HTTP/1.0 204 No Content');
                exit;
        }
    }


    /**
     * Display an edit form for a note.
     */
    public function editform($uuid)
    {
        $this->view->note = $this->note_model->find($uuid);
    }

    /**
     * Display a delete form for a note.
     */
    public function deleteform($uuid)
    {
        $this->view->note = $this->note_model->find($uuid);
    }
}

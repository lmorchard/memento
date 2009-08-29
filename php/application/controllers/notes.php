<?php
/**
 * Notes controller for the application
 * 
 * @package    Memento
 * @subpackage controllers
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Notes_Controller extends Local_Controller
{
    // {{{ Object properties
    
    protected $auto_render = TRUE;
    
    // }}}

    /**
     * Controller constructor, cross-method setup.
     */
    public function __construct()
    {
        parent::__construct();

        $this->note_model = new Note_Model();

        $this->route_params = $this->getRouteParams(array(
            'screen_name' => null,
            'uuid' => null,
        ));

        $this->profile = $this->view->profile = 
            ORM::factory('profile', $this->route_params['screen_name']);

        $this->own = ($this->profile->id == authprofiles::get_profile('id'));

        $this->view->set_global(array(
            'screen_name' => $this->route_params['screen_name'],
            'profile' => $this->profile
        ));

        $unauth_methods = array(/*'index', 'view', 'download', 'firstrun'*/);

        if (!authprofiles::is_logged_in()) {
            if (!in_array(Router::$method, $unauth_methods)) {
                Session::instance()->set_flash(
                    'message', 'Login required to manipulate repacks.'
                );
                return authprofiles::unauthorized();
            }
        }

    }

    /**
     * Index resource setup for all HTTP methods
     */
    public function index()
    {
        extract($this->route_params);

        if (!authprofiles::is_allowed('notes', 'view') &&
            !( $this->own && authprofiles::is_allowed('notes', 'view_own'))) {
            return Event::run('system.403');
        }

        if ('post' == request::method()) return;

        $since = $this->input->get('since', null);
        $until = $this->input->get('until', null);

        $this->notes = $this->note_model
            ->find_modified_in_timerange($this->profile->id, $since, $until);

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
        if (!authprofiles::is_allowed('notes', 'delete') &&
            !( $this->own && authprofiles::is_allowed('notes', 'delete_own'))) {
            return Event::run('system.403');
        }

        // Delete all notes (if enabled, for testing) on DELETE to index.
        if (Kohana::config('notes.enable_delete_all') !== true) {
            Event::run('system.403');
        } else {
            ORM::factory('note')->delete_all();
            ORM::factory('note_tombstone')->delete_all();
            header('HTTP/1.1 410 Gone');
            exit;
        }
    }

    /**
     * Accept a POST to the index resource to create a new note.
     */
    public function index_POST()
    {
        if (!authprofiles::is_allowed('notes', 'create') &&
            !( $this->own && authprofiles::is_allowed('notes', 'create_own'))) {
            return Event::run('system.403');
        }

        // Create a new note from POST to index
        $params = $this->getRequestParameters();

        $note = new Note_Model();
        $note->profile_id = $this->profile->id;
        $note->uuid = isset($params['uuid']) ? 
            $params['uuid'] : uuid::uuid();
        $note->name = isset($params['name']) ? 
            $params['name'] : 'Untitled';
        $note->text = isset($params['text']) ? 
            $params['text'] : 'Your notes go here.';
        $note->save();

        $href = url::base() . 'profiles/' .  $this->profile->screen_name .
            '/notes/' . $note->uuid;

        switch ($this->preferredAccept()) {

            case 'text/html': 
                return url::redirect($href . ';edit');
            
            case 'application/json':
                
                header("HTTP/1.1 201 Created");
                header('Content-Type: application/json');
                
                header("Location: {$href}");

                $this->view->note = $note;
                $this->view->set_filename('notes/view_json');
                
                return;
            
            default:
                header("HTTP/1.1 201 Created");
                $href = url::base() . 'profiles/' . $this->profile->screen_name . 
                    '/notes/' . $note->uuid;
                header("Location: {$href}");
                exit;

        }
    }


    /**
     * View resource setup for all HTTP methods
     */
    public function view() {
        extract($this->route_params);

        if (!authprofiles::is_allowed('notes', 'view') &&
            !( $this->own && authprofiles::is_allowed('notes', 'view_own'))) {
            return Event::run('system.403');
        }

        if (ctype_digit($uuid)) {
            // Disallow pure numeric UUIDs
            return Event::run('system.403');
        }

        $this->note = $this->note_model->find($uuid);

        if ('put' === request::method()) {
            if (!$this->note->loaded) {
                // Require an If-[None-]Match header on blind save.
                /*
                if (!$this->input->server('HTTP_IF_MATCH', null) &&
                        !$this->input->server('HTTP_IF_NONE_MATCH', null)) {
                    return Event::run('system.403');
                        }
                */

                // PUT request is allowed to blindly save an unknown note.
                $this->note = ORM::factory('note');
                $this->note->profile_id = $this->profile->id;
                $this->note->uuid = strtolower($uuid);
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
    public function view_GET()
    {
        $this->view->note = $this->note;
    }

    /**
     * Respond with just metadata for the note.
     */
    public function view_HEAD()
    {
        $this->auto_render = FALSE;
    }

    /**
     * Delete a note.
     */
    public function view_DELETE()
    {
        extract($this->route_params);

        if (!authprofiles::is_allowed('notes', 'delete') &&
            !( $this->own && authprofiles::is_allowed('notes', 'delete_own'))) {
            return Event::run('system.403');
        }

        $this->note->delete(); 
        switch ($this->preferredAccept()) {
            case 'text/html': 
                return url::redirect(
                    'profiles/' .  $this->profile->screen_name . '/notes/'
                );
            default:
                header('HTTP/1.0 410 Gone');
                exit;
        }
        $this->auto_render = FALSE;
    }

    /**
     * Save details for a note.
     */
    public function view_PUT()
    {
        if (!authprofiles::is_allowed('notes', 'edit') &&
            !( $this->own && authprofiles::is_allowed('notes', 'edit_own'))) {
            return Event::run('system.403');
        }

        $params = $this->getRequestParameters();

        if (isset($params['name'])) {
            $this->note->name = $params['name'];
        }
        if (isset($params['text'])) {
            $this->note->text = $params['text'];
        }
        if (isset($params['created'])) {
            $this->note->created = ('true' == $params['created']) ? 
                gmdate('c') : $params['created']; 
        }
        if (isset($params['modified'])) {
            $this->note->modified = ('true' == $params['modified']) ? 
                gmdate('c') : $params['modified']; 
        }
        $this->note->save();

        header('ETag: ' . $this->note->etag());
        header('Last-Modified: ' . 
            date('r', strtotime($this->note->modified)));

        switch ($this->preferredAccept()) {

            case 'text/html': 
                header('HTTP/1.1 200 OK');
                return url::redirect('profiles/'.$this->profile->screen_name.
                    '/notes/'.$this->note->uuid.';edit');
            
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
    public function editform()
    {
        extract($this->route_params);
        if (!authprofiles::is_allowed('notes', 'edit') &&
            !( $this->own && authprofiles::is_allowed('notes', 'edit_own'))) {
            return Event::run('system.403');
        }

        $this->view->note = $this->note_model->find($uuid);
    }

    /**
     * Display a delete form for a note.
     */
    public function deleteform()
    {
        extract($this->route_params);
        if (!authprofiles::is_allowed('notes', 'delete') &&
            !( $this->own && authprofiles::is_allowed('notes', 'delete_own'))) {
            return Event::run('system.403');
        }

        $this->view->note = $this->note_model->find($uuid);
    }
}

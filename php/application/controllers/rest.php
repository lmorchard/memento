<?php
/**
 * Base REST controller
 *
 * @package    Memento
 * @subpackage controllers
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Rest_Controller extends Controller
{
    // {{{ Object properties
    
    // Wrapper layout for current view
    public $layout = NULL;

    // Wrapped view for current method
    public $view = NULL;

    // Automatically render the layout?
    protected $auto_render = FALSE;

    public static $original_controller_method = null;

    public static $original_http_method = null;

    public $http_methods = array(
        'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS',
    );

    public $content_types = array(
        'text/html'        => 'html',
        'text/xml'         => 'xml',
        'text/plain'       => 'txt',
        'application/json' => 'json'
    );

    // }}}

    /**
     * Constructor, set the controller up for responses
     */
    public function __construct()
    {
        parent::__construct();

        $this->layout = View::factory();
        $this->view   = View::factory();

        $this->fixupRequestMethod();
        $this->fixupControllerMethod();

        Event::add('system.403', array($this, 'show_403'));
        Event::add('system.post_controller', array($this, 'renderView'));
    }

    /**
     * In reaction to a 403 Forbidden event, throw up a forbidden view.
     */
    protected function show_403()
    {
        header('HTTP/1.1 403 Forbidden');
        $this->view = View::factory('forbidden');
        $this->_display();
        exit();
    }

    /**
     * Accept X-HTTP-Method-Override header or POST _method parameter for 
     * specifying an alternate HTTP method.
     */
    protected function fixupRequestMethod()
    {
        self::$original_http_method = request::method();
        if ('post' == request::method()) {
            $method = null;
            if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
                // If this is a POST, check if it's another in disguise...
                // See also: http://code.google.com/apis/gdata/docs/2.0/basics.html
                $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
            } else if (!empty($_POST['_method'])) {
                // Otherwise, check for the _method parameter, ala Prototype
                $method = strtoupper($_POST['_method']);
            } else if (!empty($_GET['_method'])) {
                // Otherwise, check for the _method parameter, ala Prototype
                $method = strtoupper($_GET['_method']);
            }
            if (!empty($method)) $_SERVER['REQUEST_METHOD'] = $method;
        }
    }

    /**
     * Reroute controller method to one named based on the incoming HTTP 
     * method, if such exists. (eg. index_GET, index_POST, etc)
     */
    protected function fixupControllerMethod()
    {
        $ro = new ReflectionObject($this);

        // Stash the original routed method.
        self::$original_controller_method = $orig_method = Router::$method;

        // Figure out the HTTP method.
        $http_method = strtoupper(request::method());
        if ('OPTIONS' === $http_method) {
            // If the method is OPTIONS, reflect on what HTTP methods have
            // corresponding controller methods.
            $allowed_methods = array();
            foreach ($this->http_methods as $http_method) {
                if ($ro->hasMethod("{$orig_method}_{$http_method}")) {
                    $allowed_methods[] = $http_method;
                }
            }
            header("Allow: " . join(', ', $allowed_methods));
            exit;
        }

        // If it exists, reroute based on HTTP method
        $new_method  = $orig_method . '_' . $http_method;
        if (method_exists($this, $new_method)) {
            Router::$method = $new_method;
        } else {
            header("HTTP/1.1 405 Method Not Allowed");
            exit;
        }

        // If it exists, call a common setup method based on the original name.
        $setup_method = $orig_method;
        if ($ro->hasMethod($setup_method)) {
            $ro->getMethod($setup_method)->invokeArgs($this, Router::$arguments);
        }
    }

    /**
     * Although $this->input, $_GET, and $_POST are all available, this method 
     * also supports getting parameters from an application/json type request 
     * body.
     *
     * @todo Move to an Input subclass, eg. $this->input->params()?
     *
     * @return array
     */
    protected function getRequestParameters()
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

        return $params;
    }

    /**
     * Enforce If-{None-}Match / If-{Un}Modified-Since headers.
     * 304 Not Modified status sent on GET method, 
     * 412 Precondition Failed on everything else.
     *
     * @param string ETag value
     * @param string Modified date
     */
    protected function enforceConditionalHeaders($etag, $modified)
    {
        $cond = TRUE;
        
        if (isset($_SERVER['HTTP_IF_MATCH'])) {
            // See also: http://www.w3.org/1999/04/Editing/
            Kohana::log('debug', "IF MATCH");
            $match_etag = $_SERVER['HTTP_IF_MATCH'];
            if ('*' != $match_etag && $match_etag != $etag) $cond = FALSE;
        }

        if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
            // See also: http://www.w3.org/1999/04/Editing/
            $match_etag = $_SERVER['HTTP_IF_NONE_MATCH'];
            if ('*' == $match_etag || $match_etag == $etag) $cond = FALSE;
        }

        $modified = strtotime($modified);

        if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            $match_date = $_SERVER['HTTP_IF_MODIFIED_SINCE'];
            if ($modified > $match_date) $cond = FALSE;
        }

        if (isset($_SERVER['HTTP_IF_UNMODIFIED_SINCE'])) {
            $match_date = $_SERVER['HTTP_IF_UNMODIFIED_SINCE'];
            if ($modified < $match_date) $cond = FALSE;
        }

        if (!$cond) {
            if ('get' == request::method()) {
                header('HTTP/1.1 304 Not Modified');
            } else {
                header('HTTP/1.1 412 Precondition Failed');
            }
            exit;
        }

    }

    /**
     * Given the known content types, return the preferred type based on the 
     * Accept: header.
     *
     * @return string
     */
    protected function preferredAccept()
    {
        return request::preferred_accept(array_keys($this->content_types));
    }

    /**
     * Attempt to negotiate the name of a view based on prefix and content type 
     * name, based on Accept: header and _accept parameter.
     */
    protected function negotiateView($prefix)
    {
        $mime_types = array();

        // HACK: If _accept parameter appears in GET or POST params, use that 
        // type as the highest priority - higher than any allowed in spec.
        if (isset($_GET['_accept']))
            $mime_types[$_GET['_accept']] = 2.0;
        if (isset($_POST['_accept']))
            $mime_types[$_POST['_accept']] = 3.0;

        // Collect all client-acceptable content types and sort in descending 
        // order of preference.
        foreach (array_unique(array_keys($this->content_types)) as $type) {
            if (!isset($mime_types[$type])) {
                $mime_types[$type] = request::accepts_at_quality($type);
            }
        }
        arsort($mime_types);

        // Run down the preferred list and try to find a suitable view.
        foreach ($mime_types as $type=>$q) {
            if (0===$q || !isset($this->content_types[$type])) continue;
            $name = $this->content_types[$type];
            $proposed = "{$prefix}_{$name}";
            if (Kohana::find_file('views', $proposed)) {
                return $proposed;
            }
        }

        // If all else fails, respond with an error.
        header('HTTP/1.1 406 Not Acceptable'); 
        exit;
    }

    /**
     * Render a template wrapped in the global layout.
     */
    protected function renderView()
    {
        if (TRUE === $this->auto_render) {

            Event::run('REST_Controller.before_auto_render', $this);

            if ($this->layout && !$this->layout->get_filename()) {
                $name = $this->negotiateView('layout');
                if (!empty($name)) {
                    $this->layout->set_filename($name);
                } else {
                    $this->layout = null;
                }
            } 

            if ($this->view && !$this->view->get_filename()) {
                $name = $this->negotiateView(
                    Router::$controller . '/' . 
                    self::$original_controller_method
                );
                if (!empty($name)) {
                    $this->view->set_filename($name);
                } else {
                    $this->view = null;
                }
            } 

            $content = (!empty($this->view)) ?
                $this->view->render() : '';
            $content = (!empty($this->layout)) ?
                $this->layout->set('content', $content)->render() : $content;
            echo $content;

            Event::run('REST_Controller.auto_rendered', $this);

        }
    }

}

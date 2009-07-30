<?php
/**
 * Local controller base class for all application controllers.
 */
class Local_Controller extends Layout_Controller
{

    public function __construct()
    {
        parent::__construct();

        // Handle the _method parameter from AJAX calls to tweak HTTP method.
        $force_method = $this->input->post('_method');
        if (!empty($force_method)) {
            $_SERVER['REQUEST_METHOD'] = strtoupper($force_method);
            Kohana::log('debug', 'Forced HTTP method ' . $force_method);
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

}

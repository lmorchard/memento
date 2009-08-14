<?php
/**
 * Base controller for auth_profiles, replaceable in application.
 *
 * @package    auth_profiles
 * @subpackage controllers
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 */
class Local_Controller extends Layout_Controller
{
    /**
     * Controller constructor, cross-method setup.
     */
    public function __construct() 
    {
        parent::__construct();
        
        // Accept HTTP Basic Auth for login, if enabled
        if (Kohana::config('auth_profiles.enable_basic_auth') &&
                !empty($_SERVER['PHP_AUTH_USER']) && 
                !empty($_SERVER['PHP_AUTH_PW'])) {
            $login_model = ORM::factory('login');
            $data = array(
                'login_name' => $_SERVER['PHP_AUTH_USER'],
                'password'   => $_SERVER['PHP_AUTH_PW']
            );
            if ($login_model->validate_login($data)) {
                $login = $login_model->find($data['login_name']);
                $profile = $login->find_default_profile_for_login();
                $login->login($data);
                authprofiles::login($login->login_name, $login, $profile, FALSE);
            }
        }
    }
}

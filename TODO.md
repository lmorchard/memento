## App-specific

* make table creation check happen once per app launch
* no sync on empty note
* sync since with tombstones for deletes.
* compare etags as well as dates during sync
** difference triggers an overwrite / copy dialog
* oauth on web api
* display notifications on all sync events
* make sync event driven and observable (eg item-by-item, conflict, changes, etc)

* access control - public, private, shared
* markdown preview pane
* auth / privs on web UI
* atompub?
* font size on zoom/shrink
* accellerometer rotation
* tagging
* geotagging + geo search / reminders
* note urls with name rather than uuid
* remember date/alpha sort in prefs cookie

## General

* extract Rest_Controller into module
* rework View class to allow Django-like inheritance?

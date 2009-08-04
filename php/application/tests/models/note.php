<?php
/**
 * Test class for Note_Model
 * 
 * @package    memento
 * @subpackage tests
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 * @group      memento
 * @group      models
 * @group      models.memento
 * @group      models.memento.note
 */
class Note_Test extends PHPUnit_Framework_TestCase 
{

    /**
     * This method is called before a test is executed.
     *
     * @return void
     */
    public function setUp()
    {
        LMO_Utils_EnvConfig::apply('tests');

        $this->note_model = 
            ORM::factory('note')->delete_all();
        $this->note_tombstone_model = 
            ORM::factory('note_tombstone')->delete_all();

        $this->test_data = array(
            array(
                'name' => 'Alpha',
                'text' => 'This is note alpha',
            ),
            array(
                'name' => 'Beta',
                'text' => 'This is note beta',
            ),
            array(
                'name' => 'Delta',
                'text' => 'This is note delta',
            ),
            array(
                'name' => 'Gamma',
                'text' => 'This is note delta',
            ),
        );
    }

    /**
     * Create notes and ensure that UUIDs and dates are set.
     */
    public function testCreate() 
    {
        // Save the notes and examine the object returned.
        $seen_uuids = array();
        foreach ($this->test_data as $data) {
            $note = ORM::factory('note')->set($data)->save();

            // Unique UUIDs must be set on save.
            $this->assertTrue(!empty($note->uuid), 
                'There must be a UUID set');
            $this->assertTrue(!isset($seen_uuids[$note->uuid]),
                'The UUID must be unique.');
            $seen_uuids[$note->uuid] = 1;

            // There must be a created / modified date.
            $this->assertTrue(!empty($note->created));
            $this->assertTrue(!empty($note->modified));

        }

        // Find the saved notes and examine them.
        $seen_uuids = array();
        $saved_notes = $this->note_model->find_all();
        foreach ($saved_notes as $idx=>$note) {

            // Unique UUIDs must be set on save.
            $this->assertTrue(!empty($note->uuid));
            $this->assertTrue(!isset($seen_uuids[$note->uuid]));
            $seen_uuids[$note->uuid] = 1;

            // There must be a created / modified date.
            $this->assertTrue(!empty($note->created));
            $this->assertTrue(!empty($note->modified));

        }
    }

    /**
     * Create and delete notes, ensure the notes are gone and tombstones are 
     * left behind.
     */
    public function testDeleteAndTombstones()
    {

        // Create the notes.
        foreach ($this->test_data as $data) {
            $note = ORM::factory('note')->set($data)->save();
        }

        // Delete the notes, while retaining the UUIDs.
        $uuids = array();
        $notes = ORM::factory('note')->find_all();
        foreach ($notes as $note) {
            $uuids[] = $note->uuid;
            $note->delete();
        }

        // Ensure the notes are gone, but tombstones remain.
        foreach ($uuids as $uuid) {
            $note = ORM::factory('note', $uuid);
            $this->assertTrue(!$note->loaded,
                'The deleted note should not be found.');
            $ts = ORM::factory('note_tombstone', $uuid);
            $this->assertTrue($ts->loaded,
                'There must be a tombstone for a deleted note.');
        }

    }

}

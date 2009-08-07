<?php
/**
 * Test class for Notes_Controller
 * 
 * @package    memento
 * @subpackage tests
 * @author     l.m.orchard <l.m.orchard@pobox.com>
 * @group      memento
 * @group      controllers
 * @group      controllers.memento
 * @group      controllers.memento.notes
 */
class Notes_Controller_Test extends PHPUnit_Framework_TestCase 
{

    /**
     * This method is called before a test is executed.
     *
     * @return void
     */
    public function setUp()
    {
        LMO_Utils_EnvConfig::apply('tests');

        $this->base_url = Kohana::config('tests.base_url');

        // Make sure all notes and tombstones are gone.
        $this->request('/', 'DELETE');
        $this->request('/?tombstones', 'DELETE');

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
     * Create notes and assert their existence and data.
     */
    public function testCreate()
    {
        $indexed_notes = array();
        $seen_uuids    = array();

        foreach ($this->test_data as $data) {

            $resp = $this->request('/', 'POST', $data);

            $this->assertEquals($resp['status'], 201, 
                'Status should be 201 Created');
            $this->assertTrue(
                isset($resp['headers']['location']),
                'Response should supply a Location: header'
            );

            $resp = $this->request($resp['headers']['location']);
            $note = $resp['body'];
            $this->assertTrue(!empty($note['uuid']), 
                'There must be a UUID set');
            $this->assertTrue(!isset($seen_uuids[$note['uuid']]),
                'The UUID must be unique.');

            $seen_uuids[$note['uuid']] = 1;
            $indexed_notes[$note['uuid']] = $data;

            // There must be a created / modified date.
            $this->assertTrue(!empty($note['created']));
            $this->assertTrue(!empty($note['modified']));

        }

        $resp = $this->request('/');
        $this->assertEquals($resp['status'], 200, 
            'Status should be 200 OK');

        $saved_notes = $resp['body'];
        $this->assertEquals(
            count($saved_notes), count($this->test_data),
            'List of notes should equal test data length'
        );

        // Find the saved notes and examine them.
        $seen_uuids = array();
        foreach ($saved_notes as $idx=>$note_meta) {

            $resp = $this->request("/{$note_meta['href']}");
            $this->assertEquals($resp['status'], 200, 
                'Status should be 200 OK');

            $note = $resp['body'];

            // Unique UUIDs must be set on save.
            $this->assertTrue(!empty($note['uuid']));
            $this->assertTrue(!isset($seen_uuids[$note['uuid']]));
            $seen_uuids[$note['uuid']] = 1;

            // There must be a created / modified date.
            $this->assertTrue(!empty($note['created']));
            $this->assertTrue(!empty($note['modified']));

            $expected_note = $indexed_notes[$note['uuid']];
            $this->assertEquals($note['name'], $expected_note['name'],
                'Fetched note should match test data name');
            $this->assertEquals($note['text'], $expected_note['text'],
                'Fetched note should match test data text');

        }
        
    }

    /**
     * Create and delete notes, ensure the notes are gone and tombstones are 
     * left behind.
     */
    public function testDeleteAndTombstones()
    {
        $indexed_notes = array();

        // Create a set of notes.
        foreach ($this->test_data as $data) {
            $resp = $this->request('/', 'POST', $data);
            $href = $resp['headers']['location'];
            $resp = $this->request("{$href}");
            $indexed_notes[$href] = $resp['body'];
        }

        // Assert that the notes have been created, insofar as the count 
        // matches.
        $resp = $this->request('/');
        $this->assertEquals(200, $resp['status'], 'Status should be 200 OK');

        $saved_notes = $resp['body'];
        $this->assertEquals(
            count($saved_notes), count($this->test_data),
            'List of notes should equal test data length'
        );

        // Assert that the notes exist, insofar as they are found by href.
        foreach ($indexed_notes as $href => $data) {
            $resp = $this->request("{$href}");
            $this->assertEquals(200, $resp['status'],
                'Status should be 200 OK');
        }

        // Delete the known notes, asserting that they're no longer found.
        $expected_tombstones = array();
        foreach ($indexed_notes as $href => $data) {

            // Delete the note.
            $resp = $this->request("{$href}", 'DELETE');
            $this->assertEquals($resp['status'], 410, 
                'Status should be 410 Gone');

            // Assert it's no longer found.
            $resp = $this->request("{$href}");
            $this->assertEquals($resp['status'], 404, 
                'Status should be 404 OK');

            // Note this note's UUID as an expected tombstone.
            $expected_tombstones[] = $data['uuid'];

            // Collect tombstone UUIDs reported by server.
            $resp = $this->request('/?tombstones');
            $result_tombstones = array();
            foreach ($resp['body'] as $note) {
                if (isset($note['tombstone']) && $note['tombstone'])
                    $result_tombstones[] = $note['uuid'];
            }

            // Sort the UUIDs, since order isn't important.
            sort($result_tombstones);
            sort($expected_tombstones);

            // Assert that the deleted note appears among reported tombstones.
            $this->assertEquals(
                $expected_tombstones, $result_tombstones,
                'Expected and result tombstone UUIDs should match'
            );

        }

    }

    /**
     * Exercise scenarios of detecting lost updates in unreserved checkouts,
     * as described here: http://www.w3.org/1999/04/Editing/
     */
    public function testPutAndEtags()
    {
        // Save a new note, retain the resulting Location:
        $resp = $this->request('/', 'POST', array(
            'name' => 'Original note',
            'text' => 'This is the text of the original note',
        ));
        $orig_href = $resp['headers']['location'];

        // Grab the new note, retain its ETag.
        $resp = $this->request($orig_href);
        $orig_note = $resp['body'];
        $orig_etag = $resp['headers']['etag'];

        // Update the note, assert the original ETag in If-Match and retain
        // the changed ETag.
        $resp = $this->request($orig_href, 'PUT', 
            array(
                'name' => 'Changed note',
                'text' => 'This is a changed note',
            ),
            array('If-Match' => $orig_etag)
        );
        $this->assertEquals(200, $resp['status'],
            'Status should be 200 OK');
        $changed_etag = $resp['headers']['etag'];

        // Now, pretend we're a second editor trying to save not knowing 
        // someone else already has.  Using the original ETag in If-Match 
        // should cause this to fail.
        $resp = $this->request($orig_href, 'PUT', 
            array(
                'name' => 'Further changed note',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-Match' => $orig_etag)
        );
        $changed_etag_2 = $resp['headers']['etag'];
        $this->assertEquals(412, $resp['status'],
            'Status should be 412 Precondition Failed');

        // For good measure, compare the ETags seen so far.
        $this->assertNotEquals($orig_etag, $changed_etag_2,
            'The original and etag reported on failure should not match');
        $this->assertEquals($changed_etag, $changed_etag_2,
            'The changed etags should no match');

        // Also assert that an If-None-Match: * will fail with an existing 
        // note.  This would be the case of a blind save encountering a
        // resource URL that already exists.
        $resp = $this->request($orig_href, 'PUT', 
            array(
                'name' => 'Even further changed note',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-None-Match' => '*')
        );
        $this->assertEquals(412, $resp['status'],
            'Status should be 412 Precondition Failed');

        // Assert that an If-Match with the changed etag will succeed.  
        // This indicates that the document has not changed out from 
        // under the editor since it was fetched (the second time).
        $resp = $this->request($orig_href, 'PUT', 
            array(
                'name' => 'Even further changed note',
                'text' => 'This should be a success',
            ),
            array('If-Match' => $changed_etag)
        );
        $changed_etag_3 = $resp['headers']['etag'];
        $this->assertEquals(200, $resp['status'],
            'Status should be 200 OK');

        // Oh yeah, and what if we don't care, and just want to clobber any 
        // existing document?  Try If-Match: *
        $resp = $this->request($orig_href, 'PUT', 
            array(
                'name' => 'I am a rude overwrite',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-Match' => '*')
        );
        $changed_etag_3 = $resp['headers']['etag'];
        $this->assertEquals(200, $resp['status'],
            'Status should be 200 OK');

        // As a safety measure, this API disallows blind saves without
        // If-None-Match: *
        $resp = $this->request('/notes/8675309-jenny', 'PUT', 
            array(
                'name' => 'I am a rude overwrite',
                'text' => 'This should be a failed edit attempt',
            )
        );
        $this->assertEquals(403, $resp['status'],
            'Blind PUT to a non-existent document should fail');

        // On the other hand, what if we only want to overwrite an existing 
        // document, yet fail otherwise.  Try If-Match: * again, but on an
        // unknown URL.
        $resp = $this->request('/notes/8675309-jenny', 'PUT', 
            array(
                'name' => 'I am a rude overwrite',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-Match' => '*')
        );
        $this->assertEquals(412, $resp['status'],
            'If-Match: * PUT to a non-existent document should fail');

        // Allow a blind write to a non-existent URL, with If-None-Match: *
        $resp = $this->request('/notes/8675309-jenny', 'PUT', 
            array(
                'name' => 'I am a rude overwrite',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-None-Match' => '*')
        );
        $this->assertEquals(200, $resp['status'],
            'Status should be 200 OK');

        // Now that it exists, disallow a blind write to a non-existent URL, 
        // with If-None-Match: *
        $resp = $this->request('/notes/8675309-jenny', 'PUT', 
            array(
                'name' => 'I am a rude overwrite',
                'text' => 'This should be a failed edit attempt',
            ),
            array('If-None-Match' => '*')
        );
        $this->assertEquals(412, $resp['status'],
            'If-None-Match: * PUT to a existent document should fail');

    }


    /**
     * Perform an HTTP request, biased toward JSON request and response bodies.
     *
     * @param string       URL path from base
     * @param string       HTTP method (default GET)
     * @param string|array Request body, sent as JSON if not string
     * @param array        HTTP headers
     */
    protected function request($path, $method='GET', $body=null, $headers=null)
    {
        if (substr($path, 0, 1) == '/') {
            $url = $this->base_url.$path;
        } else {
            $url = $path;
        }

        $headers = array_merge(
            array( 
                'X-Environment-Override' => 'tests',
                'Accept' => 'application/json',
            ),
            ($headers) ? $headers : array()
        );

        $ch = curl_init();

        $opts = array(
            CURLOPT_URL            => $url,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_CUSTOMREQUEST  => $method,
        );

        $nobody_methods = array('GET', 'DELETE', 'HEAD');
        if (null !== $body && !in_array($method, $nobody_methods)) {
            if (is_array($body)) {
                $headers['Content-Type'] = 'application/json';
                $body = json_encode($body);
            }
            $opts[CURLOPT_POSTFIELDS] = $body;
        }

        $curl_headers = array();
        foreach ($headers as $name=>$val) {
            $curl_headers[] = "{$name}: {$val}";
        }
        $opts[CURLOPT_HTTPHEADER] = $curl_headers;

        curl_setopt_array($ch, $opts);

        $response_text = curl_exec($ch);
        
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $header_text = substr($response_text, 0, $header_size);
        $headers = $this->parse_http_headers($header_text);

        $body = substr($response_text, $header_size);
        if (isset($headers['content-type']) && 
                strpos($headers['content-type'], 'application/json') !== FALSE) {
            $body = json_decode($body, true);
        }
        curl_close($ch);

        return array(
            'status'  => $status, 
            'headers' => $headers, 
            'body'    => $body
        );
    }

    /**
     * See: http://us.php.net/manual/en/function.curl-exec.php#79907
     */
    protected function parse_http_headers($rawheaders)
    {
        $lines = explode("\n", $rawheaders);
        if (empty($lines)) return array();

        if(substr($lines[0],0,5) == 'HTTP/') {
            $response = array_shift($lines);
        }
        foreach($lines as $line) {
            $matches = array();
            preg_match("/^(.+?):\s+(.+)$/",trim($line),$matches);
            if (!empty($matches)) $headers[strtolower($matches[1])] = $matches[2];
        }
        return $headers;
    }
    

}

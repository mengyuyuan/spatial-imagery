"""Regression tests for the pixel-workflow failure, with synthetic approval fixtures only."""
import copy,json,sys,unittest
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'templates'/'production'))
import production_gates_test as fixtures
from verify_production_gates import digest_file,validate
from pipeline_entry import check


class EntryTests(unittest.TestCase):
    def setUp(self):
        self.fixture=fixtures.ProductionGateTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root=self.fixture.root
        self.data=self.fixture.data
        self.data['execution'].update(designSource='design.txt',parameterSources=['source.txt'])
        self.active={'version':1,'manifest':'gates.json','entryPoint':{'path':'source.txt','sha256':digest_file(self.root/'source.txt')},'designSource':{'path':'design.txt','sha256':digest_file(self.root/'design.txt')},'scope':[0,180],'fps':30,'width':640,'height':360}
        self.save()

    def save(self):
        self.fixture.sign()
        (self.root/'gates.json').write_text(json.dumps(self.data),encoding='utf8')
        (self.root/'pipeline-active.json').write_text(json.dumps(self.active),encoding='utf8')

    def run_check(self,mode='delivery',output='outputs/final.mp4',entry='source.txt',scope=None,media='media.fixture'):
        return check(self.root,mode,entry,'design.txt',output,scope or [0,180],media)

    def spatial_request(self):
        r=self.data['requirementContract']['requirements'][0]
        r.update(kind='spatial',quote='Show the object transforming in three dimensions',allowedDimensions=['3d'])
        for m in r['fulfillments']:
            m.update(dimension='3d',subject='EL01',depthCue='An opening hinge reveals thickness and occlusion',channels=['layers.EL01.x'],depthChannels=['layers.EL01.x'],implementation=['source.txt:1'])

    def test_normal_2d_delivery_is_allowed(self):
        r=self.run_check();self.assertTrue(r['allowed'],r);self.assertTrue(r['completed'])

    def test_unreviewed_current_draft_allowed_but_never_completed(self):
        self.data['sequenceReview']['status']='unverified'
        self.data['filmDesignReview']['status']='unverified'
        self.save()
        r=self.run_check('draft','qa/pipeline-review/test.mp4')
        self.assertTrue(r['allowed'],r);self.assertFalse(r['completed']);self.assertFalse(r['gateEligible'])

    def test_draft_cannot_enter_delivery_directory_or_escape_via_dotdot(self):
        for path in ['outputs/complete-review.mp4','qa/pipeline-review/../../outputs/a.mp4']:
            r=self.run_check('draft',path);self.assertFalse(r['allowed']);self.assertIn('draft_destination',{e['code'] for e in r['errors']})

    def test_old_frame_axis_is_rejected(self):
        self.active['scope']=[0,4499];self.save()
        r=self.run_check(scope=[0,4499]);self.assertFalse(r['allowed']);self.assertIn('active_format',{e['code'] for e in r['errors']})

    def test_modified_source_invalidates_even_signed_old_reviews(self):
        (self.root/'source.txt').write_text('changed renderer',encoding='utf8')
        r=self.run_check();self.assertFalse(r['allowed']);self.assertIn('active_identity',{e['code'] for e in r['errors']})

    def test_different_entry_cannot_use_old_manifest(self):
        (self.root/'other.tsx').write_text('new composition',encoding='utf8')
        self.assertFalse(self.run_check(entry='other.tsx')['allowed'])

    def test_unregistered_final_file_is_rejected(self):
        (self.root/'other.mp4').write_bytes(b'different encoding')
        r=self.run_check(media='other.mp4');self.assertFalse(r['allowed']);self.assertIn('delivery_identity',{e['code'] for e in r['errors']})

    def test_unverified_review_blocks_final_render_and_delivery(self):
        self.data['soundReview']['status']='unverified';self.save()
        for mode in ['full-render','delivery']:self.assertFalse(self.run_check(mode)['allowed'])

    def test_explicit_3d_cannot_be_satisfied_by_2_5d_renderer(self):
        self.spatial_request();self.save()
        codes={e['code'] for e in validate(self.data,self.root,'design')['errors']}
        self.assertIn('requirement_renderer',codes)

    def test_explicit_3d_cannot_be_relabeled_2_5d(self):
        self.spatial_request()
        self.data['requirementContract']['requirements'][0]['fulfillments'][0]['dimension']='2.5d'
        self.assertIn('requirement_dimension',{e['code'] for e in validate(self.data,self.root,'design')['errors']})

    def test_presenter_playback_is_not_spatial_motion(self):
        self.spatial_request()
        self.data['execution']['renderer']='custom'
        for s in self.data['shots']:s['motionBinding'].update(subject='PRESENTER',channels=['layers.PRESENTER.sourceTime'])
        for m in self.data['requirementContract']['requirements'][0]['fulfillments']:m['channels']=['layers.PRESENTER.sourceTime']
        codes={e['code'] for e in validate(self.data,self.root,'design')['errors']}
        self.assertIn('requirement_playback_substitution',codes);self.assertIn('requirement_subject',codes)

    def test_changed_requirement_invalidates_previous_reviews(self):
        self.data['requirementContract']['requirements'][0]['acceptance']='Different actual requirement'
        self.assertIn('stale_review',{e['code'] for e in validate(self.data,self.root,'delivery')['errors']})

    def test_measured_required_3d_channel_can_pass(self):
        self.spatial_request()
        for s in self.data['shots']:s['motionBinding']['channels']=['layers.EL01.rotateY','layers.EL01.sourceTime']
        for m in self.data['requirementContract']['requirements'][0]['fulfillments']:
            m['channels']=m['depthChannels']=['layers.EL01.rotateY']
        self.fixture.custom_measurements()
        self.assertEqual(self.fixture.codes(),set())

    def test_moving_playback_cannot_hide_a_frozen_required_3d_channel(self):
        self.spatial_request()
        for s in self.data['shots']:s['motionBinding']['channels']=['layers.EL01.rotateY','layers.EL01.sourceTime']
        for m in self.data['requirementContract']['requirements'][0]['fulfillments']:
            m['channels']=m['depthChannels']=['layers.EL01.rotateY']
        doc=self.fixture.custom_measurements()
        for frame in doc['targets']['SH1']['frames']:frame['values']['layers.EL01.rotateY']=0
        self.fixture.save_measurements(doc)
        self.assertIn('requirement_actual_motion',self.fixture.codes())

    def test_missing_contract_is_not_silently_migrated(self):
        del self.data['requirementContract']
        self.assertIn('requirement_contract',{e['code'] for e in validate(self.data,self.root,'design')['errors']})


if __name__=='__main__':unittest.main()

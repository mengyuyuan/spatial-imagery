"""Synthetic regression cases for the evidence gate; never film approval records."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
sys.dont_write_bytecode = True

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'templates' / 'production'))
from verify_production_gates import digest_file, validate, SPECIALIST_CHECKS, SILENCE_CHECKS


class ProductionGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="spatial-gate-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

        def ref(name):
            path = self.root / name
            path.write_text("Synthetic validator fixture only: " + name, encoding="utf-8")
            return {"path": name, "sha256": digest_file(path)}

        self.data = {
            "schemaVersion": 4, "videoType": "talking-head", "version": "synthetic-only", "scope": [0, 180], "fps": 30,
            "intentThesis": "Unconnected components gain a shared function through assembly",
            "baselines": [{"id": "synthetic-reference", "role": "primary", "range": [0, 180], "frames": 180, "fps": 30,
                           "mechanism": "A guiding part takes a new functional role", "adaptation": "Use joining components for this assembly brief",
                           "approvalScope": "Synthetic contract fixture only; no real approval", **ref("reference.fixture")}],
            "audioExpected": True,
            "inputs": [{"role": role, **ref(role + ".txt")}
                       for role in ("design", "timeline", "source", "assets", "sound")],
            "shots": [], "transitions": [],
            "media": [{"id": "final", "role": "final", "from": 0, "to": 180, **ref("media.fixture")}],
            "assetsReview": {"status": "passed", "observed": "Synthetic asset-review record", "evidence": ref("assets-review.txt")},
            "finalMedia": "final", "openIssues": [],
        }
        for i, (start, end) in enumerate(((0, 90), (90, 180))):
            shot = {"id": f"SH{i+1}", "from": start, "to": end, "state": "A" if i == 0 else "B",
                    "kind": "transformation", "changes": ["structure"], "reading": [end - 15, end],
                    "subject": "one modular object", "meaning": "parts form a usable assembly",
                    "initial": "separate components", "process": "components lock into matching joints",
                    "result": "one connected assembly", "identity": "same colored components",
                    "camera": "side view reveals the joint", "implementation": ["source.txt:1"],
                    "intent": {"sourceKind": "screen_text", "cue": "Join the parts", "cueRange": [start+30, start+60],
                               "before": "Separate components cannot carry the load", "after": "A connected assembly supports the load",
                               "why": "The phrase promises useful assembly, not just proximity", "visualBridge": "Matching joints connect and the load moves onto them",
                               "focusBefore": "EL01", "focusAfter": "EL01", "revealFrame": start+45}}
            shot["review"] = self.review([start, end], "normal_speed", frames=True)
            self.data["shots"].append(shot)
        self.data["transitions"] = [{"id": "TR1", "fromShot": "SH1", "toShot": "SH2", "range": [80, 100],
                                     "method": "match", "reason": "follow the same assembly", "identity": "same joint",
                                     "motion": "carry screen-right velocity",
                                     "handoff": {"kind": "same_subject", "outgoing": "EL01", "incoming": "EL01",
                                                 "exit": "Assembly turns to expose its connected joint", "entry": "Same joint enters close view",
                                                 "meaningBridge": "From joined parts to proof that the joint supports a load",
                                                 "cue": "It can carry this", "cueRange": [88, 96], "focusFrame": 90},
                                     "review": self.review([80, 100], "normal_speed", frames=True)}]
        self.data["soundReview"] = {**self.review([0, 180], "listening"), "evidence": ref("sound-review.fixture")}
        self.data["technicalReview"] = {**self.review([0, 180], "technical"), "evidence": ref("technical.txt")}
        self.data["sequenceReview"] = self.review([0, 180], "normal_speed")
        evidence = ref("specialist-review.fixture")
        self.data["filmDesignReview"] = {
            "status": "passed", "method": "design_review", "range": [0, 180],
            "observed": "Synthetic whole-film critique", "evidence": evidence,
            "checks": {k: {"status": "passed", "observed": "Synthetic critique of " + k}
                       for k in ("not_slide_deck", "content_swap_test", "middle_end_coverage", "subject_camera_progression", "motivated_reading_holds")}}
        self.data["specialistGates"] = {}
        for name, keys in SPECIALIST_CHECKS.items():
            rows = self.data["transitions"] if name == "handoff" else self.data["shots"] + self.data["transitions"] if name == "camera" else self.data["shots"]
            gate = {"applicable": True, "reason": "Synthetic applicability", "plan": "Synthetic production plan",
                    "targets": [r["id"] for r in rows], "reviews": []}
            for row in rows:
                extent = row["range"] if "range" in row else [row["from"], row["to"]]
                method = "design_review" if name == "design" else "listening" if name in ("denoise", "soundfx") else "normal_speed"
                review = {**self.review(extent, method, frames=True), "target": row["id"], "evidence": evidence,
                          "checks": {k: {"status": "passed", "observed": "Synthetic observation of " + k} for k in keys}}
                if name in ("color", "matting", "denoise"):
                    review["comparison"] = {"before": ref(name + "-before.fixture"), "after": ref(name + "-after.fixture"), "alignment": "Same-frame/time synthetic comparison"}
                gate["reviews"].append(review)
            self.data["specialistGates"][name] = gate
        self.sign()

    def review(self, extent, method, frames=False):
        record = {"status": "passed", "observed": "Synthetic review observation; not real media evidence",
                  "media": "final", "range": extent, "method": method}
        if frames:
            record["frames"] = [extent[0], (extent[0] + extent[1]) // 2, extent[1] - 1]
            record["intentChecks"] = {key: {"status": "passed", "observed": "Synthetic observation of " + key}
                                      for key in ("meaning", "specificity", "subject", "timing", "landing")}
        return record

    def sign(self):
        result = validate(self.data, self.root, "design")
        binding = result["binding"]
        for entry in self.data["shots"] + self.data["transitions"]:
            entry["review"]["binding"] = binding
        for key in ("assetsReview", "soundReview", "technicalReview", "sequenceReview"):
            self.data[key]["binding"] = binding
        self.data["filmDesignReview"]["binding"] = result["designBinding"]
        for name, gate in self.data["specialistGates"].items():
            for review in gate["reviews"]:
                review["binding"] = result["designBinding"] if name == "design" or gate["applicable"] is False else binding

    def codes(self, stage="delivery"):
        return {error["code"] for error in validate(self.data, self.root, stage)["errors"]}

    def test_complete_record_contract(self):
        for stage in ("design", "full-render", "delivery"):
            self.assertEqual(self.codes(stage), set())

    def test_technical_pass_cannot_replace_missing_midfilm_motion(self):
        self.data["shots"][1]["review"]["status"] = "unverified"
        self.assertIn("review_incomplete", self.codes("full-render"))

    def test_renaming_fading_moving_does_not_count_as_transformation(self):
        self.data["shots"][1]["changes"] = ["position", "scale", "opacity", "text", "emphasis"]
        self.assertIn("cosmetic_only", self.codes("design"))

    def test_real_relationship_and_intentional_hold_remain_allowed(self):
        self.data["shots"][0]["changes"] = ["position", "relationship"]
        self.data["shots"][1].update(kind="hold", changes=["hold"], holdReason="Read the result and respond to the speaker")
        self.data["shots"][1]["intent"]["after"] = self.data["shots"][1]["intent"]["before"]
        self.sign()
        self.assertEqual(self.codes(), set())

    def test_still_or_browser_state_cannot_sign_motion(self):
        for method in ("dense_frames", "playback_clock", "technical"):
            self.data["shots"][0]["review"]["method"] = method
            self.assertIn("wrong_method", self.codes())

    def test_loudness_is_not_listening(self):
        self.data["soundReview"]["method"] = "technical"
        self.assertIn("wrong_method", self.codes())

    def test_old_hash_and_old_input_bindings_fail(self):
        source = self.root / "source.txt"
        source.write_text("Changed implementation", encoding="utf-8")
        self.assertIn("stale_file", self.codes())
        self.data["inputs"][2]["sha256"] = digest_file(source)
        self.assertIn("stale_review", self.codes())

    def test_design_change_invalidates_review(self):
        self.data["shots"][0]["process"] = "Different authored relationship"
        self.assertIn("stale_review", self.codes())

    def test_opening_only_cannot_certify_whole_film(self):
        self.data["shots"][1]["review"]["range"] = [0, 90]
        self.assertIn("review_coverage", self.codes())

    def test_interface_required_and_must_cross_both_sides(self):
        saved = copy.deepcopy(self.data["transitions"])
        self.data["transitions"] = []
        self.assertIn("missing_handoff", self.codes("design"))
        self.data["transitions"] = saved
        self.data["transitions"][0]["range"] = [90, 100]
        self.assertIn("handoff_range", self.codes("design"))

    def test_known_defect_blocks_even_with_passed_records(self):
        self.data["openIssues"] = ["Middle shot does not express its promised relationship"]
        self.assertIn("unresolved_issues", self.codes())

    def test_draft_does_not_certify_final(self):
        self.data["media"][0]["role"] = "draft"
        self.sign()
        self.assertEqual(self.codes("full-render"), set())
        self.assertIn("not_final_media", self.codes("delivery"))

    def test_final_sha_change_invalidates_media(self):
        file = self.root / "media.fixture"
        file.write_text("Different movie bytes", encoding="utf-8")
        self.assertIn("stale_file", self.codes())
        self.data["media"][0]["sha256"] = digest_file(file)
        self.assertIn("stale_review", self.codes())

    def test_missing_middle_states(self):
        self.data["shots"][0]["review"]["frames"] = [0, 1, 2]
        self.assertIn("missing_states", self.codes())

    def short_shot(self, length, context=True):
        first, second = self.data["shots"]
        first.update(to=length, reading=[0, length])
        first["intent"].update(cueRange=[0, length], revealFrame=length-1)
        second["from"] = length
        tr = self.data["transitions"][0]
        tr["range"] = [0, length+2]
        tr["handoff"].update(cueRange=[0, length+2], focusFrame=length)
        items = {item["id"]: item for item in self.data["shots"] + self.data["transitions"]}

        def adjust(review, item, design=False):
            extent = item.get("range", [item.get("from"), item.get("to")])
            review["range"] = extent[:]
            review["frames"] = list(range(*extent)) if extent[1]-extent[0] < 3 else [extent[0], sum(extent)//2, extent[1]-1]
            if item is first and not design and context:
                review.update(range=[0, length+2], contextRange=[0, length+2],
                              contextFrames=[0, (length+2)//2, length+1],
                              contextObserved="Synthetic flash and its following subject are reviewed together")
        for item in items.values():
            adjust(item["review"], item)
        for name, gate in self.data["specialistGates"].items():
            for review in gate["reviews"]:
                adjust(review, items[review["target"]], design=name == "design")
        self.sign()

    def test_two_frame_shot_uses_all_actual_frames_and_neighbour_context(self):
        self.short_shot(2)
        self.assertEqual(self.codes("design"), set())
        self.assertEqual(self.codes("full-render"), set())
        self.assertEqual(self.codes(), set())

    def test_one_frame_shot_does_not_require_invented_internal_frames(self):
        self.short_shot(1)
        self.assertEqual(self.codes(), set())

    def test_short_shot_cannot_waive_neighbour_playback(self):
        self.short_shot(2, context=False)
        self.assertIn("short_context", self.codes())

    def test_short_context_cannot_escape_reviewed_media_or_omit_observation(self):
        self.short_shot(2)
        review = self.data["shots"][0]["review"]
        review["contextRange"] = [0, 181]
        self.assertIn("short_context", self.codes())
        review["contextRange"] = [0, 4]
        review["contextFrames"] = [0, 1]
        self.assertIn("short_context_frames", self.codes())
        review["contextFrames"] = [0, 2, 3]
        del review["contextObserved"]
        self.assertIn("missing_detail", self.codes())

    def test_intentional_silent_film(self):
        self.data["audioExpected"] = False
        self.data["audioReason"] = "User requested a silent loop"
        self.data["soundReview"]["method"] = "silence_review"
        for review in self.data["specialistGates"]["soundfx"]["reviews"]:
            review["method"] = "silence_review"
            review["checks"] = {k: {"status": "passed", "observed": "Synthetic silence verification of " + k} for k in SILENCE_CHECKS}
        for key in ("denoise",):
            gate = self.data["specialistGates"][key]
            gate.update(applicable=False, targets=[], reviews=[{"status": "not_applicable", "method": "source_inspection",
                        "observed": "Synthetic source inventory contains no audio", "evidence": self.data["assetsReview"]["evidence"]}])
        self.sign()
        self.assertEqual(self.codes(), set())

    def test_motion_camera_sound_cannot_be_waived_at_any_stage(self):
        for stage in ("design", "full-render", "delivery"):
            for name in ("animation", "camera", "soundfx"):
                with self.subTest(stage=stage, gate=name):
                    self.data["specialistGates"][name]["applicable"] = False
                    self.assertIn("required_gate_disabled", self.codes(stage))
                    self.data["specialistGates"][name]["applicable"] = True

    def test_missing_camera_gate_blocks_even_if_animation_passed(self):
        del self.data["specialistGates"]["camera"]
        self.assertIn("missing_specialist_gate", self.codes("design"))

    def test_camera_requires_all_shots_and_all_interfaces(self):
        for target in ("SH2", "TR1"):
            saved = self.data["specialistGates"]["camera"]["targets"][:]
            self.data["specialistGates"]["camera"]["targets"].remove(target)
            self.assertIn("specialist_coverage", self.codes())
            self.data["specialistGates"]["camera"]["targets"] = saved

    def test_failed_camera_or_sound_blocks_render_and_delivery(self):
        for name in ("animation", "camera", "soundfx"):
            review = self.data["specialistGates"][name]["reviews"][0]
            key = next(iter(review["checks"]))
            review["checks"][key]["status"] = "failed"
            for stage in ("full-render", "delivery"):
                self.assertIn("specialist_criterion", self.codes(stage))
            review["checks"][key]["status"] = "passed"

    def test_silence_does_not_disable_sound_gate(self):
        self.data.update(audioExpected=False, audioReason="Intentional silent loop")
        self.data["specialistGates"]["soundfx"]["applicable"] = False
        self.assertIn("required_gate_disabled", self.codes("design"))

    def test_silence_na_or_technical_only_review_is_rejected(self):
        self.data.update(audioExpected=False, audioReason="Intentional silent loop")
        for method in ("source_inspection", "technical", "listening"):
            self.data["soundReview"]["method"] = method
            self.assertIn("wrong_method", self.codes())
        self.data["soundReview"]["status"] = "not_applicable"
        self.assertIn("review_incomplete", self.codes())

    def test_non_talking_head_ab_and_unknown_type_are_rejected(self):
        self.data["videoType"] = "general"
        self.assertIn("ab_scope", self.codes("design"))
        for shot in self.data["shots"]:
            shot["state"] = "full"
        self.sign()
        self.assertEqual(self.codes(), set())
        del self.data["videoType"]
        self.assertIn("video_type", self.codes("design"))

    def test_video_type_change_invalidates_prior_reviews(self):
        for shot in self.data["shots"]:
            shot["state"] = "full"
        self.sign()
        self.data["videoType"] = "general"
        self.assertIn("stale_review", self.codes())

    def test_schema_three_cannot_inherit_new_camera_sound_approval(self):
        self.data["schemaVersion"] = 3
        self.assertIn("schema", self.codes("design"))

    def test_camera_stills_or_metrics_do_not_certify_playback(self):
        self.data["specialistGates"]["camera"]["reviews"][0]["method"] = "technical"
        self.assertIn("wrong_method", self.codes())

    def test_shot_transition_id_collision_cannot_hide_camera_target(self):
        self.data["transitions"][0]["id"] = "SH1"
        self.assertIn("duplicate", self.codes("design"))

    def test_cli_exit_code_and_source_overwrite_protection(self):
        self.data["openIssues"] = ["Known defect"]
        manifest = self.root / "gate.json"
        manifest.write_text(json.dumps(self.data), encoding="utf-8")
        script = Path(__file__).resolve().parents[1] / "templates" / "production" / "verify_production_gates.py"
        result = subprocess.run([sys.executable, str(script), str(manifest), "--stage", "delivery"], capture_output=True)
        self.assertEqual(result.returncode, 1)
        before = manifest.read_bytes()
        result = subprocess.run([sys.executable, str(script), str(manifest), "--report", str(manifest)], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(manifest.read_bytes(), before)

    def test_old_schema_cannot_inherit_a_pass(self):
        self.data["schemaVersion"] = 1
        self.assertIn("schema", self.codes("design"))

    def test_morph_without_meaning_progress_is_rejected(self):
        shot = self.data["shots"][0]
        shot["changes"] = ["contour", "structure"]
        shot["intent"]["after"] = shot["intent"]["before"]
        self.assertIn("no_intent_progress", self.codes("design"))

    def test_demonstration_label_does_not_skip_intent(self):
        self.data["shots"][0]["kind"] = "demonstration"
        del self.data["shots"][0]["intent"]
        self.assertIn("missing_intent", self.codes("design"))

    def test_primary_reference_is_required(self):
        self.data["baselines"][0]["role"] = "supporting"
        self.assertIn("missing_baseline", self.codes("design"))

    def test_motion_review_alone_does_not_certify_intent(self):
        del self.data["shots"][0]["review"]["intentChecks"]
        self.assertIn("missing_intent_review", self.codes("full-render"))

    def test_failed_specificity_blocks_even_with_real_morph(self):
        self.data["shots"][0]["review"]["intentChecks"]["specificity"] = {
            "status": "failed", "observed": "The same sphere-to-ring animation fits unrelated lines without conveying assembly"}
        self.assertIn("intent_not_proven", self.codes())

    def test_each_intent_criterion_requires_an_observation(self):
        for key in ("meaning", "specificity", "subject", "timing", "landing"):
            self.data["shots"][0]["review"]["intentChecks"][key]["observed"] = ""
            self.assertIn("missing_intent_observation", self.codes())
            self.data["shots"][0]["review"]["intentChecks"][key]["observed"] = "Synthetic observed result"

    def test_keyword_offset_needs_a_reason_but_not_frame_lock(self):
        intent = self.data["shots"][0]["intent"]
        intent["revealFrame"] = 65
        self.assertIn("unmotivated_timing", self.codes("design"))
        intent["timingReason"] = "Finish the joint after the phrase, then let the result read"
        self.assertNotIn("unmotivated_timing", self.codes("design"))

    def test_focus_must_connect_adjacent_subjects(self):
        self.data["transitions"][0]["handoff"]["incoming"] = "EL99"
        self.assertIn("broken_focus_chain", self.codes("design"))

    def test_new_subject_cannot_be_claimed_as_same_object(self):
        self.data["shots"][1]["intent"].update(focusBefore="EL02", focusAfter="EL02")
        self.data["transitions"][0]["handoff"]["incoming"] = "EL02"
        self.assertIn("false_identity", self.codes("design"))
        self.data["transitions"][0]["handoff"]["kind"] = "new_subject"
        self.sign()
        self.assertEqual(self.codes(), set())

    def test_semantically_motivated_cut_is_allowed(self):
        self.data["transitions"][0]["handoff"]["kind"] = "intentional_cut"
        self.sign()
        self.assertEqual(self.codes(), set())

    def test_changed_intent_invalidates_old_review(self):
        self.data["shots"][0]["intent"]["after"] = "The joined pieces become a navigation control"
        self.assertIn("stale_review", self.codes())

    def test_each_specialist_gate_is_a_separate_veto(self):
        for name in SPECIALIST_CHECKS:
            with self.subTest(name=name):
                review = self.data["specialistGates"][name]["reviews"][0]
                criterion = next(iter(review["checks"]))
                review["checks"][criterion]["status"] = "failed"
                self.assertIn("specialist_criterion", self.codes())
                review["checks"][criterion]["status"] = "passed"

    def test_missing_specialist_gate_never_inherits_overall_pass(self):
        del self.data["specialistGates"]["matting"]
        self.assertIn("missing_specialist_gate", self.codes("design"))

    def test_na_requires_real_source_inspection_evidence(self):
        self.data["specialistGates"]["denoise"].update(applicable=False, targets=[], reviews=[])
        self.assertIn("unsupported_na", self.codes("design"))

    def test_mandatory_color_gate_cannot_be_disabled_for_procedural_graphics(self):
        self.data["specialistGates"]["color"]["applicable"] = False
        self.assertIn("required_gate_disabled", self.codes())

    def test_design_fields_alone_do_not_pass_g1(self):
        self.data["specialistGates"]["design"]["reviews"] = []
        self.assertIn("specialist_review_missing", self.codes("design"))

    def test_slide_deck_design_is_rejected_before_animation(self):
        self.data["filmDesignReview"]["checks"]["not_slide_deck"] = {"status": "failed", "observed": "Repeated cards merely replace headings"}
        self.assertIn("film_design_criterion", self.codes("design"))

    def test_ppt_like_motion_or_scene_resets_cannot_hide_behind_technical_pass(self):
        self.data["specialistGates"]["animation"]["reviews"][0]["checks"]["not_slide_motion"]["status"] = "failed"
        self.assertIn("specialist_criterion", self.codes("full-render"))

    def test_color_matting_denoise_require_comparison_sources(self):
        for name in ("color", "matting", "denoise"):
            with self.subTest(name=name):
                review = self.data["specialistGates"][name]["reviews"][0]
                saved = review.pop("comparison")
                self.assertIn("missing_comparison", self.codes())
                review["comparison"] = saved

    def test_sound_measurement_does_not_replace_listening(self):
        self.data["specialistGates"]["soundfx"]["reviews"][0]["method"] = "technical"
        self.assertIn("wrong_method", self.codes())

    def test_middle_shot_specialist_coverage_is_required(self):
        self.data["specialistGates"]["animation"]["targets"] = ["SH1"]
        self.assertIn("specialist_coverage", self.codes())

    def test_final_specialist_review_cannot_use_a_draft(self):
        self.data["media"].append({**self.data["media"][0], "id": "draft", "role": "draft"})
        self.data["specialistGates"]["color"]["reviews"][0]["media"] = "draft"
        self.sign()
        self.assertIn("not_final_media", self.codes())

    def test_old_schema_two_is_not_automatically_upgraded(self):
        self.data["schemaVersion"] = 2
        self.assertIn("schema", self.codes("design"))


if __name__ == "__main__":
    unittest.main()

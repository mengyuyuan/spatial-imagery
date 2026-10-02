"""Validate production evidence records, not the artistic quality of pixels/audio.

Read-only except for an optional JSON report. No media/code is executed.
Relative file references resolve against the manifest, never against the cwd.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path


# Independent vetoes: no averaging, overall-score substitution or automatic N/A.
SPECIALIST_CHECKS = {
    "design": ("intent", "specificity", "visible_process", "subject_hierarchy", "camera_discovery", "reading_rhythm", "sound_plan", "reference_adaptation", "not_slide_deck"),
    "animation": ("initial_process_result", "material_structure", "depth_occlusion", "tempo_inertia", "readable_landing", "not_slide_motion"),
    "camera": ("subject_priority", "observation_task", "framing_readability", "spatial_orientation", "trajectory_inertia", "handoff_continuity", "motivated_hold_or_cut"),
    "handoff": ("subject_identity", "attention_bridge", "direction_position_scale", "velocity_continuity", "occlusion_or_cut_reason", "semantic_timing", "sound_bridge", "landing", "no_unmotivated_reset"),
    "color": ("exposure_detail", "white_balance_palette", "skin_or_material", "light_direction", "temporal_consistency", "text_contrast", "color_space"),
    "matting": ("hair_edges", "hands_fingers", "core_integrity", "spill_halo", "alpha_interpretation", "temporal_stability", "occlusion_tracking", "timeline_alignment"),
    "denoise": ("noise_floor", "speech_detail", "no_musical_noise", "no_pumping", "breaths_transients", "sync_level_match"),
    "soundfx": ("source_license", "body_coverage", "attack_release", "inertia_material_handoff", "pan_depth", "dialogue_space", "variety_no_noise_bed", "sync_tail"),
}

# Silence is a sound decision to verify against the encode, never a waived gate.
SILENCE_CHECKS = ("intentional_silence", "no_missing_audio", "transition_intent", "output_silence")


def digest_file(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def present(value):
    return (isinstance(value, str) and bool(value.strip())
            and value.strip().lower() not in
            {"todo", "tbd", "pending", "待填", "待填写", "待验证", "待实现"})


def interval(value):
    return (isinstance(value, list) and len(value) == 2
            and all(type(n) is int for n in value) and 0 <= value[0] < value[1])


def contains(outer, inner):
    return interval(outer) and interval(inner) and outer[0] <= inner[0] < inner[1] <= outer[1]


def validate(data, base, stage):
    errors, cache = [], {}

    def fail(code, path, message):
        errors.append({"code": code, "path": path, "message": message})

    def words(record, keys, path):
        for key in keys:
            if not present(record.get(key)):
                fail("missing_detail", f"{path}.{key}", "Required concrete detail is missing")

    def file_ref(value, path):
        if not isinstance(value, dict) or not present(value.get("path")):
            fail("missing_file", path, "Expected path and SHA256")
            return
        file = (base / value["path"]).resolve()
        sha = value.get("sha256", "")
        if not isinstance(sha, str) or len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha.lower()):
            fail("missing_hash", path, "Expected a 64-character SHA256")
        try:
            if file not in cache:
                cache[file] = digest_file(file)
            if cache[file] != str(sha).lower():
                fail("stale_file", path, "File bytes do not match the recorded SHA256")
        except OSError as error:
            fail("missing_file", path, str(error))

    def rows(name):
        value = data.get(name)
        if not isinstance(value, list):
            fail("invalid_list", name, "Expected an array")
            return []
        result = []
        for i, entry in enumerate(value):
            if not isinstance(entry, dict):
                fail("invalid_record", f"{name}[{i}]", "Expected an object")
            else:
                result.append(entry)
        return result

    if not isinstance(data, dict):
        return {"eligible": False, "errors": [{"code": "invalid_manifest", "path": "$", "message": "Expected an object"}]}
    if data.get("schemaVersion") != 4:
        fail("schema", "schemaVersion", "Expected schemaVersion 4 with independent motion/camera/sound gates; old approvals are not migrated automatically")
    if data.get("videoType") not in ("talking-head", "general"):
        fail("video_type", "videoType", "Explicit talking-head or general required")
    words(data, ["version", "intentThesis"], "$")
    scope, fps = data.get("scope"), data.get("fps")
    if not interval(scope):
        fail("scope", "scope", "Expected an integer [from,to) range")
    if type(fps) not in (int, float) or not math.isfinite(fps) or not 0 < fps <= 240:
        fail("fps", "fps", "Expected a positive finite FPS <=240")
    if type(data.get("audioExpected")) is not bool:
        fail("audio_policy", "audioExpected", "Explicit boolean required")
    if data.get("audioExpected") is False:
        words(data, ["audioReason"], "$")

    baselines = rows("baselines")
    if not baselines or not any(item.get("role") == "primary" for item in baselines):
        fail("missing_baseline", "baselines", "Choose a primary design reference and explain its adaptation")
    baseline_ids = set()
    for i, item in enumerate(baselines):
        p = f"baselines[{i}]"
        words(item, ["id", "mechanism", "adaptation", "approvalScope"], p)
        ident = item.get("id")
        if isinstance(ident, str):
            if ident in baseline_ids:
                fail("duplicate", p, "Duplicate baseline ID")
            baseline_ids.add(ident)
        if item.get("role") not in ("primary", "supporting"):
            fail("baseline_role", p, "Expected primary or supporting")
        if not contains([0, item.get("frames")], item.get("range")):
            fail("baseline_range", p, "Reference range must fit its own frame count")
        rate = item.get("fps")
        if type(rate) not in (int, float) or not math.isfinite(rate) or not 0 < rate <= 240:
            fail("baseline_fps", p, "Reference FPS must be positive and finite")
        file_ref(item, p)

    inputs = rows("inputs")
    roles = {item.get("role") for item in inputs if isinstance(item.get("role"), str)}
    required = {"design", "timeline", "assets", "sound"}
    if stage != "design":
        required.add("source")
    for role in sorted(required - roles):
        fail("input_role", "inputs", f"Missing {role} input")
    for i, item in enumerate(inputs):
        words(item, ["role"], f"inputs[{i}]")
        file_ref(item, f"inputs[{i}]")
    def design_records(name):
        entries = data.get(name)
        if not isinstance(entries, list):
            return entries
        return [{k: v for k, v in entry.items() if k != "review"}
                if isinstance(entry, dict) else entry for entry in entries]

    binding_payload = {"schemaVersion": data.get("schemaVersion"), "version": data.get("version"), "fps": fps, "scope": scope,
                       "intentThesis": data.get("intentThesis"), "baselines": baselines, "videoType": data.get("videoType"),
                       "audioExpected": data.get("audioExpected"), "audioReason": data.get("audioReason"),
                       "inputs": inputs, "media": data.get("media", []), "shots": design_records("shots"),
                       "transitions": design_records("transitions")}
    specialist = data.get("specialistGates")
    # Applicability, per-shot scope and production plans are part of the contract.
    binding_payload["specialistGates"] = {
        key: {k: v for k, v in gate.items() if k != "reviews"} if isinstance(gate, dict) else gate
        for key, gate in specialist.items()
    } if isinstance(specialist, dict) else specialist
    design_payload = {k: v for k, v in binding_payload.items() if k != "media"}
    design_binding = hashlib.sha256(json.dumps(design_payload, sort_keys=True, ensure_ascii=False,
                                               separators=(",", ":")).encode("utf-8")).hexdigest()
    binding = hashlib.sha256(json.dumps(binding_payload, sort_keys=True, ensure_ascii=False,
                                        separators=(",", ":")).encode("utf-8")).hexdigest()

    media = {}
    if stage != "design":
        for i, item in enumerate(rows("media")):
            p = f"media[{i}]"
            words(item, ["id"], p)
            ident = item.get("id")
            if not isinstance(ident, str):
                continue
            if ident in media:
                fail("duplicate", p, "Duplicate media ID")
            media[ident] = item
            file_ref(item, p)
            if item.get("role") not in ("draft", "final"):
                fail("media_role", p, "Expected draft or final")
            if not contains(scope, [item.get("from"), item.get("to")]):
                fail("media_range", p, "Media mapping must fit the project scope")

    def record_review(review, p):
        if not isinstance(review, dict):
            fail("missing_review", p, "Review record required")
            return False
        if review.get("status") != "passed":
            fail("review_incomplete", p, "Review is failed, missing or unverified")
        if review.get("binding") != binding:
            fail("stale_review", p, "Review does not bind to the current inputs/version/scope")
        words(review, ["observed"], p)
        return True

    def playback_review(review, p, needed, method, visual=False, evidence=False):
        if not record_review(review, p):
            return
        if review.get("method") != method:
            fail("wrong_method", p, f"Requires {method}; technical checks/stills are not a substitute")
        media_id = review.get("media")
        item = media.get(media_id) if isinstance(media_id, str) else None
        if item is None:
            fail("unknown_media", p, "Review must reference acquired media")
            return
        if stage == "delivery" and (item.get("role") != "final" or media_id != data.get("finalMedia")):
            fail("not_final_media", p, "Delivery reviews must bind to the same final encoded media")
        reviewed = review.get("range")
        if not contains([item.get("from"), item.get("to")], reviewed) or not contains(reviewed, needed):
            fail("review_coverage", p, "Review/media range does not cover this entire required interval")
        if visual:
            frames = review.get("frames")
            if not (isinstance(frames, list) and len(frames) >= 3
                    and all(type(n) is int for n in frames)
                    and frames == sorted(set(frames)) and interval(needed)
                    and all(needed[0] <= n < needed[1] for n in frames)
                    and frames[0] == needed[0] and frames[-1] == needed[1] - 1):
                fail("missing_states", p, "Record ordered distinct before/middle/after frames within the interval")
        if evidence:
            file_ref(review.get("evidence"), p + ".evidence")

    def intent_review(review, p):
        checks = review.get("intentChecks") if isinstance(review, dict) else None
        if not isinstance(checks, dict):
            fail("missing_intent_review", p, "Motion evidence also needs meaning/specificity/subject/timing/landing observations")
            return
        for key in ("meaning", "specificity", "subject", "timing", "landing"):
            check = checks.get(key)
            if not isinstance(check, dict) or check.get("status") != "passed":
                fail("intent_not_proven", p + "." + key, "Intent criterion is failed or unverified; actual morphing alone is insufficient")
            if not isinstance(check, dict) or not present(check.get("observed")):
                fail("missing_intent_observation", p + "." + key, "Record what the encoded picture actually expresses")

    def cue_timing(record, extent, frame_key, p):
        if not contains(scope, record.get("cueRange")):
            fail("intent_cue_range", p, "Cue must have a real range on the project timeline")
        frame = record.get(frame_key)
        if type(frame) is not int or not interval(extent) or not extent[0] <= frame < extent[1]:
            fail("intent_reveal_frame", p, "Reveal/focus frame must lie in this shot/interface")
        elif interval(record.get("cueRange")) and not record["cueRange"][0] <= frame < record["cueRange"][1] and not present(record.get("timingReason")):
            fail("unmotivated_timing", p, "A reveal outside its semantic cue window needs an anticipation/response/reading reason")

    shots = rows("shots")
    if not shots:
        fail("no_shots", "shots", "At least one shot required")
    cursor = scope[0] if interval(scope) else 0
    ids = set()
    strong = {"structure", "contour", "relationship", "function"}
    allowed = strong | {"reveal", "position", "scale", "opacity", "text", "emphasis", "hold"}
    shot_map = {}
    for i, shot in enumerate(shots):
        p = f"shots[{i}]"
        words(shot, ["id", "subject", "meaning", "initial", "process", "result", "identity", "camera"], p)
        sid = shot.get("id")
        if isinstance(sid, str):
            if sid in ids:
                fail("duplicate", p, "Duplicate SH ID")
            ids.add(sid)
            shot_map[sid] = shot
        extent = [shot.get("from"), shot.get("to")]
        if not contains(scope, extent) or extent[0] != cursor:
            fail("timeline", p, "Shots must cover the scope without gaps/overlaps")
        if interval(extent):
            cursor = extent[1]
        if shot.get("state") not in ("A", "B", "full"):
            fail("shot_state", p, "Expected A, B or full")
        if shot.get("state") in ("A", "B") and data.get("videoType") != "talking-head":
            fail("ab_scope", p, "A/B states are only for talking-head videos; other films use full")
        if shot.get("kind") not in ("transformation", "handoff", "demonstration", "hold"):
            fail("shot_kind", p, "Unknown expression kind")
        changes = shot.get("changes")
        if not isinstance(changes, list) or not changes or any(not isinstance(c, str) or c not in allowed for c in changes):
            fail("changes", p, "Explicit known change categories required")
        elif shot.get("kind") == "transformation" and not strong.intersection(changes):
            fail("cosmetic_only", p, "Position/scale/opacity/text/emphasis alone cannot satisfy a transformation")
        if shot.get("kind") == "hold":
            words(shot, ["holdReason"], p)
        intent = shot.get("intent")
        if not isinstance(intent, dict):
            fail("missing_intent", p, "Every shot, including demonstration/hold, must serve an explicit intent")
        else:
            words(intent, ["cue", "before", "after", "why", "visualBridge", "focusBefore", "focusAfter"], p + ".intent")
            if intent.get("sourceKind") not in ("speech", "screen_text", "gesture", "brief"):
                fail("intent_source", p, "Intent cue must come from speech, screen text, gesture or the creative brief")
            if shot.get("kind") != "hold" and present(intent.get("before")) and str(intent.get("before")).strip().casefold() == str(intent.get("after")).strip().casefold():
                fail("no_intent_progress", p, "A changing shape must advance understanding/feeling; otherwise design an honest intentional hold")
            cue_timing(intent, extent, "revealFrame", p + ".intent")
        reading = shot.get("reading")
        if reading is None:
            words(shot, ["noReadingReason"], p)
        elif not contains(extent, reading):
            fail("reading_range", p, "Reading range must fit inside the shot")
        if stage != "design":
            implementation = shot.get("implementation")
            if not isinstance(implementation, list) or not implementation or not all(present(v) for v in implementation):
                fail("missing_implementation", p, "Point to the actual implementing source locations")
            playback_review(shot.get("review"), p + ".review", extent, "normal_speed", visual=True)
            intent_review(shot.get("review"), p + ".review.intentChecks")

    if interval(scope) and cursor != scope[1]:
        fail("timeline", "shots", "Last shot must end at scope.to")
    transitions = rows("transitions")
    expected = {(a.get("id"), b.get("id")) for a, b in zip(shots, shots[1:])
                if isinstance(a.get("id"), str) and isinstance(b.get("id"), str)}
    seen, transition_ids = set(), set()
    for i, tr in enumerate(transitions):
        p = f"transitions[{i}]"
        words(tr, ["id", "fromShot", "toShot", "method", "reason", "identity", "motion"], p)
        tid = tr.get("id")
        if isinstance(tid, str):
            if tid in transition_ids or tid in ids:
                fail("duplicate", p, "SH/TR IDs must be distinct so camera evidence has an unambiguous target")
            transition_ids.add(tid)
        pair = (tr.get("fromShot"), tr.get("toShot"))
        if not all(isinstance(v, str) for v in pair):
            continue
        if pair not in expected or pair in seen:
            fail("handoff_pair", p, "Exactly one TR per adjacent SH pair required")
        seen.add(pair)
        extent = tr.get("range")
        previous, following = shot_map.get(pair[0]), shot_map.get(pair[1])
        if (not previous or not following or not interval(extent)
                or not interval([previous.get("from"), following.get("to")])
                or not contains([previous["from"], following["to"]], extent)
                or not extent[0] < following["from"] < extent[1]):
            fail("handoff_range", p, "Interface window must cover both sides of its cut inside adjacent shots")
        handoff = tr.get("handoff")
        if not isinstance(handoff, dict):
            fail("missing_intent_handoff", p, "Record why the current intent hands attention to the next subject")
        else:
            words(handoff, ["outgoing", "incoming", "exit", "entry", "meaningBridge", "cue"], p + ".handoff")
            kind = handoff.get("kind")
            if kind not in ("same_subject", "new_subject", "intentional_cut"):
                fail("intent_handoff_kind", p, "Distinguish same-subject continuity, new-subject relay and intentional cut")
            old, new = handoff.get("outgoing"), handoff.get("incoming")
            if kind == "same_subject" and old != new:
                fail("false_identity", p, "Different subjects cannot be certified as the same subject")
            if kind == "new_subject" and old == new:
                fail("false_identity", p, "A new-subject relay needs distinct subject identities")
            old_intent = previous.get("intent") if previous else None
            new_intent = following.get("intent") if following else None
            if not isinstance(old_intent, dict) or not isinstance(new_intent, dict) or old != old_intent.get("focusAfter") or new != new_intent.get("focusBefore"):
                fail("broken_focus_chain", p, "Handoff subjects must match the outgoing/incoming SH attention states")
            cue_timing(handoff, extent, "focusFrame", p + ".handoff")
        if stage != "design":
            playback_review(tr.get("review"), p + ".review", extent, "normal_speed", visual=True)
            intent_review(tr.get("review"), p + ".review.intentChecks")
    for pair in sorted(expected - seen):
        fail("missing_handoff", "transitions", f"Missing TR {pair[0]} -> {pair[1]}")

    overview = data.get("filmDesignReview")
    if not isinstance(overview, dict):
        fail("missing_film_design_review", "filmDesignReview", "Review the whole film's design, including the middle and ending")
    else:
        if overview.get("status") != "passed" or overview.get("method") != "design_review" or overview.get("binding") != design_binding or overview.get("range") != scope:
            fail("film_design_review", "filmDesignReview", "Full-scope design critique must bind to the current design")
        words(overview, ["observed"], "filmDesignReview")
        file_ref(overview.get("evidence"), "filmDesignReview.evidence")
        checks = overview.get("checks")
        for key in ("not_slide_deck", "content_swap_test", "middle_end_coverage", "subject_camera_progression", "motivated_reading_holds"):
            check = checks.get(key) if isinstance(checks, dict) else None
            if not isinstance(check, dict) or check.get("status") != "passed" or not present(check.get("observed")):
                fail("film_design_criterion", "filmDesignReview.checks." + key, "A deck of cards/title swaps cannot pass as intent-led motion; record actual whole-film design evidence")

    # G1 includes design critique; G2/G3 require separate motion, camera and sound vetoes.
    for name, criteria in SPECIALIST_CHECKS.items():
        p = "specialistGates." + name
        gate = specialist.get(name) if isinstance(specialist, dict) else None
        if not isinstance(gate, dict):
            fail("missing_specialist_gate", p, "Required independent gate is missing")
            continue
        words(gate, ["reason", "plan"], p)
        applicable = gate.get("applicable")
        if type(applicable) is not bool:
            fail("gate_applicability", p, "Explicit applicability is required; unknown never passes")
            continue
        available = {item.get("id"): item for item in (transitions if name == "handoff" else shots + transitions if name == "camera" else shots)
                     if isinstance(item.get("id"), str)}
        always = (name in ("design", "animation", "camera", "color", "soundfx") or name == "handoff" and bool(transitions))
        if always and not applicable:
            fail("required_gate_disabled", p, "Motion, camera and sound (including silence) are mandatory, as are design, color and existing handoffs")
        if name == "denoise" and data.get("audioExpected") is False and applicable:
            fail("audio_gate_scope", p, "A silent film needs an evidenced denoise N/A decision, not pretend listening")
        targets = gate.get("targets")
        if (not isinstance(targets, list) or any(not isinstance(t, str) or t not in available for t in targets)
                or len(set(t for t in targets if isinstance(t, str))) != len(targets)):
            fail("specialist_targets", p, "Targets must be unique real SH/TR IDs")
            targets = []
        if applicable and (not targets or always and set(targets) != set(available)):
            fail("specialist_coverage", p, "Applicable mandatory gates must cover every SH/TR; optional gates need actual targets")
        if not applicable and targets:
            fail("disabled_gate_targets", p, "Non-applicability cannot hide assigned shots")
        reviews = gate.get("reviews")
        if not isinstance(reviews, list):
            fail("specialist_reviews", p, "Expected review records")
            continue
        if not applicable:
            # N/A itself is an inspected source decision, never a shortcut from a failed pass.
            decision = reviews[0] if len(reviews) == 1 and isinstance(reviews[0], dict) else {}
            if decision.get("status") != "not_applicable" or decision.get("method") != "source_inspection" or decision.get("binding") != design_binding:
                fail("unsupported_na", p, "N/A requires a current source-inspection decision and design binding")
            words(decision, ["observed"], p + ".reviews[0]")
            file_ref(decision.get("evidence"), p + ".reviews[0].evidence")
            continue
        if stage == "design" and name != "design":
            continue
        seen_targets = set()
        for i, review in enumerate(reviews):
            q = f"{p}.reviews[{i}]"
            target = review.get("target") if isinstance(review, dict) else None
            if not isinstance(target, str) or target not in targets or target in seen_targets:
                fail("specialist_review_target", q, "Exactly one review per required target")
                continue
            seen_targets.add(target)
            item = available[target]
            extent = item.get("range") if target in transition_ids else [item.get("from"), item.get("to")]
            if name == "design":
                if review.get("status") != "passed" or review.get("method") != "design_review" or review.get("binding") != design_binding:
                    fail("design_critique_missing", q, "G1 requires current per-shot design critique, not just populated fields")
                words(review, ["observed"], q)
                if review.get("range") != extent:
                    fail("design_review_scope", q, "Design critique must cover this exact SH")
            else:
                method = "silence_review" if name == "soundfx" and data.get("audioExpected") is False else "listening" if name in ("denoise", "soundfx") else "normal_speed"
                playback_review(review, q, extent, method, visual=name not in ("denoise", "soundfx"))
            file_ref(review.get("evidence"), q + ".evidence")
            checks = review.get("checks")
            required_criteria = SILENCE_CHECKS if name == "soundfx" and data.get("audioExpected") is False else criteria
            for key in required_criteria:
                check = checks.get(key) if isinstance(checks, dict) else None
                if not isinstance(check, dict) or check.get("status") != "passed" or not present(check.get("observed")):
                    fail("specialist_criterion", q + ".checks." + key, "Each criterion needs a passed actual observation; one failure vetoes this gate")
            if name in ("color", "matting", "denoise"):
                comparison = review.get("comparison")
                if not isinstance(comparison, dict):
                    fail("missing_comparison", q, "Same-frame or level/time-aligned before/reference and after evidence is required")
                else:
                    words(comparison, ["alignment"], q + ".comparison")
                    file_ref(comparison.get("before"), q + ".comparison.before")
                    file_ref(comparison.get("after"), q + ".comparison.after")
        for target in sorted(set(targets) - seen_targets):
            fail("specialist_review_missing", p, "Missing current review for " + target)

    if stage != "design":
        if data.get("openIssues") != []:
            fail("unresolved_issues", "openIssues", "Known defects must be fixed and rechecked; [] only after resolution")
        asset = data.get("assetsReview")
        if record_review(asset, "assetsReview"):
            file_ref(asset.get("evidence"), "assetsReview.evidence")
        playback_review(data.get("soundReview"), "soundReview", scope,
                        "silence_review" if data.get("audioExpected") is False else "listening", evidence=True)
        playback_review(data.get("technicalReview"), "technicalReview", scope, "technical", evidence=True)
    if stage == "delivery":
        playback_review(data.get("sequenceReview"), "sequenceReview", scope, "normal_speed")
    return {"schemaVersion": 4, "stage": stage, "version": data.get("version"), "binding": binding, "designBinding": design_binding,
            "eligible": not errors, "errors": errors,
            "limits": ["This validates records and hashes, not pixels or audio perception.",
                       "Actual semantic review, listening and source completeness remain the producer's responsibility.",
                       "User approval is separate and is not generated by this tool."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--stage", choices=("design", "full-render", "delivery"), default="design")
    parser.add_argument("--print-binding", action="store_true", help="Print input binding only; never a gate pass")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        manifest = args.manifest.resolve()
        data = json.loads(manifest.read_text(encoding="utf-8-sig"))
        result = validate(data, manifest.parent, args.stage)
        if args.print_binding:
            print(json.dumps({"binding": result.get("binding"), "designBinding": result.get("designBinding"), "isGatePass": False}))
            return 0 if result.get("binding") else 1
        if args.report:
            output = args.report.resolve()
            protected = {manifest}
            if isinstance(data, dict):
                def collect(value):
                    if isinstance(value, dict):
                        if isinstance(value.get("path"), str):
                            protected.add((manifest.parent / value["path"]).resolve())
                        for child in value.values():
                            collect(child)
                    elif isinstance(value, list):
                        for child in value:
                            collect(child)
                collect(data)
            if output in protected:
                parser.error("Report must not overwrite the manifest or any referenced source/media/evidence")
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result["eligible"] else 1
    except (OSError, ValueError, TypeError) as error:
        print(json.dumps({"eligible": False, "error": str(error)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    sys.exit(main())

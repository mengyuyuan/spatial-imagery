"""Execution contracts for schema-4 gates. Measurements never certify artistic quality."""
import json
import math
import re


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def source_location(value, inputs, base, fail, path):
    match = re.fullmatch(r"(.+):([1-9][0-9]*)", value) if isinstance(value, str) else None
    if not match:
        fail("implementation_location", path, "Use an existing bound source path:line")
        return
    file = (base / match[1]).resolve()
    sources = {(base / item['path']).resolve() for item in inputs
               if item.get('role') == 'source' and isinstance(item.get('path'), str)}
    try:
        if file not in sources or int(match[2]) > len(file.read_text(encoding='utf-8-sig').splitlines()):
            raise ValueError('Source is unbound or line is outside the file')
    except (OSError, UnicodeError, ValueError) as error:
        fail("implementation_location", path, str(error))


def execution_contract(data, shots, transitions, stage, inputs, base, fail, present):
    if data.get('executionContractVersion') != 1:
        fail('execution_version', 'executionContractVersion', 'Execution contract 1 required; preserve old evidence and migrate explicitly')
    renderer = data.get('execution', {}).get('renderer') if isinstance(data.get('execution'), dict) else None
    if renderer not in ('layers-2.5d', 'custom'):
        fail('execution_renderer', 'execution', 'Declare the actual renderer; custom measurements are mandatory at G2/G3')
    for row in shots + transitions:
        is_shot = row in shots
        for kind in (('motion', 'camera') if is_shot else ('camera',)):
            key = kind + 'Binding'
            binding = row.get(key)
            if (not isinstance(binding, dict) or binding.get('mode') not in ('animated', 'hold')
                    or not present(binding.get('subject')) or not present(binding.get('reason'))
                    or not isinstance(binding.get('channels'), list)
                    or any(not present(c) for c in binding['channels'])
                    or len(set(binding['channels'])) != len(binding['channels'])
                    or not binding['channels'] and (binding['mode'] == 'animated' or renderer == 'custom')):
                fail('execution_binding', str(row.get('id')) + '.' + key, 'Bind animated channels, or explicitly justify a hold; custom holds need measured channels too')
        if stage != 'design':
            refs = row.get('implementation')
            if not isinstance(refs, list) or not refs:
                fail('missing_implementation', str(row.get('id')), 'Bind actual SH/TR implementation source locations')
            else:
                for ref in refs:
                    source_location(ref, inputs, base, fail, str(row.get('id')) + '.implementation')
    return renderer


def custom_evidence(data, shots, transitions, media, binding, base, inputs, file_ref, fail):
    """Validate full temporal coverage, measured channels, staging and snapshot identities.

    Instrument the actual renderer. These records are not synthesized from design prose.
    A reviewer must still inspect the bound captures/video and assess intent and listening.
    """
    evidence = data.get('executionEvidence')
    if not isinstance(evidence, list) or len(evidence) != len(media) or not media:
        fail('execution_evidence', 'executionEvidence', 'Custom execution requires one current measurement artifact for each reviewed media file')
        return
    w, h = data.get('width'), data.get('height')
    if not all(type(n) is int and n > 0 for n in (w, h)):
        fail('execution_dimensions', '$', 'Actual composition width/height required for custom projection evidence')
        return
    area = w * h
    seen = set()
    backgrounds = {}
    protected_inserts = {}
    previous = None
    for i, shot in enumerate(shots):
        if shot.get('state') not in ('A', 'B'):
            continue
        if previous is not None and shots[previous]['state'] != shot['state']:
            ids = set(shots[previous].get('staging', {}).get('protectedLayers', [])) | set(shot.get('staging', {}).get('protectedLayers', []))
            for insert in shots[previous+1:i]:
                protected_inserts[insert['id']] = ids
        previous = i
    for index, ref in enumerate(evidence):
        p = f'executionEvidence[{index}]'
        if not isinstance(ref, dict) or not isinstance(ref.get('media'), str) or ref.get('media') not in media or ref.get('media') in seen:
            fail('execution_evidence', p, 'Unique registered media identity required')
            continue
        mid = ref['media']; seen.add(mid)
        file_ref(ref.get('evidence'), p + '.evidence')
        try:
            doc = json.loads((base / ref['evidence']['path']).read_text(encoding='utf-8-sig'))
        except (OSError, ValueError, KeyError, TypeError):
            fail('execution_evidence', p, 'Cannot read measurement JSON')
            continue
        if (not isinstance(doc, dict) or doc.get('binding') != binding or doc.get('mediaSha256') != media[mid]['sha256']
                or doc.get('method') != 'renderer-mask-projection' or doc.get('width') != w or doc.get('height') != h):
            fail('execution_evidence_binding', p, 'Measurements must bind current renderer inputs, encoded video and dimensions')
            continue
        source_location(doc.get('producer'), inputs, base, fail, p + '.producer')
        targets = doc.get('targets')
        if not isinstance(targets, dict):
            fail('execution_evidence', p, 'Per-SH/TR targets required')
            continue
        for row in shots + transitions:
            sid = row.get('id'); extent = [row.get('from'), row.get('to')] if row in shots else row.get('range')
            if not (isinstance(extent, list) and len(extent) == 2 and all(type(n) is int for n in extent) and extent[1] > extent[0]):
                continue  # Main validator reports malformed timeline.
            # A segmented draft only supplies targets fully contained in its own range.
            if not (media[mid]['from'] <= extent[0] and extent[1] <= media[mid]['to']):
                continue
            target = targets.get(sid, {})
            frames = target.get('frames') if isinstance(target, dict) else None
            if (not isinstance(frames, list) or len(frames) != extent[1] - extent[0]
                    or any(not isinstance(f, dict) or f.get('frame') != extent[0]+i for i, f in enumerate(frames))):
                fail('execution_frame_coverage', p + '.' + str(sid), 'Every actual integer frame must have ordered measurements; no first/middle/last-only substitution')
                continue
            captures = target.get('captures', [])
            anchors = {extent[0], (extent[0]+extent[1]-1)//2, extent[1]-1}
            if (not isinstance(captures, list) or len(captures) != len(anchors)
                    or any(not isinstance(c, dict) or type(c.get('frame')) is not int for c in captures)
                    or {c['frame'] for c in captures} != anchors):
                fail('execution_captures', p + '.' + sid, 'Hashed rendered captures at the first/middle/last actual frames required')
            else:
                for capture in captures:
                    file_ref(capture, p + '.' + sid + '.capture')
            for kind in (('motion', 'camera') if row in shots else ('camera',)):
                contract = row.get(kind + 'Binding', {})
                channels = contract.get('channels', []) if isinstance(contract, dict) else []
                if not isinstance(channels, list) or not all(isinstance(c, str) for c in channels):
                    continue
                values = [f.get('values', {}) for f in frames]
                if any(not isinstance(v, dict) or any(not finite(v.get(c)) for c in channels) for v in values):
                    fail('execution_channels', p + '.' + sid, 'All bound channels need finite measured values for every frame')
                else:
                    changed = any(max(v[c] for v in values)-min(v[c] for v in values) > 1e-6 for c in channels)
                    if changed != (contract.get('mode') == 'animated'):
                        fail('execution_motion', p + '.' + sid, 'Measured movement contradicts the declared animated/hold mode')
            # A moving unrelated channel cannot certify the specifically requested effect.
            contract = data.get('requirementContract', {})
            requests = contract.get('requirements', []) if isinstance(contract, dict) else []
            for request in requests if isinstance(requests, list) else []:
                if not isinstance(request, dict) or request.get('kind') not in ('motion', 'spatial'):
                    continue
                mappings = request.get('fulfillments', [])
                for mapping in mappings if isinstance(mappings, list) else []:
                    if not isinstance(mapping, dict) or mapping.get('target') != sid:
                        continue
                    required = mapping.get('depthChannels' if request['kind'] == 'spatial' else 'channels', [])
                    if not isinstance(required, list):
                        continue
                    required = [c for c in required if isinstance(c, str) and c.rsplit('.', 1)[-1] not in ('sourceTime', 'time', 'frame', 'opacity')]
                    if not required or any(not isinstance(f.get('values'), dict) or any(not finite(f['values'].get(c)) for c in required) for f in frames):
                        fail('requirement_measured_channels', p + '.' + sid, 'Measure every specifically requested effect channel on every frame')
                    elif not any(max(f['values'][c] for f in frames) - min(f['values'][c] for f in frames) > 1e-6 for c in required):
                        fail('requirement_actual_motion', p + '.' + sid, 'Requested effect stays constant even if playback or other object channels move')
            is_ab = row.get('state') in ('A', 'B')
            s = row.get('staging') if is_ab else {'protectedLayers': protected_inserts.get(sid, []), 'landing': []}
            if not isinstance(s, dict) or not is_ab and sid not in protected_inserts:
                continue
            for sample in frames:
                f = sample['frame']; metrics = sample.get('staging', {})
                overlap = metrics.get('protectedOverlap') if isinstance(metrics, dict) else None
                if (not isinstance(overlap, dict) or any(not finite(overlap.get(i)) or overlap[i] < 0 or overlap[i] > 1e-6 for i in s.get('protectedLayers', []))):
                    fail('execution_occlusion', p + '.' + sid, f'Protected information lacks zero-overlap proof at frame {f}')
                    break
                landing = s.get('landing', [])
                if len(landing) != 2 or not landing[0] <= f < landing[1]:
                    continue
                person, content, coverage = (metrics.get(k) for k in ('presenterArea', 'contentArea', 'backgroundCoverage'))
                if (not all(finite(n) and 0 <= n <= area for n in (person, content)) or person <= 0
                        or (row['state'] == 'A' and person <= content) or (row['state'] == 'B' and content <= person)
                        or not finite(coverage) or not .9 <= coverage <= 1):
                    fail('execution_staging', p + '.' + sid, f'Actual visible dominance/background coverage fails at frame {f}')
                    break
                identities = metrics.get('backgroundIdentities')
                if not isinstance(identities, list) or not identities or any(not isinstance(i, str) or not re.fullmatch('[0-9a-f]{64}', i) for i in identities):
                    fail('execution_background', p + '.' + sid, 'Stable background content identities, excluding camera/scene-name changes, required')
                    break
                backgrounds.setdefault(sid, set()).update(identities)
    previous = None
    for shot in shots:
        if shot.get('state') not in ('A', 'B'):
            continue
        if previous and previous['state'] != shot['state'] and backgrounds.get(previous['id'], set()) & backgrounds.get(shot['id'], set()):
            fail('execution_background', 'executionEvidence', 'A/B retain common visible background content, including across full-frame inserts')
        previous = shot
    if seen != set(media):
        fail('execution_evidence', 'executionEvidence', 'Every reviewed media version needs its own measurements')

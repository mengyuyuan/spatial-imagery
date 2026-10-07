"""Bind the actual brief to shot mechanisms; declarations are not visual approval."""
from verify_execution_evidence import source_location


def requirement_contract(data, shots, transitions, stage, inputs, base, fail, present):
    contract = data.get('requirementContract')
    if not isinstance(contract, dict) or contract.get('version') != 1:
        fail('requirement_contract', 'requirementContract', 'Version 1 brief-to-shot contract required; do not auto-approve legacy projects')
        return
    brief = contract.get('brief')
    bound = {(base / i['path']).resolve() for i in inputs
             if i.get('role') == 'brief' and isinstance(i.get('path'), str)}
    if not isinstance(brief, str) or (base / brief).resolve() not in bound:
        fail('requirement_brief', 'requirementContract.brief', 'Bind a current user-brief input, separate from design claims')
    requirements = contract.get('requirements')
    if not isinstance(requirements, list) or not requirements:
        fail('requirement_list', 'requirementContract.requirements', 'Record the actual requested outcomes and their scope')
        return
    targets = {r.get('id'): r for r in shots + transitions if isinstance(r.get('id'), str)}
    ids = set()
    for index, req in enumerate(requirements):
        path = f'requirementContract.requirements[{index}]'
        if not isinstance(req, dict):
            fail('requirement_record', path, 'Expected object'); continue
        ident = req.get('id')
        if not isinstance(ident, str) or not ident.strip() or ident in ids:
            fail('requirement_id', path, 'Nonempty unique requirement ID')
        else:
            ids.add(ident)
        for key in ('quote', 'scopeReason', 'acceptance'):
            if not present(req.get(key)):
                fail('requirement_description', path + '.' + key, 'State the request, its actual scope and visible acceptance condition')
        kind = req.get('kind')
        if kind not in ('content', 'asset', 'editorial', 'motion', 'spatial', 'audio'):
            fail('requirement_kind', path, 'Declare the request category without widening asset instructions into whole-film design choices')
        mappings = req.get('fulfillments')
        if not isinstance(mappings, list) or not mappings:
            fail('requirement_targets', path, 'Bind the request to actual SH/TR targets'); continue
        allowed = req.get('allowedDimensions')
        if kind == 'spatial' and (not isinstance(allowed, list) or not allowed or any(v not in ('2d', '2.5d', '3d') for v in allowed)):
            fail('requirement_dimension', path, 'State dimensions chosen from the actual brief; 3D is not a universal quota')
        seen = set()
        for mapping in mappings:
            if not isinstance(mapping, dict):
                fail('requirement_fulfillment', path, 'Expected fulfillment object'); continue
            sid = mapping.get('target'); row = targets.get(sid) if isinstance(sid, str) else None
            if row is None or sid in seen:
                fail('requirement_target', path, 'Each referenced SH/TR must exist and be unique'); continue
            seen.add(sid)
            for key in ('initial', 'process', 'result'):
                if not present(mapping.get(key)):
                    fail('requirement_process', path + '.' + str(sid), 'Describe an observable initial state, intermediate process and result')
            if kind not in ('motion', 'spatial'):
                continue
            channels = mapping.get('channels')
            motion = row.get('motionBinding') if isinstance(row.get('motionBinding'), dict) else {}
            camera = row.get('cameraBinding') if isinstance(row.get('cameraBinding'), dict) else {}
            bound_channels = [motion.get('channels'), camera.get('channels')]
            declared = {c for group in bound_channels if isinstance(group, list) for c in group if isinstance(c, str)}
            if (not isinstance(channels, list) or not channels or
                    any(not isinstance(c, str) or c not in declared for c in channels)):
                fail('requirement_channels', path + '.' + sid, 'Required effect must bind the channels measured for this actual target'); continue
            if not any(c.rsplit('.', 1)[-1] not in ('sourceTime', 'time', 'frame', 'opacity') for c in channels):
                fail('requirement_playback_substitution', path + '.' + sid, 'Playback time / opacity cannot fulfill requested motion or dimensional change')
            if kind == 'spatial':
                depth_channels = mapping.get('depthChannels')
                if (not isinstance(depth_channels, list) or not depth_channels
                        or any(not isinstance(c, str) or c not in channels or c.rsplit('.', 1)[-1] in ('sourceTime', 'time', 'frame', 'opacity') for c in depth_channels)):
                    fail('requirement_depth_channels', path + '.' + sid, 'Bind the actual depth/hinge/shape channels responsible for the visible dimensional change')
                dimension = mapping.get('dimension')
                if not isinstance(allowed, list) or dimension not in allowed:
                    fail('requirement_dimension', path + '.' + sid, 'Implemented dimension does not fulfill the requested dimension')
                if dimension == '3d' and data.get('execution', {}).get('renderer') != 'custom':
                    fail('requirement_renderer', path + '.' + sid, 'A default 2.5D renderer cannot certify real 3D')
                if motion.get('mode') != 'animated':
                    fail('requirement_static_motion', path + '.' + sid, 'A requested spatial transformation needs actual animated object channels')
                for key in ('depthCue', 'subject'):
                    if not present(mapping.get(key)):
                        fail('requirement_spatial_evidence', path + '.' + sid, 'Specify the changing subject and visible thickness / occlusion / depth cue')
                if mapping.get('subject') != motion.get('subject'):
                    fail('requirement_subject', path + '.' + sid, 'Do not substitute presenter playback for the required object')
                if stage != 'design':
                    refs = mapping.get('implementation')
                    if not isinstance(refs, list) or not refs:
                        fail('requirement_implementation', path + '.' + sid, 'Bind current implementation locations')
                    else:
                        for ref in refs:
                            source_location(ref, inputs, base, fail, path + '.' + sid)

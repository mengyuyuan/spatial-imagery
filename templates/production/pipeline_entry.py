"""Shared preflight for supported render/export entrypoints. Not an OS sandbox.

Drafts may have unverified reviews, but cannot become completed deliveries.
Never executes a renderer or changes approval records.
"""
import argparse
import json
from pathlib import Path
from verify_production_gates import validate, digest_file


def check(project, mode, entry, design, output, scope, media=None):
    project = Path(project).resolve()
    errors = []
    def fail(code, message): errors.append({'code': code, 'message': message})
    def path(value): return (project / value).resolve()
    try:
        active = json.loads((project / 'pipeline-active.json').read_text(encoding='utf-8-sig'))
        manifest = path(active['manifest'])
        data = json.loads(manifest.read_text(encoding='utf-8-sig'))
        base = manifest.parent
        if active.get('version') != 1:
            fail('active_version', 'Explicit active-project identity version 1 required')
        for key, actual, role in [('entryPoint', entry, 'source'), ('designSource', design, 'design')]:
            expected = path(active[key]['path'])
            if path(actual) != expected or digest_file(expected) != active[key]['sha256']:
                fail('active_identity', f'{key} differs from the active revision; refresh identity and reviews')
            if not any(i.get('role') == role and (base / i.get('path', '')).resolve() == expected
                       and i.get('sha256') == active[key]['sha256'] for i in data.get('inputs', [])):
                fail('manifest_identity', f'{key} is not bound by the current gate inputs')
        declared_design = data.get('execution', {}).get('designSource')
        if not isinstance(declared_design, str) or (base / declared_design).resolve() != path(design):
            fail('design_source_mismatch', 'The renderer and gate must use the same design source')
        if not any((base / s).resolve() == path(entry) for s in data.get('execution', {}).get('parameterSources', [])):
            fail('entry_source_mismatch', 'Actual composition entrypoint is absent from gate parameterSources')
        for key in ('scope', 'fps', 'width', 'height'):
            if active.get(key) != data.get(key):
                fail('active_format', f'Current {key} differs from the gate manifest')
        whole = active.get('scope', [])
        if (not isinstance(scope, list) or len(scope) != 2 or len(whole) != 2
                or any(type(x) is not int for x in scope + whole)
                or not whole[0] <= scope[0] < scope[1] <= whole[1]):
            fail('active_range', 'Requested frames must fit the actual active composition')
        if mode not in ('draft', 'full-render', 'delivery'):
            fail('entry_mode', 'Use draft, full-render or delivery; no complete-review bypass')
        destination = path(output)
        draft_root = project / 'qa' / 'pipeline-review'
        if mode == 'draft' and not destination.is_relative_to(draft_root):
            fail('draft_destination', 'Draft output is restricted to project/qa/pipeline-review; not a delivery folder')
        if mode == 'delivery':
            if scope != whole:
                fail('delivery_scope', 'Delivery must match the current full composition')
            final = next((m for m in data.get('media', []) if m.get('id') == data.get('finalMedia')), None)
            if (not media or not final or final.get('role') != 'final'
                    or (base / final.get('path', '')).resolve() != path(media)
                    or [final.get('from'), final.get('to')] != whole):
                fail('delivery_identity', 'Only the exact registered full final encode can be exported')
        # Fail identity checks before hashing unrelated old assets or launching any expensive work.
        if errors:
            return {'allowed': False, 'completed': False, 'mode': mode, 'errors': errors}
        result = validate(data, base, 'design' if mode == 'draft' else mode)
        if mode == 'draft':
            # Incomplete semantic/subjective reviews are allowed for diagnosing a current design.
            fatal = [e for e in result.get('errors', []) if e['code'].startswith('requirement_')
                     or e['code'] in ('execution_version', 'schema')
                     or e['code'] in ('stale_file', 'missing_file') and e.get('path', '').startswith('inputs[')]
            errors.extend(fatal)
        elif not result['eligible']:
            errors.extend(result['errors'])
        return {'allowed': not errors, 'completed': mode == 'delivery' and not errors,
                'mode': mode, 'binding': result.get('binding'), 'gateEligible': result['eligible'],
                'errors': errors, 'unresolved': result.get('errors', []) if mode == 'draft' else [],
                'boundary': 'Bound entrypoint preflight; manual external commands can bypass it and must not be described as compliant production.'}
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        return {'allowed': False, 'completed': False, 'mode': mode,
                'errors': [{'code': 'entry_configuration', 'message': str(exc)}]}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--project', type=Path, required=True)
    p.add_argument('--mode', choices=['draft', 'full-render', 'delivery'], required=True)
    p.add_argument('--entry', required=True)
    p.add_argument('--design', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--range', nargs=2, type=int, required=True, dest='scope')
    p.add_argument('--media')
    args = p.parse_args()
    result = check(args.project, args.mode, args.entry, args.design, args.output, args.scope, args.media)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['allowed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

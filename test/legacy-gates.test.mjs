import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {requireDiagnosticMode} from '../examples/launch-film/draft-only.mjs';

test('historical render and reproduction entries cannot bypass production gates',()=>{
  for(const name of ['render.mjs','render-kinetic.mjs','reproduce.mjs']){
    const r=spawnSync(process.execPath,[`examples/launch-film/${name}`],{encoding:'utf8'});
    assert.notEqual(r.status,0);assert.match(r.stderr,/Production gate blocked/);
    assert.doesNotMatch(r.stderr,/Cannot find package/);
  }
});
test('historical diagnostics require explicit draft or their supported still-only flag',()=>{
  assert.doesNotThrow(()=>requireDiagnosticMode(['--draft']));
  assert.doesNotThrow(()=>requireDiagnosticMode(['--stills'],'--stills'));
  assert.throws(()=>requireDiagnosticMode(['--frames=1']));
  assert.throws(()=>requireDiagnosticMode(['--layout-check'],'--stills'));
});

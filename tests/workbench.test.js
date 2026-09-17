import test from 'node:test';
import assert from 'node:assert/strict';
import { compileGraph } from '../src/dag.js';
import { projectEvents } from '../src/engine.js';
import { buildKnowledgeBase, compileContextPack } from '../src/knowledge.js';
import { runRiskReview } from '../src/review.js';
import { documents, events, scenario } from '../examples/synthetic-demo.js';

test('end-to-end review compiles evidence, replays events, and returns an auditable decision', () => {
  const knowledgeBase = buildKnowledgeBase(documents);
  const result = runRiskReview({ knowledgeBase, scenario, events });
  assert.equal(result.review.decision, 'APPROVE');
  assert.equal(result.review.graphStable, true);
  assert.equal(result.snapshots.length, 4);
  assert.ok(result.contextPack.evidence.length >= 6);
  assert.ok(result.snapshots.at(-1).trace.some((node) => node.nodeId === 'buying_capacity'));
});

test('event projection preserves quantity conservation after partial fill and cancel', () => {
  const timeline = projectEvents(scenario.baseState, events);
  const order = timeline.at(-1).state.order;
  assert.deepEqual(order, {
    totalQty: 40,
    filledQty: 15,
    cancelledQty: 25,
    remainingQty: 0,
    limitPrice: 102,
    status: 'CANCELLED'
  });
});

test('a fill larger than the remaining order fails closed', () => {
  assert.throws(
    () => projectEvents(scenario.baseState, [
      { type: 'ORDER_ACCEPTED', quantity: 2, limitPrice: 100 },
      { type: 'PARTIAL_FILL', quantity: 3, price: 100 }
    ]),
    (error) => error.code === 'INVALID_FILL'
  );
});

test('dependency cycles are rejected', () => {
  assert.throws(
    () => compileGraph([
      { id: 'a', kind: 'formula', dependsOn: ['b'], version: '1', unit: 'x' },
      { id: 'b', kind: 'formula', dependsOn: ['a'], version: '1', unit: 'x' }
    ], ['a']),
    (error) => error.code === 'CYCLE_DETECTED'
  );
});

test('missing evidence blocks context-pack compilation', () => {
  const graph = compileGraph([
    { id: 'x', kind: 'input', dependsOn: [], version: '1', unit: 'USD' },
    { id: 'unexplained', kind: 'formula', dependsOn: ['x'], expression: 'x', version: '1', unit: 'USD', compute: ({ x }) => x }
  ], ['unexplained']);
  assert.throws(
    () => compileContextPack({ knowledgeBase: buildKnowledgeBase(documents), scenario, graph }),
    (error) => error.code === 'MISSING_EVIDENCE'
  );
});

test('non-synthetic scenarios are blocked', () => {
  assert.throws(
    () => runRiskReview({
      knowledgeBase: buildKnowledgeBase(documents),
      scenario: { ...scenario, synthetic: false },
      events
    }),
    (error) => error.code === 'NON_SYNTHETIC_SCENARIO_BLOCKED'
  );
});

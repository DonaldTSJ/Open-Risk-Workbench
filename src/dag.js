import { fnv1a64, invariant, stableStringify } from './util.js';

export function compileGraph(definitions, targets) {
  const byId = new Map(definitions.map((node) => [node.id, node]));
  invariant(byId.size === definitions.length, 'DUPLICATE_NODE_ID');

  const included = new Set();
  const visiting = new Set();
  const visited = new Set();
  const order = [];

  function visit(id, trail = []) {
    invariant(byId.has(id), 'MISSING_DEPENDENCY', { id, trail });
    if (visiting.has(id)) {
      throw Object.assign(new Error('CYCLE_DETECTED'), {
        code: 'CYCLE_DETECTED',
        details: { cycle: [...trail, id] }
      });
    }
    if (visited.has(id)) return;
    visiting.add(id);
    included.add(id);
    const node = byId.get(id);
    for (const dependency of node.dependsOn ?? []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const target of targets) visit(target);
  const nodes = order.map((id) => {
    const node = byId.get(id);
    return {
      id: node.id,
      kind: node.kind,
      dependsOn: node.dependsOn ?? [],
      expression: node.expression ?? null,
      unit: node.unit,
      version: node.version
    };
  });
  const edges = nodes.flatMap((node) =>
    node.dependsOn.map((from) => ({ from, to: node.id, kind: 'FORMULA_INPUT' }))
  );
  const manifest = { targets, nodes, edges, topologicalOrder: order };

  return {
    ...manifest,
    cycleCheck: 'PASS',
    hashAlgorithm: 'fnv1a64',
    graphHash: fnv1a64(stableStringify(manifest)),
    executable: true,
    implementation: new Map(order.map((id) => [id, byId.get(id)]))
  };
}

export function executeGraph(graph, inputs) {
  const values = new Map(Object.entries(inputs));
  const trace = [];

  for (const id of graph.topologicalOrder) {
    const node = graph.implementation.get(id);
    if (node.kind === 'input') {
      invariant(values.has(id), 'MISSING_INPUT', { id });
    } else {
      const args = Object.fromEntries(node.dependsOn.map((dep) => [dep, values.get(dep)]));
      const value = node.compute(args);
      invariant(Number.isFinite(value), 'NON_FINITE_RESULT', { id, args });
      values.set(id, value);
    }
    trace.push({
      nodeId: id,
      kind: node.kind,
      value: values.get(id),
      unit: node.unit,
      expression: node.expression ?? 'scenario input'
    });
  }

  return {
    graphHash: graph.graphHash,
    outputs: Object.fromEntries(graph.targets.map((id) => [id, values.get(id)])),
    trace
  };
}

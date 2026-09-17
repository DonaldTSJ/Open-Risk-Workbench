import { invariant } from './util.js';

const ACCEPTED_EVIDENCE = new Set(['PUBLIC', 'SYNTHETIC_VERIFIED']);

export function buildKnowledgeBase(documents) {
  const documentIds = new Set();
  const claimIds = new Set();
  const claims = [];
  const nodes = [];
  const edges = [];

  for (const document of documents) {
    invariant(!documentIds.has(document.id), 'DUPLICATE_DOCUMENT_ID', { id: document.id });
    documentIds.add(document.id);
    nodes.push({ id: document.id, kind: 'DOCUMENT', label: document.title });

    for (const claim of document.claims) {
      invariant(!claimIds.has(claim.id), 'DUPLICATE_CLAIM_ID', { id: claim.id });
      claimIds.add(claim.id);
      const normalized = { ...claim, documentId: document.id };
      claims.push(normalized);
      nodes.push({ id: claim.id, kind: 'CLAIM', label: claim.statement });
      edges.push({ from: document.id, to: claim.id, kind: 'SUPPORTS' });
      for (const target of claim.supports) {
        nodes.push({ id: target, kind: 'MODEL_TERM', label: target });
        edges.push({ from: claim.id, to: target, kind: 'JUSTIFIES' });
      }
    }
  }

  const uniqueNodes = [...new Map(nodes.map((node) => [node.id, node])).values()];
  return { documents, claims, graph: { nodes: uniqueNodes, edges } };
}

export function compileContextPack({ knowledgeBase, scenario, graph }) {
  const requiredTerms = new Set(graph.nodes.map((node) => node.id));
  const evidence = knowledgeBase.claims.filter((claim) =>
    claim.supports.some((term) => requiredTerms.has(term))
  );
  const unsupported = graph.nodes
    .filter((node) => node.kind === 'formula')
    .filter((node) => !evidence.some((claim) => claim.supports.includes(node.id)))
    .map((node) => node.id);
  const unacceptable = evidence
    .filter((claim) => !ACCEPTED_EVIDENCE.has(claim.status))
    .map((claim) => claim.id);

  invariant(unsupported.length === 0, 'MISSING_EVIDENCE', { unsupported });
  invariant(unacceptable.length === 0, 'UNACCEPTABLE_EVIDENCE', { unacceptable });

  return {
    id: `PACK-${scenario.id}-${scenario.version}`,
    scenario: {
      id: scenario.id,
      version: scenario.version,
      synthetic: scenario.synthetic,
      targets: scenario.targets
    },
    graph: {
      graphHash: graph.graphHash,
      hashAlgorithm: graph.hashAlgorithm,
      nodes: graph.nodes,
      edges: graph.edges,
      topologicalOrder: graph.topologicalOrder
    },
    evidence: evidence.map((claim) => ({
      claimId: claim.id,
      documentId: claim.documentId,
      status: claim.status,
      supports: claim.supports
    })),
    governance: {
      productionAuthority: false,
      synthetic: true,
      unresolvedQuestions: []
    }
  };
}

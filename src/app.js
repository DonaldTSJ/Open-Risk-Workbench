import { documents, events, scenario } from '../examples/synthetic-demo.js';
import { buildKnowledgeBase } from './knowledge.js';
import { runRiskReview } from './review.js';

const knowledgeBase = buildKnowledgeBase(documents);
const result = runRiskReview({ knowledgeBase, scenario, events });
let activeStep = result.snapshots.length - 1;

const pipeline = [
  ['01', 'Document evidence', 'Claims retain provenance, status, scope, and ownership.'],
  ['02', 'Knowledge graph', 'Typed edges connect evidence to state and formula terms.'],
  ['03', 'Context Pack', 'Only supported, versioned dependencies become executable.'],
  ['04', 'Scenario replay', 'Events project state; the locked graph computes every snapshot.'],
  ['05', 'Audit review', 'Decision, checks, trace, and evidence ship together.']
];

document.querySelector('#pipeline').innerHTML = pipeline.map(([number, title, copy]) => `
  <article class="pipe-card"><b>${number}</b><h3>${title}</h3><p>${copy}</p></article>
`).join('');

document.querySelector('#evidence-count').textContent = `${result.contextPack.evidence.length} supported claims`;
document.querySelector('#evidence-grid').innerHTML = knowledgeBase.claims.map((claim) => `
  <div class="claim">
    <b>${claim.status}</b>
    <p>${claim.statement}</p>
    <small>${claim.id} → ${claim.supports.join(', ')}</small>
  </div>
`).join('');

document.querySelector('#graph-hash').textContent = `${result.contextPack.graph.hashAlgorithm}:${result.contextPack.graph.graphHash}`;

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function renderControls() {
  document.querySelector('#step-controls').innerHTML = result.snapshots.map((snapshot, index) => `
    <button class="step-button ${index === activeStep ? 'active' : ''}" data-step="${index}">
      S${index} ${snapshot.event}
    </button>
  `).join('');
  document.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      activeStep = Number(button.dataset.step);
      render();
    });
  });
}

function renderDecision() {
  const snapshot = result.snapshots[activeStep];
  const isFinal = activeStep === result.snapshots.length - 1;
  const capacity = snapshot.outputs.buying_capacity;
  const decision = capacity >= result.review.probeOrderNotional ? 'APPROVE' : 'REJECT';
  document.querySelector('#decision').innerHTML = `
    <span class="decision-badge" style="background:${decision === 'APPROVE' ? 'var(--green)' : 'var(--orange)'}">${decision}</span>
    <div class="decision-value">${money(capacity)}</div>
    <div class="decision-caption">capacity at S${activeStep}; probe order ${money(result.review.probeOrderNotional)}${isFinal ? ' · final review' : ''}</div>
    <ul class="checks">
      ${result.review.checks.map((check) => `<li><span>${check.id}</span><strong>${check.status}</strong></li>`).join('')}
    </ul>
  `;
}

function renderTimeline() {
  document.querySelector('#timeline').innerHTML = `
    <table>
      <thead><tr><th>Snapshot</th><th>Cash ledger</th><th>Position</th><th>Remaining</th><th>Capacity</th></tr></thead>
      <tbody>
        ${result.snapshots.map((snapshot, index) => `
          <tr class="${index === activeStep ? 'active' : ''}">
            <td>S${index} · ${snapshot.event}</td>
            <td>${money(snapshot.state.cashLedger)}</td>
            <td>${snapshot.state.positionQty}</td>
            <td>${snapshot.state.order?.remainingQty ?? 0}</td>
            <td>${money(snapshot.outputs.buying_capacity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTrace() {
  const snapshot = result.snapshots[activeStep];
  document.querySelector('#trace').innerHTML = snapshot.trace.map((node) => `
    <div class="trace-row">
      <code>${node.nodeId}</code><strong>${typeof node.value === 'number' ? node.value.toLocaleString('en-US') : node.value}</strong>
      <small>${node.expression} · ${node.unit}</small>
    </div>
  `).join('');
}

function render() {
  renderControls();
  renderDecision();
  renderTimeline();
  renderTrace();
}

render();

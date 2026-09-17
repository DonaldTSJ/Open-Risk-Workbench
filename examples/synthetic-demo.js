export const documents = [
  {
    id: 'DOC-SYN-001',
    title: 'Synthetic order-state policy',
    sourceKind: 'SYNTHETIC_DESIGN',
    license: 'Apache-2.0',
    claims: [
      {
        id: 'CLAIM-SYN-001',
        statement: 'Only the unfilled remainder reserves synthetic cash.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['reserved_cash', 'available_cash']
      },
      {
        id: 'CLAIM-SYN-002',
        statement: 'A fill reduces the cash ledger and increases the position quantity.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['position_notional']
      }
    ]
  },
  {
    id: 'DOC-SYN-002',
    title: 'Synthetic risk-resource model',
    sourceKind: 'SYNTHETIC_DESIGN',
    license: 'Apache-2.0',
    claims: [
      {
        id: 'CLAIM-SYN-003',
        statement: 'Recognized synthetic notional is the sum of position and pending notionals.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['pending_notional', 'risk_notional']
      },
      {
        id: 'CLAIM-SYN-004',
        statement: 'Synthetic initial margin is a scenario parameter applied to risk notional.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['initial_margin', 'collateral']
      },
      {
        id: 'CLAIM-SYN-005',
        statement: 'Synthetic risk resource combines available cash and collateral.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['risk_resource']
      },
      {
        id: 'CLAIM-SYN-006',
        statement: 'Capacity is the lower of a risk-side and funding-side synthetic limit.',
        status: 'SYNTHETIC_VERIFIED',
        supports: ['risk_side_capacity', 'funding_side_capacity', 'buying_capacity']
      }
    ]
  }
];

export const scenario = {
  id: 'SYNTHETIC-EQUITY-LONG-OPEN',
  version: '1.0.0',
  synthetic: true,
  description: 'A synthetic buy order moves from accepted to partial fill to cancellation.',
  baseState: { cashLedger: 20000, positionQty: 100, order: null },
  marketPrice: 100,
  initialMarginRate: 0.25,
  targetMarginRate: 0.5,
  financingLimit: 15000,
  probeOrderNotional: 25000,
  targets: ['buying_capacity']
};

export const events = [
  { type: 'ORDER_ACCEPTED', quantity: 40, limitPrice: 102 },
  { type: 'PARTIAL_FILL', quantity: 15, price: 99 },
  { type: 'CANCEL_REMAINDER' }
];

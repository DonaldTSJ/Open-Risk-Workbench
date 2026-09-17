import { invariant, roundMoney } from './util.js';

export function projectEvents(baseState, events) {
  const state = structuredClone(baseState);
  const timeline = [{ event: 'BASELINE', state: structuredClone(state) }];

  for (const event of events) {
    if (event.type === 'ORDER_ACCEPTED') {
      invariant(!state.order, 'ACTIVE_ORDER_EXISTS');
      invariant(event.quantity > 0 && event.limitPrice > 0, 'INVALID_ORDER');
      state.order = {
        totalQty: event.quantity,
        filledQty: 0,
        cancelledQty: 0,
        remainingQty: event.quantity,
        limitPrice: event.limitPrice,
        status: 'OPEN'
      };
    } else if (event.type === 'PARTIAL_FILL') {
      invariant(state.order?.status === 'OPEN', 'NO_OPEN_ORDER');
      invariant(event.quantity > 0 && event.quantity <= state.order.remainingQty, 'INVALID_FILL');
      invariant(event.price > 0, 'INVALID_FILL_PRICE');
      state.order.filledQty += event.quantity;
      state.order.remainingQty -= event.quantity;
      state.cashLedger = roundMoney(state.cashLedger - event.quantity * event.price);
      state.positionQty += event.quantity;
      if (state.order.remainingQty === 0) state.order.status = 'FILLED';
    } else if (event.type === 'CANCEL_REMAINDER') {
      invariant(state.order?.status === 'OPEN', 'NO_OPEN_ORDER');
      state.order.cancelledQty += state.order.remainingQty;
      state.order.remainingQty = 0;
      state.order.status = 'CANCELLED';
    } else if (event.type === 'ORDER_REJECTED') {
      invariant(state.order?.status === 'OPEN', 'NO_OPEN_ORDER');
      invariant(state.order.filledQty === 0, 'CANNOT_REJECT_AFTER_FILL');
      state.order.cancelledQty = state.order.remainingQty;
      state.order.remainingQty = 0;
      state.order.status = 'REJECTED';
    } else {
      throw Object.assign(new Error('UNKNOWN_EVENT'), { code: 'UNKNOWN_EVENT', details: event });
    }
    assertState(state);
    timeline.push({ event: event.type, state: structuredClone(state) });
  }
  return timeline;
}

export function assertState(state) {
  invariant(state.cashLedger >= 0, 'NEGATIVE_SYNTHETIC_CASH');
  invariant(state.positionQty >= 0, 'NEGATIVE_SYNTHETIC_POSITION');
  if (state.order) {
    const accounted = state.order.filledQty + state.order.cancelledQty + state.order.remainingQty;
    invariant(accounted === state.order.totalQty, 'QUANTITY_CONSERVATION_FAILED', {
      total: state.order.totalQty,
      accounted
    });
    invariant(state.order.remainingQty >= 0, 'NEGATIVE_REMAINING_QUANTITY');
  }
}

export function stateToInputs(state, scenario) {
  return {
    cash_ledger: state.cashLedger,
    position_qty: state.positionQty,
    remaining_qty: state.order?.remainingQty ?? 0,
    limit_price: state.order?.limitPrice ?? scenario.marketPrice,
    market_price: scenario.marketPrice,
    initial_margin_rate: scenario.initialMarginRate,
    target_margin_rate: scenario.targetMarginRate,
    financing_limit: scenario.financingLimit
  };
}

export function createFormulaDefinitions() {
  const input = (id, unit) => ({ id, kind: 'input', unit, version: '1.0.0', dependsOn: [] });
  const formula = (id, unit, dependsOn, expression, compute) => ({
    id,
    kind: 'formula',
    unit,
    version: '1.0.0',
    dependsOn,
    expression,
    compute
  });

  return [
    input('cash_ledger', 'USD'),
    input('position_qty', 'share'),
    input('remaining_qty', 'share'),
    input('limit_price', 'USD/share'),
    input('market_price', 'USD/share'),
    input('initial_margin_rate', 'ratio'),
    input('target_margin_rate', 'ratio'),
    input('financing_limit', 'USD'),
    formula('reserved_cash', 'USD', ['remaining_qty', 'limit_price'], 'remaining_qty × limit_price', (v) => roundMoney(v.remaining_qty * v.limit_price)),
    formula('available_cash', 'USD', ['cash_ledger', 'reserved_cash'], 'cash_ledger − reserved_cash', (v) => roundMoney(v.cash_ledger - v.reserved_cash)),
    formula('position_notional', 'USD', ['position_qty', 'market_price'], 'position_qty × market_price', (v) => roundMoney(v.position_qty * v.market_price)),
    formula('pending_notional', 'USD', ['remaining_qty', 'limit_price', 'market_price'], 'remaining_qty × min(limit_price, market_price)', (v) => roundMoney(v.remaining_qty * Math.min(v.limit_price, v.market_price))),
    formula('risk_notional', 'USD', ['position_notional', 'pending_notional'], 'position_notional + pending_notional', (v) => roundMoney(v.position_notional + v.pending_notional)),
    formula('initial_margin', 'USD', ['risk_notional', 'initial_margin_rate'], 'risk_notional × initial_margin_rate', (v) => roundMoney(v.risk_notional * v.initial_margin_rate)),
    formula('collateral', 'USD', ['risk_notional', 'initial_margin'], 'risk_notional − initial_margin', (v) => roundMoney(v.risk_notional - v.initial_margin)),
    formula('risk_resource', 'USD', ['available_cash', 'collateral'], 'available_cash + collateral', (v) => roundMoney(v.available_cash + v.collateral)),
    formula('risk_side_capacity', 'USD', ['risk_resource', 'target_margin_rate'], 'risk_resource ÷ target_margin_rate', (v) => roundMoney(v.risk_resource / v.target_margin_rate)),
    formula('funding_side_capacity', 'USD', ['risk_resource', 'financing_limit'], 'risk_resource + financing_limit', (v) => roundMoney(v.risk_resource + v.financing_limit)),
    formula('buying_capacity', 'USD', ['risk_side_capacity', 'funding_side_capacity'], 'max(0, min(risk_side_capacity, funding_side_capacity))', (v) => roundMoney(Math.max(0, Math.min(v.risk_side_capacity, v.funding_side_capacity))))
  ];
}

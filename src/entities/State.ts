import { ethereum } from '@graphprotocol/graph-ts';
import { FeePayout, Fund, Portfolio, Share, State } from '../generated/schema';
import { logCritical } from '../utils/logCritical';
import { useFeePayout } from './FeePayout';
import { usePortfolio } from './Portfolio';
import { useShares } from './Shares';

export function stateId(fund: Fund, event: ethereum.Event): string {
  return fund.id + '/' + event.block.timestamp.toString();
}

export function createState(
  shares: Share,
  holdings: Portfolio,
  feePayout: FeePayout,
  fund: Fund,
  event: ethereum.Event,
): State {
  let state = new State(stateId(fund, event));
  state.timestamp = event.block.timestamp;
  state.fund = fund.id;
  state.shares = shares.id;
  state.portfolio = holdings.id;
  state.feePayout = feePayout.id;
  state.events = [];
  state.save();

  // load additional infos

  return state;
}

export function ensureState(fund: Fund, event: ethereum.Event): State {
  let current = State.load(stateId(fund, event)) as State;
  if (current) {
    return current;
  }

  let previous = useState(fund.state);
  let shares = useShares(previous.shares);
  let holdings = usePortfolio(previous.portfolio);
  let feePayout = useFeePayout(previous.feePayout);
  let state = createState(shares, holdings, feePayout, fund, event);

  fund.state = state.id;
  fund.save();

  return state;
}

export function useState(id: string): State {
  let state = State.load(id) as State;
  if (state == null) {
    logCritical('Failed to load fund aggregated state {}.', [id]);
  }

  return state;
}

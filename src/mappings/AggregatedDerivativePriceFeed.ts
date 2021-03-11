import { checkSynthetix, ensureAsset } from '../entities/Asset';
import { fetchAssetPrice, trackAssetPrice } from '../entities/AssetPrice';
import {
  checkAaveAssetDetails,
  checkAlphaAssetDetails,
  checkChai,
  checkCompoundAssetDetails,
} from '../entities/SingleUnderlyingAssetDetail';
import { ensureTransaction } from '../entities/Transaction';
import { checkUniswapV2PoolAssetDetail } from '../entities/UniswapV2PoolAssetDetail';
import {
  DerivativeAdded,
  DerivativeRemoved,
  DerivativeUpdated,
} from '../generated/AggregatedDerivativePriceFeedContract';
import { DerivativeAddedEvent, DerivativeRemovedEvent, DerivativeUpdatedEvent } from '../generated/schema';
import { arrayDiff } from '../utils/arrayDiff';
import { arrayUnique } from '../utils/arrayUnique';
import { ensureCron, triggerCron } from '../utils/cronManager';
import { genericId } from '../utils/genericId';

export function handleDerivativeAdded(event: DerivativeAdded): void {
  let derivative = ensureAsset(event.params.derivative);
  derivative.removed = false;
  derivative.type = 'DERIVATIVE';
  derivative.save();

  checkAaveAssetDetails(derivative);
  checkAlphaAssetDetails(derivative);
  checkChai(derivative);
  checkCompoundAssetDetails(derivative);
  checkSynthetix(derivative);
  checkUniswapV2PoolAssetDetail(derivative);

  let derivativeAdded = new DerivativeAddedEvent(genericId(event));
  derivativeAdded.derivative = derivative.id;
  derivativeAdded.timestamp = event.block.timestamp;
  derivativeAdded.transaction = ensureTransaction(event).id;
  derivativeAdded.priceFeed = event.params.priceFeed.toHex();
  derivativeAdded.save();

  // Whenever a new asset is registered, we need to fetch its current price immediately.
  let current = fetchAssetPrice(derivative);
  trackAssetPrice(derivative, event.block.timestamp, current);

  let cron = ensureCron();
  cron.derivatives = arrayUnique<string>(cron.derivatives.concat([derivative.id]));
  cron.save();

  // It's important that we run cron last.
  triggerCron(event.block.timestamp);
}

export function handleDerivativeRemoved(event: DerivativeRemoved): void {
  let derivative = ensureAsset(event.params.derivative);
  derivative.removed = true;
  derivative.save();

  let derivativeRemoved = new DerivativeRemovedEvent(genericId(event));
  derivativeRemoved.derivative = derivative.id;
  derivativeRemoved.timestamp = event.block.timestamp;
  derivativeRemoved.transaction = ensureTransaction(event).id;
  derivativeRemoved.save();

  let cron = ensureCron();
  cron.derivatives = arrayDiff<string>(cron.derivatives, [derivative.id]);
  cron.save();

  // It's important that we run cron last.
  triggerCron(event.block.timestamp);
}

export function handleDerivativeUpdated(event: DerivativeUpdated): void {
  let derivative = ensureAsset(event.params.derivative);

  let derivativeUpdated = new DerivativeUpdatedEvent(genericId(event));
  derivativeUpdated.derivative = derivative.id;
  derivativeUpdated.timestamp = event.block.timestamp;
  derivativeUpdated.transaction = ensureTransaction(event).id;
  derivativeUpdated.prevPriceFeed = event.params.prevPriceFeed.toHex();
  derivativeUpdated.nextPriceFeed = event.params.nextPriceFeed.toHex();
  derivativeUpdated.save();

  // Whenever a new asset is registered, we need to fetch its current price immediately.
  let current = fetchAssetPrice(derivative);
  trackAssetPrice(derivative, event.block.timestamp, current);

  // It's important that we run cron last.
  triggerCron(event.block.timestamp);
}

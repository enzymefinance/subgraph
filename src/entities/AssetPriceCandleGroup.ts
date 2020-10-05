import { BigInt } from '@graphprotocol/graph-ts';
import { HourlyAssetPriceCandle, DailyAssetPriceCandle, WeeklyAssetPriceCandle } from '../generated/schema';
import { hour, day, week } from '../utils/timeHelpers';
import { AssetPriceCandleGroup } from './AssetPriceEntity';

export function ensureHourlyAssetPriceCandleGroup(from: BigInt): HourlyAssetPriceCandle {
  let to = from.plus(hour);
  return ensureAssetPriceCandleGroup('Hourly', from, to) as HourlyAssetPriceCandle;
}

export function ensureDailyAssetPriceCandleGroup(from: BigInt): DailyAssetPriceCandle {
  let to = from.plus(day);
  return ensureAssetPriceCandleGroup('Daily', from, to) as DailyAssetPriceCandle;
}

export function ensureWeeklyAssetPriceCandleGroup(from: BigInt): WeeklyAssetPriceCandle {
  let to = from.plus(week);
  return ensureAssetPriceCandleGroup('Weekly', from, to) as WeeklyAssetPriceCandle;
}

function ensureAssetPriceCandleGroup(type: string, from: BigInt, to: BigInt): AssetPriceCandleGroup {
  let id = from.toString();
  let group = AssetPriceCandleGroup.load(type, id) as AssetPriceCandleGroup;
  if (group != null) {
    return group;
  }

  group = new AssetPriceCandleGroup(id);
  group.from = from;
  group.to = to;
  group.save(type);

  return group;
}

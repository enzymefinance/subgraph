import {
  AccessorSet,
  Approval,
  AssetWithdrawn,
  MigratorSet,
  OwnerSet,
  TrackedAssetAdded,
  TrackedAssetRemoved,
  Transfer,
  VaultLibSet,
} from '../generated/VaultLibContract';
import { useFund } from '../entities/Fund';
import { ensureAsset } from '../entities/Asset';
import { TrackedAssetAddition, TrackedAssetRemoval, AssetWithdrawal } from '../generated/schema';
import { arrayUnique } from '../utils/arrayUnique';
import { arrayDiff } from '../utils/arrayDiff';
import { genericId } from '../utils/genericId';
import { ensureTransaction } from '../entities/Transaction';
import { ensureAccount } from '../entities/Account';
import { Address } from '@graphprotocol/graph-ts';
import { ensureContract } from '../entities/Contract';

export function handleAccessorSet(event: AccessorSet): void {}
export function handleApproval(event: Approval): void {}

export function handleAssetWithdrawn(event: AssetWithdrawn): void {
  let asset = ensureAsset(event.params.asset);
  let fund = useFund(event.address.toHex());
  let id = genericId(event);
  let address = Address.fromString(ensureTransaction(event).from);
  let withdrawal = new AssetWithdrawal(id);
  withdrawal.asset = asset.id;
  withdrawal.fund = fund.id;
  withdrawal.account = ensureAccount(address).id;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.transaction = ensureTransaction(event).id;
  withdrawal.target = event.params.target;
  withdrawal.amount = event.params.amount;
  withdrawal.save();
}

export function handleMigratorSet(event: MigratorSet): void {}
export function handleOwnerSet(event: OwnerSet): void {}

export function handleTrackedAssetAdded(event: TrackedAssetAdded): void {
  let asset = ensureAsset(event.params.asset);
  let fund = useFund(event.address.toHex());

  let id = genericId(event);
  let trackedAssetAddition = new TrackedAssetAddition(id);
  trackedAssetAddition.asset = asset.id;
  trackedAssetAddition.fund = fund.id;
  trackedAssetAddition.account = ensureAccount(Address.fromString(fund.manager)).id;
  trackedAssetAddition.contract = ensureContract(event.address, 'VaultLib', event.block.timestamp).id;
  trackedAssetAddition.timestamp = event.block.timestamp;
  trackedAssetAddition.transaction = ensureTransaction(event).id;
  trackedAssetAddition.save();

  fund.trackedAssets = arrayUnique<string>(fund.trackedAssets.concat([asset.id]));
  fund.save();
}

export function handleTrackedAssetRemoved(event: TrackedAssetRemoved): void {
  let asset = ensureAsset(event.params.asset);
  let fund = useFund(event.address.toHex());

  let id = genericId(event);
  let trackedAssetRemoval = new TrackedAssetRemoval(id);
  trackedAssetRemoval.asset = asset.id;
  trackedAssetRemoval.fund = fund.id;
  trackedAssetRemoval.timestamp = event.block.timestamp;
  trackedAssetRemoval.account = ensureAccount(Address.fromString(fund.manager)).id;
  trackedAssetRemoval.contract = ensureContract(event.address, 'VaultLib', event.block.timestamp).id;
  trackedAssetRemoval.transaction = ensureTransaction(event).id;
  trackedAssetRemoval.save();

  fund.trackedAssets = arrayDiff<string>(fund.trackedAssets, [asset.id]);
  fund.save();
}

export function handleTransfer(event: Transfer): void {}
export function handleVaultLibSet(event: VaultLibSet): void {}

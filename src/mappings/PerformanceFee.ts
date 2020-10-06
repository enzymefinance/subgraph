import { ensureManager } from '../entities/Account';
import { ensureContract } from '../entities/Contract';
import { useFee } from '../entities/Fee';
import { ensurePerformanceFeeSetting } from '../entities/PerformanceFeeSetting';
import { ensureTransaction } from '../entities/Transaction';
import { ComptrollerLibContract } from '../generated/ComptrollerLibContract';
import { ActivatedForFund, FundSettingsAdded, PaidOut, PerformanceUpdated } from '../generated/PerformanceFeeContract';
import { PerformanceFeeActivatedForFundEvent, PerformanceFeeSettingsAddedEvent } from '../generated/schema';
import { arrayUnique } from '../utils/arrayUnique';
import { genericId } from '../utils/genericId';
import { toBigDecimal } from '../utils/toBigDecimal';

export function handleActivatedForFund(event: ActivatedForFund): void {
  let comptroller = ComptrollerLibContract.bind(event.params.comptrollerProxy);
  let vault = comptroller.getVaultProxy();
  let fee = useFee(event.address.toHex());

  let feeActivation = new PerformanceFeeActivatedForFundEvent(genericId(event));
  feeActivation.fund = vault.toHex(); // fund does not exist yet
  feeActivation.account = ensureManager(event.transaction.from, event).id;
  feeActivation.contract = ensureContract(event.address, 'PerformanceFee').id;
  feeActivation.timestamp = event.block.timestamp;
  feeActivation.transaction = ensureTransaction(event).id;
  feeActivation.comptrollerProxy = event.params.comptrollerProxy.toHex();
  feeActivation.save();
}

export function handleFundSettingsAdded(event: FundSettingsAdded): void {
  let comptroller = ComptrollerLibContract.bind(event.params.comptrollerProxy);
  let vault = comptroller.getVaultProxy();
  let fee = useFee(event.address.toHex());
  let rate = toBigDecimal(event.params.rate);

  let feeSettings = new PerformanceFeeSettingsAddedEvent(genericId(event));
  feeSettings.fund = vault.toHex(); // fund does not exist yet
  feeSettings.account = ensureManager(event.transaction.from, event).id;
  feeSettings.contract = ensureContract(event.address, 'PerformanceFee').id;
  feeSettings.timestamp = event.block.timestamp;
  feeSettings.transaction = ensureTransaction(event).id;
  feeSettings.comptrollerProxy = event.params.comptrollerProxy.toHex();
  feeSettings.rate = rate;
  feeSettings.period = event.params.period;
  feeSettings.save();

  let setting = ensurePerformanceFeeSetting(vault.toHex(), fee);
  setting.rate = rate;
  setting.period = event.params.period;
  setting.events = arrayUnique<string>(setting.events.concat([feeSettings.id]));
  setting.timestamp = event.block.timestamp;
  setting.save();
}

export function handlePaidOut(event: PaidOut): void {}

export function handlePerformanceUpdated(event: PerformanceUpdated): void {}

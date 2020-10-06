import { BigDecimal, dataSource } from '@graphprotocol/graph-ts';
import { ensureAccount, ensureInvestor, useAccount } from '../entities/Account';
import { useAsset } from '../entities/Asset';
import { ensureContract } from '../entities/Contract';
import { useFund } from '../entities/Fund';
import { ensureInvestment } from '../entities/Investment';
import { trackFundPortfolio } from '../entities/Portfolio';
import { trackFundShares } from '../entities/Shares';
import { ensureTransaction } from '../entities/Transaction';
import {
  AmguPaid,
  SharesBought,
  SharesRedeemed,
  StatusUpdated,
  VaultProxySet,
} from '../generated/ComptrollerLibContract';
import {
  AmguPaidEvent,
  Asset,
  SharesBoughtEvent,
  SharesRedeemedEvent,
  StatusUpdatedEvent,
  VaultProxySetEvent,
} from '../generated/schema';
import { genericId } from '../utils/genericId';
import { toBigDecimal } from '../utils/toBigDecimal';

export function handleAmguPaid(event: AmguPaid): void {
  let amguPaid = new AmguPaidEvent(genericId(event));
  amguPaid.amount = toBigDecimal(event.params.ethPaid);
  amguPaid.payer = ensureAccount(event.params.payer, event).id;
  amguPaid.gas = event.params.gasUsed.toI32();
  amguPaid.timestamp = event.block.timestamp;
  amguPaid.transaction = ensureTransaction(event).id;
  amguPaid.save();
}

function translateFundStatus(status: number): string {
  if (status == 0) {
    return 'Pending';
  }

  if (status == 1) {
    return 'Active';
  }

  return 'Shutdown';
}

export function handleStatusUpdated(event: StatusUpdated): void {
  let fund = useFund(dataSource.context().getString('vaultProxy'));
  fund.status = translateFundStatus(event.params.nextStatus);
  fund.save();

  let statusUpdate = new StatusUpdatedEvent(genericId(event));
  statusUpdate.timestamp = event.block.timestamp;
  statusUpdate.contract = ensureContract(event.address, 'ComptrollerLib').id;
  statusUpdate.fund = fund.id;
  statusUpdate.account = useAccount(event.transaction.from.toHex()).id;
  statusUpdate.nextStatus = event.params.nextStatus;
  statusUpdate.transaction = ensureTransaction(event).id;
  statusUpdate.save();
}

export function handleSharesBought(event: SharesBought): void {
  let fund = useFund(dataSource.context().getString('vaultProxy'));
  let investor = ensureInvestor(event.params.buyer, event);
  let investment = ensureInvestment(investor, fund);
  let asset = useAsset(fund.denominationAsset);
  let shares = toBigDecimal(event.params.sharesReceived);

  let addition = new SharesBoughtEvent(genericId(event));
  addition.account = investment.investor;
  addition.investor = investment.investor;
  addition.fund = investment.fund;
  addition.contract = ensureContract(event.address, 'ComptrollerLib').id;
  addition.investment = investment.id;
  addition.asset = asset.id;
  addition.quantity = toBigDecimal(event.params.investmentAmount, asset.decimals);
  addition.shares = shares;
  addition.timestamp = event.block.timestamp;
  addition.transaction = ensureTransaction(event).id;
  addition.save();

  investment.shares = investment.shares.plus(shares);
  investment.save();

  trackFundPortfolio(fund, event, addition);
  trackFundShares(fund, event, addition);
}

export function handleSharesRedeemed(event: SharesRedeemed): void {
  let fund = useFund(dataSource.context().getString('vaultProxy'));
  let account = ensureInvestor(event.params.redeemer, event);
  let investment = ensureInvestment(account, fund);
  let shares = toBigDecimal(event.params.sharesQuantity);
  let assets = event.params.receivedAssets.map<Asset>((id) => useAsset(id.toHex()));
  let qtys = event.params.receivedAssetQuantities;

  let quantities: BigDecimal[] = [];
  for (let i: i32 = 0; i < assets.length; i++) {
    quantities.push(toBigDecimal(qtys[i], assets[i].decimals));
  }

  let redemption = new SharesRedeemedEvent(genericId(event));
  redemption.account = investment.investor;
  redemption.investor = investment.investor;
  redemption.fund = investment.fund;
  redemption.contract = ensureContract(event.address, 'ComptrollerLib').id;
  redemption.investment = investment.id;
  redemption.shares = shares;
  redemption.assets = assets.map<string>((item) => item.id);
  redemption.quantities = quantities;
  redemption.timestamp = event.block.timestamp;
  redemption.transaction = ensureTransaction(event).id;
  redemption.save();

  investment.shares = investment.shares.minus(shares);
  investment.save();

  trackFundPortfolio(fund, event, redemption);
  trackFundShares(fund, event, redemption);
}

export function handleVaultProxySet(event: VaultProxySet): void {
  let vaultProxySet = new VaultProxySetEvent(genericId(event));
  vaultProxySet.fund = event.params.vaultProxy.toHex();
  vaultProxySet.account = useAccount(event.transaction.from.toHex()).id;
  vaultProxySet.contract = ensureContract(event.address, 'ComptrollerLib').id;
  vaultProxySet.timestamp = event.block.timestamp;
  vaultProxySet.transaction = ensureTransaction(event).id;
  vaultProxySet.vaultProxy = event.params.vaultProxy.toHex();
  vaultProxySet.save();
}

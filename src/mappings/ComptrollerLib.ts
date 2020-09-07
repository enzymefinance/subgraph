import { BigDecimal, dataSource } from '@graphprotocol/graph-ts';
import { ensureInvestor, ensureAccount } from '../entities/Account';
import { useAsset } from '../entities/Asset';
import { createContractEvent } from '../entities/Event';
import { useFund } from '../entities/Fund';
import { createInvestmentAddition, createInvestmentRedemption, ensureInvestment } from '../entities/Investment';
import {
  AmguPaid,
  CallOnIntegrationExecuted,
  ComptrollerLibContract,
  FundStatusUpdated,
  SharesBought,
  SharesRedeemed,
  FundConfigSet,
} from '../generated/ComptrollerLibContract';
import { Asset, AmguPayment } from '../generated/schema';
import { toBigDecimal } from '../utils/tokenValue';

export function handleAmguPaid(event: AmguPaid): void {
  let id = event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let amguPaid = new AmguPayment(id);
  amguPaid.amount = toBigDecimal(event.params.ethPaid);
  amguPaid.payer = ensureAccount(event.params.payer).id;
  amguPaid.gas = event.params.gasUsed.toI32();
  amguPaid.save();

  createContractEvent('AmguPaid', event);
}
export function handleCallOnIntegrationExecuted(event: CallOnIntegrationExecuted): void {
  createContractEvent('CallOnIntegrationExecuted', event);
}

export function handleFundConfigSet(event: FundConfigSet): void {
  createContractEvent('FundConfigSet', event);
}

export function handleFundStatusUpdated(event: FundStatusUpdated): void {
  let fund = useFund(dataSource.context().getString('vaultProxy'));

  fund.status = event.params.nextStatus == 0 ? 'None' : event.params.nextStatus == 1 ? 'Active' : 'Inactive';
  fund.save();

  createContractEvent('FundStatusUpdated', event);
}

export function handleSharesBought(event: SharesBought): void {
  let comptrollerProxy = ComptrollerLibContract.bind(event.address);
  let denominationAsset = comptrollerProxy.getDenominationAsset();

  let fund = useFund(dataSource.context().getString('vaultProxy'));

  let account = ensureInvestor(event.params.buyer);
  let investment = ensureInvestment(account, fund);
  let asset = useAsset(denominationAsset.toHex());
  let quantity = toBigDecimal(event.params.investmentAmount, asset.decimals);
  let shares = toBigDecimal(event.params.sharesReceived);

  createInvestmentAddition(investment, asset, quantity, shares, event);
  createContractEvent('SharesBought', event);
}

export function handleSharesRedeemed(event: SharesRedeemed): void {
  let fund = useFund(dataSource.context().getString('vaultProxy'));

  let account = ensureInvestor(event.params.redeemer);
  let investment = ensureInvestment(account, fund);
  let shares = toBigDecimal(event.params.sharesQuantity);
  let assets = event.params.receivedAssets.map<Asset>((id) => useAsset(id.toHex()));
  let qtys = event.params.receivedAssetQuantities;

  let quantities: BigDecimal[] = [];
  for (let i: i32 = 0; i < assets.length; i++) {
    quantities.push(toBigDecimal(qtys[i], assets[i].decimals));
  }

  createInvestmentRedemption(investment, assets, quantities, shares, event);
  createContractEvent('SharesRedeemed', event);
}

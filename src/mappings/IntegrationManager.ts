import {
  AdapterDeregistered,
  AdapterRegistered,
  CallOnIntegrationExecuted,
} from '../generated/IntegrationManagerContract';
import { genericId } from '../utils/genericId';
import { AdapterDeregisteredEvent, CallOnIntegrationExecutedEvent } from '../generated/schema';
import { ensureContract, useContract } from '../entities/Contract';
import { ensureTransaction } from '../entities/Transaction';
import { ensureIntegrationAdapter, useIntegrationAdapter } from '../entities/IntegrationAdapter';
import { useFund } from '../entities/Fund';
import { ensureManager, useAccount } from '../entities/Account';
import { ensureAsset } from '../entities/Asset';
import { toBigDecimal } from '../utils/tokenValue';
import { BigDecimal } from '@graphprotocol/graph-ts';

export function handleAdapterDeregistered(event: AdapterDeregistered): void {
  let id = genericId(event);
  let deregistration = new AdapterDeregisteredEvent(id);

  deregistration.identifier = event.params.identifier.toHex();
  deregistration.contract = ensureContract(event.params.adapter, 'IntegrationManager', event).id;
  deregistration.timestamp = event.block.timestamp;
  deregistration.transaction = ensureTransaction(event).id;
  deregistration.integrationAdapter = useIntegrationAdapter(event.params.adapter.toHex()).id;

  deregistration.save();
}

export function handleAdapterRegistered(event: AdapterRegistered): void {
  let id = genericId(event);
  let registration = new AdapterDeregisteredEvent(id);

  registration.identifier = event.params.identifier.toHex();
  registration.contract = ensureContract(event.params.adapter, 'IntegrationManager', event).id;
  registration.timestamp = event.block.timestamp;
  registration.transaction = ensureTransaction(event).id;
  registration.integrationAdapter = ensureIntegrationAdapter(event.params.adapter, event.params.identifier.toHex()).id;

  registration.save();
}

export function handleCallOnIntegrationExecuted(event: CallOnIntegrationExecuted): void {
  let id = genericId(event);
  let execution = new CallOnIntegrationExecutedEvent(id);
  let fund = useFund(event.address.toHex());

  let incomingAssets = event.params.incomingAssets.map<string>((asset) => ensureAsset(asset).id);
  let outgoingAssets = event.params.outgoingAssets.map<string>((asset) => ensureAsset(asset).id);

  execution.contract = useContract(event.address.toHex()).id;
  execution.fund = fund.id;
  execution.account = useAccount(event.params.caller.toHex()).id;
  execution.incomingAssets = incomingAssets;
  execution.incomingAssetAmounts = event.params.incomingAssetAmounts.map<BigDecimal>((amount) => toBigDecimal(amount));
  execution.outgoingAssets = outgoingAssets;
  execution.outgoingAssetAmounts = event.params.outgoingAssetAmounts.map<BigDecimal>((amount) => toBigDecimal(amount));
  execution.timestamp = event.block.timestamp;
  execution.transaction = ensureTransaction(event).id;

  execution.save();
}

import { ensureAccount, useAccount } from '../entities/Account';
import { ensurePolicy, usePolicy } from '../entities/Policy';
import { trackPolicySettingDisabled, trackPolicySettingEnabled } from '../entities/PolicySetting';
import { ensureTransaction } from '../entities/Transaction';
import { ComptrollerLibContract } from '../generated/ComptrollerLibContract';
import {
  PolicyDeregistered,
  PolicyDisabledForFund,
  PolicyEnabledForFund,
  PolicyRegistered,
} from '../generated/PolicyManagerContract';
import {
  PolicyDeregisteredEvent,
  PolicyDisabledForFundEvent,
  PolicyEnabledForFundEvent,
  PolicyRegisteredEvent,
} from '../generated/schema';
import { genericId } from '../utils/genericId';
import { getPolicyHook } from '../utils/getPolicyHook';

export function handlePolicyRegistered(event: PolicyRegistered): void {
  let policy = ensurePolicy(event.params.policy, event.address);

  let registration = new PolicyRegisteredEvent(genericId(event));
  registration.timestamp = event.block.timestamp;
  registration.transaction = ensureTransaction(event).id;
  registration.policy = policy.id;
  registration.identifier = event.params.identifier.toHex();
  registration.implementedHooks = event.params.implementedHooks.map<string>((hook) => getPolicyHook(hook));
  registration.save();
}

export function handlePolicyDeregistered(event: PolicyDeregistered): void {
  let deregistration = new PolicyDeregisteredEvent(genericId(event));
  deregistration.timestamp = event.block.timestamp;
  deregistration.transaction = ensureTransaction(event).id;
  deregistration.policy = usePolicy(event.params.policy.toHex()).id;
  deregistration.identifier = event.params.identifier.toHex();
  deregistration.save();
}

export function handlePolicyEnabledForFund(event: PolicyEnabledForFund): void {
  let comptroller = ComptrollerLibContract.bind(event.params.comptrollerProxy);
  let fundId = comptroller.getVaultProxy().toHex();
  let policy = usePolicy(event.params.policy.toHex());

  let enabled = new PolicyEnabledForFundEvent(genericId(event));
  enabled.fund = fundId;
  enabled.account = ensureAccount(event.transaction.from, event).id;
  enabled.timestamp = event.block.timestamp;
  enabled.transaction = ensureTransaction(event).id;
  enabled.policy = policy.id;
  enabled.settingsData = event.params.settingsData.toHexString();
  enabled.save();

  trackPolicySettingEnabled(fundId, policy);
}

export function handlePolicyDisabledForFund(event: PolicyDisabledForFund): void {
  let comptroller = ComptrollerLibContract.bind(event.params.comptrollerProxy);
  let fundId = comptroller.getVaultProxy().toHex();
  let policy = usePolicy(event.params.policy.toHex());

  let enabled = new PolicyDisabledForFundEvent(genericId(event));
  enabled.fund = fundId;
  enabled.account = useAccount(event.transaction.from.toHex()).id;
  enabled.timestamp = event.block.timestamp;
  enabled.transaction = ensureTransaction(event).id;
  enabled.policy = policy.id;
  enabled.save();

  trackPolicySettingDisabled(fundId, policy);
}

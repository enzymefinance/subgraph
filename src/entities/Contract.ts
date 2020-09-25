import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Contract } from '../generated/schema';
import { logCritical } from '../utils/logCritical';

export function useContract(id: string): Contract {
  let contract = Contract.load(id) as Contract;
  if (contract == null) {
    logCritical('Failed to load contract {}.', [id]);
  }

  return contract;
}

export function ensureContract(address: Address, name: string, event: ethereum.Event): Contract {
  let contract = Contract.load(address.toHex()) as Contract;
  if (contract) {
    return contract;
  }

  contract = new Contract(address.toHex());
  contract.name = name;
  contract.timestamp = event.block.timestamp;
  contract.save();

  return contract;
}

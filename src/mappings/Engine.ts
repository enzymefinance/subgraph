import {
  SetAmguPrice,
  RegistryChange,
  AmguPaid,
  Thaw,
  Burn
} from "../types/EngineDataSource/EngineContract";
import {
  AmguPrice,
  AmguPayment,
  ThawEther,
  BurnEther,
  Registry,
  Engine
} from "../types/schema";
import { Address } from "@graphprotocol/graph-ts";

function engineEntity(address: Address, registry: Address): Engine {
  let id = address.toHex();
  let engine = Engine.load(id);

  if (!engine) {
    engine = new Engine(id);
    engine.registry = registry.toHex();
    engine.save();
  }

  return engine as Engine;
}

function registryEntity(address: Address): Registry {
  let id = address.toHex();
  let registry = Registry.load(id);

  if (!registry) {
    registry = new Registry(id);
    registry.versions = [];
    registry.assets = [];
    registry.save();
  }

  return registry as Registry;
}

export function handleSetAmguPrice(event: SetAmguPrice): void {
  let amguPrice = new AmguPrice(event.transaction.hash.toHex());
  amguPrice.price = event.params.amguPrice;
  amguPrice.engine = event.address.toHex();
  amguPrice.timestamp = event.block.timestamp;
  amguPrice.save();
}

export function handleAmguPaid(event: AmguPaid): void {
  let amguPayment = new AmguPayment(event.transaction.hash.toHex());
  amguPayment.amount = event.params.amount;
  amguPayment.engine = event.address.toHex();
  amguPayment.timestamp = event.block.timestamp;
  amguPayment.save();
}

export function handleThaw(event: Thaw): void {
  let thawEther = new ThawEther(event.transaction.hash.toHex());
  thawEther.ether = event.params.amount;
  thawEther.engine = event.address.toHex();
  thawEther.timestamp = event.block.timestamp;
  thawEther.save();
}

export function handleBurn(event: Burn): void {
  let burnEther = new BurnEther(event.transaction.hash.toHex());
  burnEther.ether = event.params.amount;
  burnEther.engine = event.address.toHex();
  burnEther.timestamp = event.block.timestamp;
  burnEther.save();
}

export function handleRegistryChange(event: RegistryChange): void {
  let registry = registryEntity(event.params.registry);
  let engine = engineEntity(event.address, event.params.registry);
  engine.registry = registry.id;
  engine.save();
}

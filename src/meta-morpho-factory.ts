import { Address, BigInt } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../generated/MetaMorphoFactory/MetaMorphoFactory";
import { MetaMorpho } from "../generated/schema";
import { MetaMorpho as MetaMorphoTemplate } from "../generated/templates";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  MetaMorphoTemplate.create(event.params.metaMorpho);
  const metaMorpho = new MetaMorpho(event.params.metaMorpho);

  metaMorpho.name = event.params.name;
  metaMorpho.symbol = event.params.symbol;
  metaMorpho.decimals = 18;
  metaMorpho.asset = event.params.asset;

  metaMorpho.owner = event.params.initialOwner;
  metaMorpho.curators = [];
  metaMorpho.allocators = [];
  metaMorpho.guardian = Address.zero();

  metaMorpho.timelock = event.params.initialTimelock;

  metaMorpho.fee = BigInt.zero();
  metaMorpho.feeRecipient = Address.zero();
  metaMorpho.feeAccrued = BigInt.zero();
  metaMorpho.feeAccruedAssets = BigInt.zero();

  metaMorpho.lastTotalAssets = BigInt.zero();
  metaMorpho.totalShares = BigInt.zero();
  metaMorpho.idle = BigInt.zero();

  metaMorpho.supplyQueue = [];
  metaMorpho.withdrawQueue = [];
  metaMorpho.save();
}

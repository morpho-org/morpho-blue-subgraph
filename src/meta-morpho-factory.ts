import { BigInt } from "@graphprotocol/graph-ts";

import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../generated/MetaMorphoFactory/MetaMorphoFactory";
import { MetaMorpho } from "../generated/schema";
import { MetaMorpho as MetaMorphoTemplate } from "../generated/templates";

import { AccountManager } from "./sdk/account";
import { TokenManager } from "./sdk/token";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  MetaMorphoTemplate.create(event.params.metaMorpho);
  const metaMorpho = new MetaMorpho(event.params.metaMorpho);

  metaMorpho.name = event.params.name;
  metaMorpho.symbol = event.params.symbol;
  metaMorpho.decimals = 18;
  metaMorpho.asset = new TokenManager(event.params.asset, event).getToken().id;

  metaMorpho.owner = new AccountManager(
    event.params.initialOwner
  ).getAccount().id;
  metaMorpho.curators = [];
  metaMorpho.allocators = [];

  metaMorpho.timelock = event.params.initialTimelock;

  metaMorpho.fee = BigInt.zero();
  metaMorpho.feeAccrued = BigInt.zero();
  metaMorpho.feeAccruedAssets = BigInt.zero();

  metaMorpho.lastTotalAssets = BigInt.zero();
  metaMorpho.totalShares = BigInt.zero();
  metaMorpho.idle = BigInt.zero();

  metaMorpho.supplyQueue = [];
  metaMorpho.withdrawQueue = [];
  metaMorpho.save();
}

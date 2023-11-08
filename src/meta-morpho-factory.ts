import { CreateMetaMorpho as CreateMetaMorphoEvent } from "../generated/MetaMorphoFactory/MetaMorphoFactory";
import { MetaMorpho } from "../generated/templates";

export function handleCreateMetaMorpho(event: CreateMetaMorphoEvent): void {
  MetaMorpho.create(event.params.metaMorpho);
}

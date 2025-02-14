import { Address, BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";

import { _MarketList, LendingProtocol } from "../../generated/schema";
import {
  ProtocolType,
  LendingType,
  PermissionType,
  RiskType,
  CollateralizationType,
  INT_ZERO,
} from "../sdk/constants";

const getMorphoBlueAddress = (): Address => {
  const network = dataSource.network();
  if (network == "mainnet") {
    return Address.fromString("0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb");
  }
  if (network == "base") {
    return Address.fromString("0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb");
  }
  if (network == "optimism") {
    return Address.fromString("0xce95AfbB8EA029495c66020883F87aaE8864AF92");
  }
  if (network == "arbitrum-one") {
    return Address.fromString("0x6c247b1F6182318877311737BaC0844bAa518F5e");
  }
  if (network == "fraxtal") {
    return Address.fromString("0xa6030627d724bA78a59aCf43Be7550b4C5a0653b");
  }
  if (network == "ink") {
    return Address.fromString("0x857f3EefE8cbda3Bc49367C996cd664A880d3042");
  }
  if (network == "matic") {
    return Address.fromString("0x1bF0c2541F820E775182832f06c0B7Fc27A25f67");
  }
  if (network == "scroll") {
    return Address.fromString("0x2d012EdbAdc37eDc2BC62791B666f9193FDF5a55");
  }

  log.critical("Unknown network {}", [network]);
  return Address.zero();
};
let protocol: LendingProtocol | null = null;
export function getProtocol(): LendingProtocol {
  if (protocol !== null) return protocol!;
  const morphoBlueAddress = getMorphoBlueAddress();

  protocol = LendingProtocol.load(morphoBlueAddress);
  if (protocol) return protocol!;
  protocol = initBlue();
  return protocol!;
}

const getNetworkLabel = (): string => {
  const network = dataSource.network();
  if (network == "arbitrum-one") {
    return "ARBITRUM_ONE";
  }
  return network.toUpperCase();
};

function initBlue(): LendingProtocol {
  const protocol = new LendingProtocol(getMorphoBlueAddress());
  protocol.protocol = "Morpho";
  protocol.name = "Morpho Blue";
  protocol.slug = "morpho-blue";
  protocol.schemaVersion = "3.0.0";
  protocol.subgraphVersion = "0.0.7";
  protocol.methodologyVersion = "1.0.0";
  protocol.network = getNetworkLabel();
  protocol.type = ProtocolType.LENDING;
  protocol.lendingType = LendingType.POOLED;
  protocol.poolCreatorPermissionType = PermissionType.PERMISSIONLESS;
  protocol.riskType = RiskType.ISOLATED;
  protocol.collateralizationType = CollateralizationType.OVER_COLLATERALIZED;
  protocol.cumulativeUniqueUsers = INT_ZERO;
  protocol.cumulativeUniqueDepositors = INT_ZERO;
  protocol.cumulativeUniqueBorrowers = INT_ZERO;
  protocol.cumulativeUniqueLiquidators = INT_ZERO;
  protocol.cumulativeUniqueLiquidatees = INT_ZERO;

  protocol.totalValueLockedUSD = BigDecimal.zero();
  protocol.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
  protocol.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
  protocol.cumulativeTotalRevenueUSD = BigDecimal.zero();
  // protocol.fees
  // protocol.revenueDetail
  protocol.totalDepositBalanceUSD = BigDecimal.zero();
  protocol.cumulativeDepositUSD = BigDecimal.zero();
  protocol.totalBorrowBalanceUSD = BigDecimal.zero();
  protocol.cumulativeBorrowUSD = BigDecimal.zero();
  protocol.cumulativeLiquidateUSD = BigDecimal.zero();
  protocol.totalPoolCount = INT_ZERO;
  protocol.openPositionCount = INT_ZERO;
  protocol.cumulativePositionCount = INT_ZERO;
  protocol.transactionCount = INT_ZERO;
  protocol.depositCount = INT_ZERO;
  protocol.withdrawCount = INT_ZERO;
  protocol.borrowCount = INT_ZERO;
  protocol.repayCount = INT_ZERO;
  protocol.transferCount = INT_ZERO;
  protocol.flashloanCount = INT_ZERO;
  protocol.liquidationCount = INT_ZERO;

  protocol.feeRecipient = Address.zero();
  protocol.owner = Address.zero();
  protocol.irmEnabled = [];
  protocol.lltvEnabled = [];

  protocol.save();
  const marketList = new _MarketList(protocol.id);
  marketList.markets = [];
  marketList.save();

  return protocol;
}

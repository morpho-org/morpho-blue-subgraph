import {BigDecimal, BigInt, Bytes, ethereum, log} from "@graphprotocol/graph-ts";
import {CreateMarketMarketStruct} from "../../generated/MorphoBlue/MorphoBlue";
import {Market, Oracle, RevenueDetail} from "../../generated/schema";
import {getProtocol} from "./protocol";
import {TokenManager} from "../sdk/token";
import {BIGDECIMAL_WAD, BIGDECIMAL_ZERO, INT_ZERO} from "../sdk/constants";


export function createMarket(id: Bytes, marketStruct: CreateMarketMarketStruct, event: ethereum.Event): Market {
    const market = new Market(id);

    const collateralToken = new TokenManager(marketStruct.collateralToken, event);
    const borrowableToken = new TokenManager(marketStruct.borrowableToken, event);

    market.protocol = getProtocol().id;
    market.name = borrowableToken.getToken().symbol + " / " + collateralToken.getToken().symbol;
    market.isActive = true;
    market.canBorrowFrom = true;
    market.canUseAsCollateral = true;

    const lltvBD = marketStruct.lltv.toBigDecimal().div(BIGDECIMAL_WAD)
    market.maximumLTV = lltvBD;
    market.liquidationThreshold = lltvBD;
    market.liquidationPenalty = BIGDECIMAL_ZERO; // TODO: to define

    market.canIsolate = true;
    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    market.inputToken = borrowableToken.getToken().id;
    market.inputTokenBalance = BigInt.zero();
    market.inputTokenPriceUSD = borrowableToken.getPriceUSD();
    market.rates = []; // TODO: to define
    market.reserves = BigDecimal.zero();
    market.reserveFactor = BigDecimal.zero();

    market.borrowedToken = borrowableToken.getToken().id;
    market.variableBorrowedTokenBalance = BigInt.zero();

    // TODO: use indexes here

    market.totalValueLockedUSD = BigDecimal.zero();
    market.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
    market.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
    market.cumulativeTotalRevenueUSD = BigDecimal.zero();
    // market.revenueDetail = RevenueDetail.load("")
    market.totalDepositBalanceUSD = BigDecimal.zero();
    market.cumulativeDepositUSD = BigDecimal.zero();
    market.totalBorrowBalanceUSD = BigDecimal.zero();
    market.cumulativeBorrowUSD = BigDecimal.zero();
    market.cumulativeLiquidateUSD = BigDecimal.zero();
    market.cumulativeTransferUSD = BigDecimal.zero();
    market.cumulativeFlashloanUSD = BigDecimal.zero();
    market.transactionCount = INT_ZERO;
    market.depositCount = INT_ZERO;
    market.withdrawCount = INT_ZERO;
    market.borrowCount = INT_ZERO;
    market.repayCount = INT_ZERO;
    market.liquidationCount = INT_ZERO;
    market.transferCount = INT_ZERO;
    market.flashloanCount = INT_ZERO;

    market.cumulativeUniqueUsers = INT_ZERO;
    market.cumulativeUniqueDepositors = INT_ZERO;
    market.cumulativeUniqueBorrowers = INT_ZERO;
    market.cumulativeUniqueLiquidators = INT_ZERO;
    market.cumulativeUniqueLiquidatees = INT_ZERO;
    market.cumulativeUniqueTransferrers = INT_ZERO;
    market.cumulativeUniqueFlashloaners = INT_ZERO;

    market.positionCount = INT_ZERO;
    market.openPositionCount = INT_ZERO;
    market.closedPositionCount = INT_ZERO;
    market.lendingPositionCount = INT_ZERO;
    market.borrowingPositionCount = INT_ZERO;

    market.totalSupplyShares = BigInt.zero();
    market.totalBorrowShares = BigInt.zero();
    market.totalCollateral = BigInt.zero();
    market.totalSupply = BigInt.zero();
    market.totalBorrow = BigInt.zero();
    market.accruedInterests = BigInt.zero();
    market.fee = BigInt.zero();

    market.save();

    const oracle = new Oracle(market.id.concat(marketStruct.oracle))
    oracle.market = market.id;
    oracle.oracleAddress = marketStruct.oracle;
    oracle.blockCreated = event.block.number;
    oracle.timestampCreated = event.block.timestamp;
    oracle.isActive = true;
    const isUsd = !!borrowableToken.getToken().symbol.includes("USD")
    oracle.isUSD = isUsd;
    // TODO: whitelist oracleSource for a list of oracles.
    oracle.save();

    // TODO: fix this workaround of the relation between oracle & market.
    market.oracle = oracle.id;
    market.save();

    return market;
}

export function getMarket(id: Bytes): Market {
    const market = Market.load(id);
    if (!market)
        log.critical("Market {} does not exist", [id.toHexString()]);

    return market!;
}
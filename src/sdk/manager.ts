import {
    Address,
    Bytes,
    BigInt,
    ethereum,
    BigDecimal,
    log,
} from "@graphprotocol/graph-ts";
import {
    Borrow,
    Deposit,
    Fee,
    Flashloan,
    InterestRate,
    LendingProtocol,
    Liquidate,
    Market,
    Oracle,
    Repay,
    RevenueDetail,
    Token,
    Withdraw,
    _MarketList,
} from "../../generated/schema";
import { AccountManager } from "./account";
import {
    activityCounter,
    exponentToBigDecimal,
    FeeType,
    INT_ONE,
    PositionSide,
    Transaction,
    TransactionType,
} from "./constants";
import { SnapshotManager } from "./snapshots";
import { TokenManager } from "./token";
import { insert } from "./constants";
import { PositionManager } from "./position";
import {getProtocol} from "../initializers/protocol";

/**
 * This file contains the DataManager, which is used to
 * make all of the storage changes that occur in a protocol.
 *
 * You can think of this as an abstraction so the developer doesn't
 * need to think about all of the detailed storage changes that occur.
 *
 * Schema Version:  3.1.0
 * SDK Version:     1.0.6
 * Author(s):
 *  - @dmelotik
 *  - @dhruv-chauhan
 */


export class DataManager {
    private event!: ethereum.Event;
    private protocol!: LendingProtocol;
    private market!: Market;
    private inputToken!: TokenManager;
    private oracle!: Oracle;
    private snapshots!: SnapshotManager;
    private newMarket: boolean = false;

    constructor(
        marketID: Bytes,
        event: ethereum.Event,
    ) {
        this.protocol = getProtocol();
        let _market = Market.load(marketID);
        if(!_market) {
            log.critical("Market {} does not exist", [marketID.toHexString()]);
        }
        _market = _market as Market;

        this.inputToken = new TokenManager(_market.inputToken, event);

        // create new market
        this.market = _market;
        this.event = event;

        // load snapshots
        this.snapshots = new SnapshotManager(event, this.protocol, this.market);

        // load oracle
        if (this.market.oracle) {
            this.oracle = Oracle.load(this.market.oracle!)!;
        }
    }

    /////////////////
    //// Getters ////
    /////////////////

    getMarket(): Market {
        return this.market;
    }

    isNewMarket(): boolean {
        return this.newMarket;
    }

    saveMarket(): void {
        this.market.save();
    }

    getInputToken(): Token {
        return this.inputToken.getToken();
    }

    getOracleAddress(): Address {
        return Address.fromBytes(this.oracle.oracleAddress);
    }

    getOrUpdateRate(
        rateSide: string,
        rateType: string,
        interestRate: BigDecimal
    ): InterestRate {
        const interestRateID = rateSide
            .concat("-")
            .concat(rateType)
            .concat("-")
            .concat(this.market.id.toHexString());
        let rate = InterestRate.load(interestRateID);
        if (!rate) {
            rate = new InterestRate(interestRateID);
            rate.side = rateSide;
            rate.type = rateType;
        }
        rate.rate = interestRate;
        rate.save();

        let marketRates = this.market.rates;
        if (!marketRates) {
            marketRates = [];
        }

        if (marketRates.indexOf(interestRateID) == -1) {
            marketRates.push(interestRateID);
        }
        this.market.rates = marketRates;
        this.saveMarket();

        return rate;
    }

    getOrUpdateFee(
        feeType: string,
        flatFee: BigDecimal | null = null,
        rate: BigDecimal | null = null
    ): Fee {
        let fee = Fee.load(feeType);
        if (!fee) {
            fee = new Fee(feeType);
            fee.type = feeType;
        }

        fee.rate = rate;
        fee.save();

        let protocolFees = this.protocol.fees;
        if (!protocolFees) {
            protocolFees = [];
        }

        if (protocolFees.indexOf(feeType) == -1) {
            protocolFees.push(feeType);
        }
        this.protocol.fees = protocolFees;
        this.protocol.save();

        return fee;
    }

    getAddress(): Address {
        return Address.fromBytes(this.market.id);
    }

    getOrCreateRevenueDetail(id: Bytes, isMarket: boolean): RevenueDetail {
        let details = RevenueDetail.load(id);
        if (!details) {
            details = new RevenueDetail(id);
            details.sources = [];
            details.amountsUSD = [];
            details.save();

            if (isMarket) {
                this.market.revenueDetail = details.id;
                this.saveMarket();
            } else {
                this.protocol.revenueDetail = details.id;
                this.protocol.save();
            }
        }

        return details;
    }

    //////////////////
    //// Creators ////
    //////////////////

    createDepositCollateral(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
    ): Deposit {
        const depositor = new AccountManager(account);
        if (depositor.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        const position = new PositionManager(
            depositor.getAccount(),
            this.market,
            PositionSide.COLLATERAL,
        );

        position.addPosition(
            this.event,
            asset,
            this.protocol,
            newBalance,
            BigInt.zero(), // no shares for collateral
            TransactionType.DEPOSIT_COLLATERAL,
            this.market.inputTokenPriceUSD
        );

        const deposit = new Deposit(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.DEPOSIT)
        );
        deposit.isCollateral = true;

        deposit.hash = this.event.transaction.hash;
        deposit.nonce = this.event.transaction.nonce;
        deposit.logIndex = this.event.logIndex.toI32();
        deposit.gasPrice = this.event.transaction.gasPrice;
        deposit.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        deposit.gasLimit = this.event.transaction.gasLimit;
        deposit.blockNumber = this.event.block.number;
        deposit.timestamp = this.event.block.timestamp;
        deposit.account = account;
        deposit.market = this.market.id;
        deposit.position = position.getPositionID()!;
        deposit.asset = asset;
        deposit.amount = amount;
        deposit.amountUSD = amountUSD;
        deposit.save();

        this.updateTransactionData(TransactionType.DEPOSIT_COLLATERAL, amount, amountUSD);
        this.updateUsageData(TransactionType.DEPOSIT_COLLATERAL, account);

        return deposit;
    }

    createDeposit(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
        shares: BigInt,
    ): Deposit {
        const depositor = new AccountManager(account);
        if (depositor.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        const position = new PositionManager(
            depositor.getAccount(),
            this.market,
            PositionSide.SUPPLIER,
        );

        position.addPosition(
            this.event,
            asset,
            this.protocol,
            newBalance,
            shares,
            TransactionType.DEPOSIT,
            this.market.inputTokenPriceUSD
        );

        const deposit = new Deposit(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.DEPOSIT)
        );
        deposit.isCollateral = false;

        deposit.hash = this.event.transaction.hash;
        deposit.nonce = this.event.transaction.nonce;
        deposit.logIndex = this.event.logIndex.toI32();
        deposit.gasPrice = this.event.transaction.gasPrice;
        deposit.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        deposit.gasLimit = this.event.transaction.gasLimit;
        deposit.blockNumber = this.event.block.number;
        deposit.timestamp = this.event.block.timestamp;
        deposit.account = account;
        deposit.market = this.market.id;
        deposit.position = position.getPositionID()!;
        deposit.asset = asset;
        deposit.amount = amount;
        deposit.amountUSD = amountUSD;
        deposit.save();

        this.updateTransactionData(TransactionType.DEPOSIT, amount, amountUSD);
        this.updateUsageData(TransactionType.DEPOSIT, account);

        return deposit;
    }

    createWithdrawCollateral(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
    ): Withdraw | null {
        const withdrawer = new AccountManager(account);
        if (withdrawer.isNewUser()) {
            log.critical("Withdrawer is a new user: {}", [account.toHexString()]);
            return null;
        }

        const position = new PositionManager(
            withdrawer.getAccount(),
            this.market,
            PositionSide.COLLATERAL
        );
        position.subtractPosition(
            this.event,
            this.protocol,
            newBalance,
            BigInt.zero(), // no shares for collateral
            TransactionType.WITHDRAW_COLLATERAL,
            this.market.inputTokenPriceUSD,
        );
        const positionID = position.getPositionID();
        if (!positionID) {
            log.error(
                "[createWithdraw] positionID is null for market: {} account: {}",
                [this.market.id.toHexString(), account.toHexString()]
            );
            return null;
        }

        const withdraw = new Withdraw(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.WITHDRAW)
        );
        withdraw.hash = this.event.transaction.hash;
        withdraw.nonce = this.event.transaction.nonce;
        withdraw.logIndex = this.event.logIndex.toI32();
        withdraw.gasPrice = this.event.transaction.gasPrice;
        withdraw.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        withdraw.gasLimit = this.event.transaction.gasLimit;
        withdraw.blockNumber = this.event.block.number;
        withdraw.timestamp = this.event.block.timestamp;
        withdraw.account = account;
        withdraw.market = this.market.id;
        withdraw.position = positionID!;
        withdraw.asset = asset;
        withdraw.amount = amount;
        withdraw.amountUSD = amountUSD;
        withdraw.isCollateral = true;
        withdraw.save();

        this.updateTransactionData(TransactionType.WITHDRAW_COLLATERAL, amount, amountUSD);
        this.updateUsageData(TransactionType.WITHDRAW_COLLATERAL, account);

        return withdraw;
    }

    createWithdraw(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
        shares: BigInt,
    ): Withdraw | null {
        const withdrawer = new AccountManager(account);
        if (withdrawer.isNewUser()) {
            log.critical("Withdrawer is a new user: {}", [account.toHexString()]);
            return null;
        }

        const position = new PositionManager(
            withdrawer.getAccount(),
            this.market,
            PositionSide.SUPPLIER
        );
        position.subtractPosition(
            this.event,
            this.protocol,
            newBalance,
            shares,
            TransactionType.WITHDRAW,
            this.market.inputTokenPriceUSD,
        );
        const positionID = position.getPositionID();
        if (!positionID) {
            log.error(
                "[createWithdraw] positionID is null for market: {} account: {}",
                [this.market.id.toHexString(), account.toHexString()]
            );
            return null;
        }

        const withdraw = new Withdraw(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.WITHDRAW)
        );
        withdraw.hash = this.event.transaction.hash;
        withdraw.nonce = this.event.transaction.nonce;
        withdraw.logIndex = this.event.logIndex.toI32();
        withdraw.gasPrice = this.event.transaction.gasPrice;
        withdraw.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        withdraw.gasLimit = this.event.transaction.gasLimit;
        withdraw.blockNumber = this.event.block.number;
        withdraw.timestamp = this.event.block.timestamp;
        withdraw.account = account;
        withdraw.market = this.market.id;
        withdraw.position = positionID!;
        withdraw.asset = asset;
        withdraw.amount = amount;
        withdraw.amountUSD = amountUSD;
        withdraw.isCollateral = false;
        withdraw.save();

        this.updateTransactionData(TransactionType.WITHDRAW, amount, amountUSD);
        this.updateUsageData(TransactionType.WITHDRAW, account);

        return withdraw;
    }

    createBorrow(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
        shares: BigInt,
        tokenPriceUSD: BigDecimal
    ): Borrow {
        const borrower = new AccountManager(account);
        if (borrower.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        const position = new PositionManager(
            borrower.getAccount(),
            this.market,
            PositionSide.BORROWER,
        );
        position.addPosition(
            this.event,
            asset,
            this.protocol,
            newBalance,
            shares,
            TransactionType.BORROW,
            tokenPriceUSD,
        );

        const borrow = new Borrow(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.BORROW)
        );
        borrow.hash = this.event.transaction.hash;
        borrow.nonce = this.event.transaction.nonce;
        borrow.logIndex = this.event.logIndex.toI32();
        borrow.gasPrice = this.event.transaction.gasPrice;
        borrow.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        borrow.gasLimit = this.event.transaction.gasLimit;
        borrow.blockNumber = this.event.block.number;
        borrow.timestamp = this.event.block.timestamp;
        borrow.account = account;
        borrow.market = this.market.id;
        borrow.position = position.getPositionID()!;
        borrow.asset = asset;
        borrow.amount = amount;
        borrow.amountUSD = amountUSD;
        borrow.save();

        this.updateTransactionData(TransactionType.BORROW, amount, amountUSD);
        this.updateUsageData(TransactionType.BORROW, account);

        return borrow;
    }

    createRepay(
        asset: Bytes,
        account: Bytes,
        amount: BigInt,
        amountUSD: BigDecimal,
        newBalance: BigInt,
        shares: BigInt,
        tokenPriceUSD: BigDecimal, // used for different borrow token in CDP
        interestType: string | null = null,
        principal: BigInt | null = null
    ): Repay | null {
        const repayer = new AccountManager(account);
        if (repayer.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        const position = new PositionManager(
            repayer.getAccount(),
            this.market,
            PositionSide.BORROWER,
        );
        position.subtractPosition(
            this.event,
            this.protocol,
            newBalance,
            shares,
            TransactionType.REPAY,
            tokenPriceUSD,
        );
        const positionID = position.getPositionID();
        if (!positionID) {
            log.error("[createRepay] positionID is null for market: {} account: {}", [
                this.market.id.toHexString(),
                account.toHexString(),
            ]);
            return null;
        }

        const repay = new Repay(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.REPAY)
        );
        repay.hash = this.event.transaction.hash;
        repay.nonce = this.event.transaction.nonce;
        repay.logIndex = this.event.logIndex.toI32();
        repay.gasPrice = this.event.transaction.gasPrice;
        repay.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        repay.gasLimit = this.event.transaction.gasLimit;
        repay.blockNumber = this.event.block.number;
        repay.timestamp = this.event.block.timestamp;
        repay.account = account;
        repay.market = this.market.id;
        repay.position = positionID!;
        repay.asset = asset;
        repay.amount = amount;
        repay.amountUSD = amountUSD;
        repay.save();

        this.updateTransactionData(TransactionType.REPAY, amount, amountUSD);
        this.updateUsageData(TransactionType.REPAY, account);

        return repay;
    }

    /**
     * Creates a Liquidate entity for a liquidation, update liquidatee and liquidator positions
     *
     * @param asset The collateral asset that is seized by the protocol and transfered to the liquidator.
     * @param liquidator The liquidator.
     * @param liquidatee The borrower that is liquidated.
     * @param amount The amount of asset being liquidated.
     * @param amountUSD The amount in USD.
     * @param profitUSD Liquidator's profit from the liquidation.
     * @param newCollateralBalance The liquidatee's new borrowing balance after the liquidation (usually ZERO).
     * @param interestType Optional - The InterestType of liquidatee's position (FIXED, VARIABLE, etc.).
     * @param subtractBorrowerPosition - whether to subtract borrower/debt position involved in the liquidation
     * @returns A Liquidate entity or null
     */
    createLiquidate(
        asset: Bytes,
        debtTokenId: Bytes,
        liquidator: Address,
        liquidatee: Address,
        amount: BigInt,
        amountUSD: BigDecimal,
        profitUSD: BigDecimal,
        newCollateralBalance: BigInt,
        newBorrowerBalance: BigInt,
        newBorrowerShares: BigInt,
        subtractBorrowerPosition: bool = true
    ): Liquidate | null {
        const positions: string[] = []; // positions touched by this liquidation
        const liquidatorAccount = new AccountManager(liquidator);
        if (liquidatorAccount.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        liquidatorAccount.countLiquidate();
        // Note: Be careful, some protocols might give the liquidated collateral to the liquidator
        //       in collateral in the market. But that is not always the case so we don't do it here.

        const liquidateeAccount = new AccountManager(liquidatee);
        const collateralPosition = new PositionManager(
            liquidateeAccount.getAccount(),
            this.market,
            PositionSide.COLLATERAL,
        );

        const collateralPositionID = collateralPosition.subtractPosition(
            this.event,
            this.protocol,
            newCollateralBalance,
            BigInt.zero(),
            TransactionType.LIQUIDATE,
            this.market.inputTokenPriceUSD
        );
        if (!collateralPositionID) {
            log.error(
                "[createLiquidate] positionID is null for market: {} account: {}",
                [this.market.id.toHexString(), liquidatee.toHexString()]
            );

            return null;
        }
        positions.push(collateralPositionID!);
        // we may want to do call subtractPosition outside this function
        // to close both stable and variable borrowing poositions, e.g.
        // in aave-forks
        if (subtractBorrowerPosition) {
            const debtMarket = Market.load(debtTokenId);
            if (!debtMarket) {
                log.error("[createLiquidate] market {} not found", [
                    debtTokenId.toHexString(),
                ]);
                return null;
            }
            const borrowerPosition = new PositionManager(
                liquidateeAccount.getAccount(),
                debtMarket,
                PositionSide.BORROWER,
            );

            const borrowerPositionID = borrowerPosition.subtractPosition(
                this.event,
                this.protocol,
                newBorrowerBalance,
                newBorrowerShares,
                TransactionType.LIQUIDATE,
                debtMarket.inputTokenPriceUSD
            );
            if (!borrowerPositionID) {
                log.error(
                    "[createLiquidate] positionID is null for market: {} account: {}",
                    [debtMarket.id.toHexString(), liquidatee.toHexString()]
                );
                return null;
            }
            positions.push(borrowerPositionID!);
        }

        // Note:
        //  - liquidatees are not considered users since they are not spending gas for the transaction
        //  - It is possible in some protocols for the liquidator to incur a position if they are transferred collateral tokens
        const liquidate = new Liquidate(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.LIQUIDATE)
        );
        liquidate.hash = this.event.transaction.hash;
        liquidate.nonce = this.event.transaction.nonce;
        liquidate.logIndex = this.event.logIndex.toI32();
        liquidate.gasPrice = this.event.transaction.gasPrice;
        liquidate.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        liquidate.gasLimit = this.event.transaction.gasLimit;
        liquidate.blockNumber = this.event.block.number;
        liquidate.timestamp = this.event.block.timestamp;
        liquidate.liquidator = liquidator;
        liquidate.liquidatee = liquidatee;
        liquidate.market = this.market.id;
        liquidate.positions = positions;
        liquidate.asset = asset;
        liquidate.amount = amount;
        liquidate.amountUSD = amountUSD;
        liquidate.profitUSD = profitUSD;
        liquidate.save();

        this.updateTransactionData(TransactionType.LIQUIDATE, amount, amountUSD);
        this.updateUsageData(TransactionType.LIQUIDATEE, liquidatee);
        this.updateUsageData(TransactionType.LIQUIDATOR, liquidator);

        return liquidate;
    }


    createFlashloan(
        asset: Address,
        account: Address,
        amount: BigInt,
        amountUSD: BigDecimal
    ): Flashloan {
        const flashloaner = new AccountManager(account);
        if (flashloaner.isNewUser()) {
            this.protocol.cumulativeUniqueUsers += INT_ONE;
            this.protocol.save();
        }
        flashloaner.countFlashloan();

        const flashloan = new Flashloan(
            this.event.transaction.hash
                .concatI32(this.event.logIndex.toI32())
                .concatI32(Transaction.FLASHLOAN)
        );
        flashloan.hash = this.event.transaction.hash;
        flashloan.nonce = this.event.transaction.nonce;
        flashloan.logIndex = this.event.logIndex.toI32();
        flashloan.gasPrice = this.event.transaction.gasPrice;
        flashloan.gasUsed = this.event.receipt ? this.event.receipt!.gasUsed : null;
        flashloan.gasLimit = this.event.transaction.gasLimit;
        flashloan.blockNumber = this.event.block.number;
        flashloan.timestamp = this.event.block.timestamp;
        flashloan.account = account;
        flashloan.market = this.market.id;
        flashloan.asset = asset;
        flashloan.amount = amount;
        flashloan.amountUSD = amountUSD;
        flashloan.save();

        this.updateTransactionData(TransactionType.FLASHLOAN, amount, amountUSD);
        this.updateUsageData(TransactionType.FLASHLOAN, account);

        return flashloan;
    }

    // used to update tvl, borrow balance, reserves, etc. in market and protocol
    updateMarketAndProtocolData(
        inputTokenPriceUSD: BigDecimal,
        newInputTokenBalance: BigInt,
        newVariableBorrowBalance: BigInt | null = null,
        newReserveBalance: BigInt | null = null,
    ): void {
        const mantissaFactorBD = exponentToBigDecimal(
            this.inputToken.getDecimals()
        );
        this.inputToken.updatePrice(inputTokenPriceUSD);
        this.market.inputTokenPriceUSD = inputTokenPriceUSD;
        this.market.inputTokenBalance = newInputTokenBalance;
        if (newVariableBorrowBalance) {
            this.market.variableBorrowedTokenBalance = newVariableBorrowBalance;
        }
        if (newReserveBalance) {
            this.market.reserves = newReserveBalance
                .toBigDecimal()
                .div(mantissaFactorBD)
                .times(inputTokenPriceUSD);
        }
        const vBorrowAmount = this.market.variableBorrowedTokenBalance
            ? this.market
                .variableBorrowedTokenBalance!.toBigDecimal()
                .div(mantissaFactorBD)
            : BigDecimal.zero();

        this.market.totalValueLockedUSD = newInputTokenBalance
            .toBigDecimal()
            .div(mantissaFactorBD)
            .times(inputTokenPriceUSD);
        this.market.totalDepositBalanceUSD = this.market.totalValueLockedUSD;
        this.saveMarket();

        let totalValueLockedUSD = BigDecimal.zero();
        let totalBorrowBalanceUSD = BigDecimal.zero();
        const marketList = this.getOrAddMarketToList();
        for (let i = 0; i < marketList.length; i++) {
            const _market = Market.load(marketList[i]);
            if (!_market) {
                log.error("[updateMarketAndProtocolData] Market not found: {}", [
                    marketList[i].toHexString(),
                ]);
                continue;
            }
            totalValueLockedUSD = totalValueLockedUSD.plus(
                _market.totalValueLockedUSD
            );
            totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
                _market.totalBorrowBalanceUSD
            );
        }
        this.protocol.totalValueLockedUSD = totalValueLockedUSD;
        this.protocol.totalDepositBalanceUSD = totalValueLockedUSD;
        this.protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
        this.protocol.save();
    }

    updateSupplyIndex(supplyIndex: BigInt): void {
        this.market.supplyIndex = supplyIndex;
        this.market.indexLastUpdatedTimestamp = this.event.block.timestamp;
        this.saveMarket();
    }

    updateBorrowIndex(borrowIndex: BigInt): void {
        this.market.borrowIndex = borrowIndex;
        this.market.indexLastUpdatedTimestamp = this.event.block.timestamp;
        this.saveMarket();
    }

    //
    //
    // Update the protocol revenue
    addProtocolRevenue(
        protocolRevenueDelta: BigDecimal,
        fee: Fee | null = null
    ): void {
        this.updateRevenue(protocolRevenueDelta, BigDecimal.zero());

        if (!fee) {
            fee = this.getOrUpdateFee(FeeType.OTHER);
        }

        const marketRevDetails = this.getOrCreateRevenueDetail(
            this.market.id,
            true
        );
        const protocolRevenueDetail = this.getOrCreateRevenueDetail(
            this.protocol.id,
            false
        );

        this.insertInOrder(marketRevDetails, protocolRevenueDelta, fee.id);
        this.insertInOrder(protocolRevenueDetail, protocolRevenueDelta, fee.id);
    }

    //
    //
    // Update the protocol revenue
    addSupplyRevenue(
        supplyRevenueDelta: BigDecimal,
        fee: Fee | null = null
    ): void {
        this.updateRevenue(BigDecimal.zero(), supplyRevenueDelta);

        if (!fee) {
            fee = this.getOrUpdateFee(FeeType.OTHER);
        }

        const marketRevDetails = this.getOrCreateRevenueDetail(
            this.market.id,
            true
        );
        const protocolRevenueDetail = this.getOrCreateRevenueDetail(
            this.protocol.id,
            false
        );

        this.insertInOrder(marketRevDetails, supplyRevenueDelta, fee.id);
        this.insertInOrder(protocolRevenueDetail, supplyRevenueDelta, fee.id);
    }

    private updateRevenue(
        protocolRevenueDelta: BigDecimal,
        supplyRevenueDelta: BigDecimal
    ): void {
        const totalRevenueDelta = protocolRevenueDelta.plus(supplyRevenueDelta);

        // update market
        this.market.cumulativeTotalRevenueUSD =
            this.market.cumulativeTotalRevenueUSD.plus(totalRevenueDelta);
        this.market.cumulativeProtocolSideRevenueUSD =
            this.market.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueDelta);
        this.market.cumulativeSupplySideRevenueUSD =
            this.market.cumulativeSupplySideRevenueUSD.plus(supplyRevenueDelta);
        this.saveMarket();

        // update protocol
        this.protocol.cumulativeTotalRevenueUSD =
            this.protocol.cumulativeTotalRevenueUSD.plus(totalRevenueDelta);
        this.protocol.cumulativeProtocolSideRevenueUSD =
            this.protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueDelta);
        this.protocol.cumulativeSupplySideRevenueUSD =
            this.protocol.cumulativeSupplySideRevenueUSD.plus(supplyRevenueDelta);
        this.protocol.save();

        // update revenue in snapshots
        this.snapshots.updateRevenue(protocolRevenueDelta, supplyRevenueDelta);
    }

    //
    //
    // this only updates the usage data for the entities changed in this class
    // (ie, market and protocol)
    private updateUsageData(transactionType: string, account: Bytes): void {
        this.market.cumulativeUniqueUsers += activityCounter(
            account,
            transactionType,
            false,
            0,
            this.market.id
        );
        if (transactionType == TransactionType.DEPOSIT) {
            this.market.cumulativeUniqueDepositors += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );
            this.protocol.cumulativeUniqueDepositors += activityCounter(
                account,
                transactionType,
                true,
                0
            );
        }
        if (transactionType == TransactionType.BORROW) {
            this.market.cumulativeUniqueBorrowers += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );
            this.protocol.cumulativeUniqueBorrowers += activityCounter(
                account,
                transactionType,
                true,
                0
            );
        }
        if (transactionType == TransactionType.LIQUIDATOR) {
            this.market.cumulativeUniqueLiquidators += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );
            this.protocol.cumulativeUniqueLiquidators += activityCounter(
                account,
                transactionType,
                true,
                0
            );
        }
        if (transactionType == TransactionType.LIQUIDATEE) {
            this.market.cumulativeUniqueLiquidatees += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );
            this.protocol.cumulativeUniqueLiquidatees += activityCounter(
                account,
                transactionType,
                true,
                0
            );
        }
        if (transactionType == TransactionType.TRANSFER)
            this.market.cumulativeUniqueTransferrers += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );
        if (transactionType == TransactionType.FLASHLOAN)
            this.market.cumulativeUniqueFlashloaners += activityCounter(
                account,
                transactionType,
                true,
                0,
                this.market.id
            );

        this.protocol.save();
        this.saveMarket();

        // update the snapshots in their respective class
        this.snapshots.updateUsageData(transactionType, account);
    }

    //
    //
    // this only updates the usage data for the entities changed in this class
    // (ie, market and protocol)
    private updateTransactionData(
        transactionType: string,
        amount: BigInt,
        amountUSD: BigDecimal
    ): void {
        if (transactionType == TransactionType.DEPOSIT || transactionType === TransactionType.DEPOSIT_COLLATERAL) {
            this.protocol.depositCount += INT_ONE;
            this.protocol.cumulativeDepositUSD =
                this.protocol.cumulativeDepositUSD.plus(amountUSD);
            this.market.cumulativeDepositUSD =
                this.market.cumulativeDepositUSD.plus(amountUSD);
            this.market.depositCount += INT_ONE;
        } else if (transactionType == TransactionType.WITHDRAW || transactionType === TransactionType.WITHDRAW_COLLATERAL) {
            this.protocol.withdrawCount += INT_ONE;
            this.market.withdrawCount += INT_ONE;
        } else if (transactionType == TransactionType.BORROW) {
            this.protocol.borrowCount += INT_ONE;
            this.protocol.cumulativeBorrowUSD =
                this.protocol.cumulativeBorrowUSD.plus(amountUSD);
            this.market.cumulativeBorrowUSD =
                this.market.cumulativeBorrowUSD.plus(amountUSD);
            this.market.borrowCount += INT_ONE;
        } else if (transactionType == TransactionType.REPAY) {
            this.protocol.repayCount += INT_ONE;
            this.market.repayCount += INT_ONE;
        } else if (transactionType == TransactionType.LIQUIDATE) {
            this.protocol.liquidationCount += INT_ONE;
            this.protocol.cumulativeLiquidateUSD =
                this.protocol.cumulativeLiquidateUSD.plus(amountUSD);
            this.market.cumulativeLiquidateUSD =
                this.market.cumulativeLiquidateUSD.plus(amountUSD);
            this.market.liquidationCount += INT_ONE;
        } else if (transactionType == TransactionType.FLASHLOAN) {
            this.protocol.flashloanCount += INT_ONE;
            this.market.cumulativeFlashloanUSD =
                this.market.cumulativeFlashloanUSD.plus(amountUSD);
            this.market.flashloanCount += INT_ONE;
        } else {
            log.critical("[updateTransactionData] Invalid transaction type: {}", [
                transactionType,
            ]);
            return;
        }
        this.protocol.transactionCount += INT_ONE;
        this.market.transactionCount += INT_ONE;

        this.protocol.save();
        this.saveMarket();

        // update the snapshots in their respective class
        this.snapshots.updateTransactionData(transactionType, amount, amountUSD);
    }

    //
    //
    // Insert revenue in RevenueDetail in order (alphabetized)
    private insertInOrder(
        details: RevenueDetail,
        amountUSD: BigDecimal,
        associatedSource: string
    ): void {
        if (details.sources.length == 0) {
            details.sources = [associatedSource];
            details.amountsUSD = [amountUSD];
        } else {
            let sources = details.sources;
            let amountsUSD = details.amountsUSD;

            // upsert source and amount
            if (sources.includes(associatedSource)) {
                const idx = sources.indexOf(associatedSource);
                amountsUSD[idx] = amountsUSD[idx].plus(amountUSD);

                details.sources = sources;
                details.amountsUSD = amountsUSD;
            } else {
                sources = insert(sources, associatedSource);
                amountsUSD = insert(amountsUSD, amountUSD);

                // sort amounts by sources
                const sourcesSorted = sources.sort();
                let amountsUSDSorted: BigDecimal[] = [];
                for (let i = 0; i < sourcesSorted.length; i++) {
                    const idx = sources.indexOf(sourcesSorted[i]);
                    amountsUSDSorted = insert(amountsUSDSorted, amountsUSD[idx]);
                }

                details.sources = sourcesSorted;
                details.amountsUSD = amountsUSDSorted;
            }
        }
        details.save();
    }

    //
    //
    // Get list of markets in the protocol (or add new market if not in there)
    private getOrAddMarketToList(marketID: Bytes | null = null): Bytes[] {
        let markets = _MarketList.load(this.protocol.id);
        if (!markets) {
            markets = new _MarketList(this.protocol.id);
            markets.markets = [];
        }

        if (!marketID) {
            return markets.markets;
        }

        // check if market is already in list
        if (markets.markets.includes(marketID)) {
            return markets.markets;
        }

        // add new market and return
        const marketList = markets.markets;
        marketList.push(marketID);
        markets.markets = marketList;
        markets.save();

        return marketList;
    }
}
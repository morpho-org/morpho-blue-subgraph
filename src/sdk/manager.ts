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
  Market,
  Oracle,
  Repay,
  RevenueDetail,
  Withdraw,
  _MarketList,
  Position,
} from "../../generated/schema";
import { getMarket } from "../initializers/markets";
import { getProtocol } from "../initializers/protocol";

import { AccountManager } from "./account";
import {
  activityCounter,
  exponentToBigDecimal,
  FeeType,
  INT_ONE,
  Transaction,
  TransactionType,
} from "./constants";
import { insert } from "./constants";
import { SnapshotManager } from "./snapshots";
import { TokenManager } from "./token";

export class DataManager {
  private _event!: ethereum.Event;
  private _protocol!: LendingProtocol;
  private _market!: Market;
  private _inputToken!: TokenManager;
  private _borrowedToken!: TokenManager;
  private _oracle!: Oracle;
  private _snapshots!: SnapshotManager;

  constructor(marketID: Bytes, event: ethereum.Event) {
    this._protocol = getProtocol();
    let _market = getMarket(marketID);

    this._inputToken = new TokenManager(_market.inputToken, event);
    this._borrowedToken = new TokenManager(_market.borrowedToken, event);

    // create new market
    this._market = _market;
    this._event = event;

    // load snapshots
    this._snapshots = new SnapshotManager(event, this._market);

    // load oracle
    if (this._market.oracle) {
      this._oracle = Oracle.load(this._market.oracle!)!;
    }
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
      .concat(this._market.id.toHexString());
    let rate = InterestRate.load(interestRateID);
    if (!rate) {
      rate = new InterestRate(interestRateID);
      rate.side = rateSide;
      rate.type = rateType;
    }
    rate.rate = interestRate;
    rate.save();

    let marketRates = this._market.rates;
    if (!marketRates) {
      marketRates = [];
    }

    if (marketRates.indexOf(interestRateID) == -1) {
      marketRates.push(interestRateID);
    }
    this._market.rates = marketRates;
    this._market.save();

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

    let protocolFees = this._protocol.fees;
    if (!protocolFees) {
      protocolFees = [];
    }

    if (protocolFees.indexOf(feeType) == -1) {
      protocolFees.push(feeType);
    }
    this._protocol.fees = protocolFees;
    this._protocol.save();

    return fee;
  }

  getOrCreateRevenueDetail(id: Bytes, isMarket: boolean): RevenueDetail {
    let details = RevenueDetail.load(id);
    if (!details) {
      details = new RevenueDetail(id);
      details.sources = [];
      details.amountsUSD = [];
      details.save();

      if (isMarket) {
        this._market.revenueDetail = details.id;
        this._market.save();
      } else {
        this._protocol.revenueDetail = details.id;
        this._protocol.save();
      }
    }

    return details;
  }

  //////////////////
  //// Creators ////
  //////////////////

  createDepositCollateral(position: Position, amount: BigInt): Deposit {
    const token = new TokenManager(this._market.inputToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const deposit = new Deposit(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.DEPOSIT)
    );
    deposit.isCollateral = true;

    deposit.hash = this._event.transaction.hash;
    deposit.nonce = this._event.transaction.nonce;
    deposit.logIndex = this._event.logIndex.toI32();
    deposit.gasPrice = this._event.transaction.gasPrice;
    deposit.gasUsed = this._event.receipt ? this._event.receipt!.gasUsed : null;
    deposit.gasLimit = this._event.transaction.gasLimit;
    deposit.blockNumber = this._event.block.number;
    deposit.timestamp = this._event.block.timestamp;
    deposit.account = position.account;
    deposit.market = this._market.id;
    deposit.position = position.id;
    deposit.asset = position.asset;
    deposit.amount = amount;
    deposit.amountUSD = amountUSD;
    deposit.save();

    this.updateTransactionData(
      TransactionType.DEPOSIT_COLLATERAL,
      amount,
      amountUSD
    );
    this.updateUsageData(TransactionType.DEPOSIT_COLLATERAL, position.account);

    return deposit;
  }

  createDeposit(position: Position, amount: BigInt, shares: BigInt): Deposit {
    const token = new TokenManager(this._market.inputToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const deposit = new Deposit(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.DEPOSIT)
    );
    deposit.isCollateral = false;

    deposit.hash = this._event.transaction.hash;
    deposit.nonce = this._event.transaction.nonce;
    deposit.logIndex = this._event.logIndex.toI32();
    deposit.gasPrice = this._event.transaction.gasPrice;
    deposit.gasUsed = this._event.receipt ? this._event.receipt!.gasUsed : null;
    deposit.gasLimit = this._event.transaction.gasLimit;
    deposit.blockNumber = this._event.block.number;
    deposit.timestamp = this._event.block.timestamp;
    deposit.account = position.account;
    deposit.market = this._market.id;
    deposit.position = position.id;
    deposit.asset = position.asset;
    deposit.amount = amount;
    deposit.amountUSD = amountUSD;
    deposit.save();

    this.updateTransactionData(TransactionType.DEPOSIT, amount, amountUSD);
    this.updateUsageData(TransactionType.DEPOSIT, position.account);

    return deposit;
  }

  createWithdrawCollateral(position: Position, amount: BigInt): Withdraw {
    const token = new TokenManager(this._market.inputToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const withdraw = new Withdraw(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.WITHDRAW)
    );
    withdraw.hash = this._event.transaction.hash;
    withdraw.nonce = this._event.transaction.nonce;
    withdraw.logIndex = this._event.logIndex.toI32();
    withdraw.gasPrice = this._event.transaction.gasPrice;
    withdraw.gasUsed = this._event.receipt
      ? this._event.receipt!.gasUsed
      : null;
    withdraw.gasLimit = this._event.transaction.gasLimit;
    withdraw.blockNumber = this._event.block.number;
    withdraw.timestamp = this._event.block.timestamp;
    withdraw.account = position.account;
    withdraw.market = this._market.id;
    withdraw.position = position.id;
    withdraw.asset = position.asset;
    withdraw.amount = amount;
    withdraw.amountUSD = amountUSD;
    withdraw.isCollateral = true;
    withdraw.save();

    this.updateTransactionData(
      TransactionType.WITHDRAW_COLLATERAL,
      amount,
      amountUSD
    );
    this.updateUsageData(TransactionType.WITHDRAW_COLLATERAL, position.account);

    return withdraw;
  }

  createWithdraw(position: Position, amount: BigInt, shares: BigInt): Withdraw {
    const token = new TokenManager(this._market.borrowedToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const withdraw = new Withdraw(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.WITHDRAW)
    );
    withdraw.hash = this._event.transaction.hash;
    withdraw.nonce = this._event.transaction.nonce;
    withdraw.logIndex = this._event.logIndex.toI32();
    withdraw.gasPrice = this._event.transaction.gasPrice;
    withdraw.gasUsed = this._event.receipt
      ? this._event.receipt!.gasUsed
      : null;
    withdraw.gasLimit = this._event.transaction.gasLimit;
    withdraw.blockNumber = this._event.block.number;
    withdraw.timestamp = this._event.block.timestamp;
    withdraw.account = position.account;
    withdraw.market = this._market.id;
    withdraw.position = position.id;
    withdraw.asset = this._market.borrowedToken;
    withdraw.amount = amount;
    withdraw.amountUSD = amountUSD;
    withdraw.isCollateral = false;
    withdraw.shares = shares;
    withdraw.save();

    this.updateTransactionData(TransactionType.WITHDRAW, amount, amountUSD);
    this.updateUsageData(TransactionType.WITHDRAW, position.account);

    return withdraw;
  }

  createBorrow(position: Position, amount: BigInt, shares: BigInt): Borrow {
    const token = new TokenManager(this._market.borrowedToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const borrow = new Borrow(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.BORROW)
    );
    borrow.hash = this._event.transaction.hash;
    borrow.nonce = this._event.transaction.nonce;
    borrow.logIndex = this._event.logIndex.toI32();
    borrow.gasPrice = this._event.transaction.gasPrice;
    borrow.gasUsed = this._event.receipt ? this._event.receipt!.gasUsed : null;
    borrow.gasLimit = this._event.transaction.gasLimit;
    borrow.blockNumber = this._event.block.number;
    borrow.timestamp = this._event.block.timestamp;
    borrow.account = position.account;
    borrow.market = this._market.id;
    borrow.position = position.id;
    borrow.asset = this._market.borrowedToken;
    borrow.amount = amount;
    borrow.amountUSD = amountUSD;
    borrow.shares = shares;
    borrow.save();

    this.updateTransactionData(TransactionType.BORROW, amount, amountUSD);
    this.updateUsageData(TransactionType.BORROW, position.account);

    return borrow;
  }

  createRepay(
    position: Position,
    amount: BigInt,
    shares: BigInt
  ): Repay | null {
    const token = new TokenManager(this._market.borrowedToken, this._event);

    const amountUSD = token.getAmountUSD(amount);

    const repay = new Repay(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.REPAY)
    );

    repay.hash = this._event.transaction.hash;
    repay.nonce = this._event.transaction.nonce;
    repay.logIndex = this._event.logIndex.toI32();
    repay.gasPrice = this._event.transaction.gasPrice;
    repay.gasUsed = this._event.receipt ? this._event.receipt!.gasUsed : null;
    repay.gasLimit = this._event.transaction.gasLimit;
    repay.blockNumber = this._event.block.number;
    repay.timestamp = this._event.block.timestamp;
    repay.account = position.account;
    repay.market = this._market.id;
    repay.position = position.id;
    repay.asset = position.asset;
    repay.amount = amount;
    repay.shares = shares;
    repay.amountUSD = amountUSD;
    repay.save();

    this.updateTransactionData(TransactionType.REPAY, amount, amountUSD);
    this.updateUsageData(TransactionType.REPAY, position.account);

    return repay;
  }

  createFlashloan(asset: Address, account: Address, amount: BigInt): Flashloan {
    const flashloaner = new AccountManager(account).getAccount();

    flashloaner.flashloanCount += INT_ONE;
    flashloaner.save();

    const token = new TokenManager(asset, this._event);
    const amountUSD = token.getAmountUSD(amount);

    const flashloan = new Flashloan(
      this._event.transaction.hash
        .concatI32(this._event.logIndex.toI32())
        .concatI32(Transaction.FLASHLOAN)
    );
    flashloan.hash = this._event.transaction.hash;
    flashloan.nonce = this._event.transaction.nonce;
    flashloan.logIndex = this._event.logIndex.toI32();
    flashloan.gasPrice = this._event.transaction.gasPrice;
    flashloan.gasUsed = this._event.receipt
      ? this._event.receipt!.gasUsed
      : null;
    flashloan.gasLimit = this._event.transaction.gasLimit;
    flashloan.blockNumber = this._event.block.number;
    flashloan.timestamp = this._event.block.timestamp;
    flashloan.account = account;
    flashloan.market = this._market.id;
    flashloan.asset = asset;
    flashloan.amount = amount;
    flashloan.amountUSD = amountUSD;
    flashloan.save();

    this.updateTransactionData(TransactionType.FLASHLOAN, amount, amountUSD);
    this.updateUsageData(TransactionType.FLASHLOAN, account);

    return flashloan;
  }

  // used to update tvl, borrow balance, reserves, etc. in market and protocol
  updateMarketAndProtocolData(): void {
    const inputTokenPriceUSD = this._inputToken.updatePrice();
    const borrowableTokenPriceUSD = this._borrowedToken.updatePrice();
    this._market.inputTokenPriceUSD = inputTokenPriceUSD;

    const vBorrowAmount = this._market.variableBorrowedTokenBalance
      ? this._market
          .variableBorrowedTokenBalance!.toBigDecimal()
          .div(exponentToBigDecimal(this._borrowedToken.getDecimals()))
      : BigDecimal.zero();

    const totalCollateralUSD = this._market.totalCollateral
      .toBigDecimal()
      .div(exponentToBigDecimal(this._inputToken.getDecimals()))
      .times(inputTokenPriceUSD);

    const totalSupplyUSD = this._market.totalSupply
      .toBigDecimal()
      .div(exponentToBigDecimal(this._borrowedToken.getDecimals()))
      .times(borrowableTokenPriceUSD);

    this._market.totalValueLockedUSD = totalCollateralUSD.plus(totalSupplyUSD);
    this._market.totalDepositBalanceUSD = this._market.totalValueLockedUSD;

    this._market.save();

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
    this._protocol.totalValueLockedUSD = totalValueLockedUSD;
    this._protocol.totalDepositBalanceUSD = totalValueLockedUSD;
    this._protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
    this._protocol.save();
  }

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
      this._market.id,
      true
    );
    const protocolRevenueDetail = this.getOrCreateRevenueDetail(
      this._protocol.id,
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
      this._market.id,
      true
    );
    const protocolRevenueDetail = this.getOrCreateRevenueDetail(
      this._protocol.id,
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
    this._market.cumulativeTotalRevenueUSD =
      this._market.cumulativeTotalRevenueUSD.plus(totalRevenueDelta);
    this._market.cumulativeProtocolSideRevenueUSD =
      this._market.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueDelta);
    this._market.cumulativeSupplySideRevenueUSD =
      this._market.cumulativeSupplySideRevenueUSD.plus(supplyRevenueDelta);

    this._market.save();

    // update protocol
    this._protocol.cumulativeTotalRevenueUSD =
      this._protocol.cumulativeTotalRevenueUSD.plus(totalRevenueDelta);
    this._protocol.cumulativeProtocolSideRevenueUSD =
      this._protocol.cumulativeProtocolSideRevenueUSD.plus(
        protocolRevenueDelta
      );
    this._protocol.cumulativeSupplySideRevenueUSD =
      this._protocol.cumulativeSupplySideRevenueUSD.plus(supplyRevenueDelta);
    this._protocol.save();

    // update revenue in snapshots
    this._snapshots.updateRevenue(protocolRevenueDelta, supplyRevenueDelta);
  }

  //
  //
  // this only updates the usage data for the entities changed in this class
  // (ie, market and protocol)
  private updateUsageData(transactionType: string, account: Bytes): void {
    this._market.cumulativeUniqueUsers += activityCounter(
      account,
      transactionType,
      false,
      0,
      this._market.id
    );
    if (transactionType == TransactionType.DEPOSIT) {
      this._market.cumulativeUniqueDepositors += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );
      this._protocol.cumulativeUniqueDepositors += activityCounter(
        account,
        transactionType,
        true,
        0
      );
    }
    if (transactionType == TransactionType.BORROW) {
      this._market.cumulativeUniqueBorrowers += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );
      this._protocol.cumulativeUniqueBorrowers += activityCounter(
        account,
        transactionType,
        true,
        0
      );
    }
    if (transactionType == TransactionType.LIQUIDATOR) {
      this._market.cumulativeUniqueLiquidators += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );
      this._protocol.cumulativeUniqueLiquidators += activityCounter(
        account,
        transactionType,
        true,
        0
      );
    }
    if (transactionType == TransactionType.LIQUIDATEE) {
      this._market.cumulativeUniqueLiquidatees += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );
      this._protocol.cumulativeUniqueLiquidatees += activityCounter(
        account,
        transactionType,
        true,
        0
      );
    }
    if (transactionType == TransactionType.TRANSFER)
      this._market.cumulativeUniqueTransferrers += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );
    if (transactionType == TransactionType.FLASHLOAN)
      this._market.cumulativeUniqueFlashloaners += activityCounter(
        account,
        transactionType,
        true,
        0,
        this._market.id
      );

    this._protocol.save();
    this._market.save();

    // update the snapshots in their respective class
    this._snapshots.updateUsageData(transactionType, account);
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
    if (
      transactionType == TransactionType.DEPOSIT ||
      transactionType === TransactionType.DEPOSIT_COLLATERAL
    ) {
      this._protocol.depositCount += INT_ONE;
      this._protocol.cumulativeDepositUSD =
        this._protocol.cumulativeDepositUSD.plus(amountUSD);
      this._market.cumulativeDepositUSD =
        this._market.cumulativeDepositUSD.plus(amountUSD);
      this._market.depositCount += INT_ONE;
    } else if (
      transactionType == TransactionType.WITHDRAW ||
      transactionType === TransactionType.WITHDRAW_COLLATERAL
    ) {
      this._protocol.withdrawCount += INT_ONE;
      this._market.withdrawCount += INT_ONE;
    } else if (transactionType == TransactionType.BORROW) {
      this._protocol.borrowCount += INT_ONE;
      this._protocol.cumulativeBorrowUSD =
        this._protocol.cumulativeBorrowUSD.plus(amountUSD);
      this._market.cumulativeBorrowUSD =
        this._market.cumulativeBorrowUSD.plus(amountUSD);
      this._market.borrowCount += INT_ONE;
    } else if (transactionType == TransactionType.REPAY) {
      this._protocol.repayCount += INT_ONE;
      this._market.repayCount += INT_ONE;
    } else if (transactionType == TransactionType.LIQUIDATE) {
      this._protocol.liquidationCount += INT_ONE;
      this._protocol.cumulativeLiquidateUSD =
        this._protocol.cumulativeLiquidateUSD.plus(amountUSD);
      this._market.cumulativeLiquidateUSD =
        this._market.cumulativeLiquidateUSD.plus(amountUSD);
      this._market.liquidationCount += INT_ONE;
    } else if (transactionType == TransactionType.FLASHLOAN) {
      this._protocol.flashloanCount += INT_ONE;
      this._market.cumulativeFlashloanUSD =
        this._market.cumulativeFlashloanUSD.plus(amountUSD);
      this._market.flashloanCount += INT_ONE;
    } else {
      log.critical("[updateTransactionData] Invalid transaction type: {}", [
        transactionType,
      ]);
      return;
    }
    this._protocol.transactionCount += INT_ONE;
    this._market.transactionCount += INT_ONE;

    this._protocol.save();
    this._market.save();

    // update the snapshots in their respective class
    this._snapshots.updateTransactionData(transactionType, amount, amountUSD);
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
    // TODO: whitelist marketSource for a list of markets.
    let markets = _MarketList.load(this._protocol.id);
    if (!markets) {
      markets = new _MarketList(this._protocol.id);
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

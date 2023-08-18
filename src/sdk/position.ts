import {
  BigDecimal,
  Bytes,
  BigInt,
  log,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  Account,
  Market,
  Position,
  _PositionCounter,
  PositionSnapshot,
} from "../../generated/schema";
import { getProtocol } from "../initializers/protocol";

import {
  BIGINT_ZERO,
  exponentToBigDecimal,
  INT_ONE,
  INT_ZERO,
  SECONDS_PER_DAY,
  TransactionType,
} from "./constants";
import { PositionSide } from "./constants";
import { SnapshotManager } from "./snapshots";
import { TokenManager } from "./token";

/**
 * This file contains the PositionManager class, which is used to
 * make changes to a given position.
 *
 * Schema Version:  3.1.0
 * SDK Version:     1.0.6
 * Author(s):
 *  - @dmelotik
 *  - @dhruv-chauhan
 */

export class PositionManager {
  private counterID: string;
  private position: Position | null = null;
  private market: Market;
  private account: Account;
  private side: string;

  constructor(account: Account, market: Market, side: string) {
    this.counterID = account.id
      .toHexString()
      .concat("-")
      .concat(market.id.toHexString())
      .concat("-")
      .concat(side);
    const positionCounter = _PositionCounter.load(this.counterID);
    if (positionCounter) {
      const positionID = positionCounter.id
        .concat("-")
        .concat(positionCounter.nextCount.toString());
      this.position = Position.load(positionID);
    }

    this.market = market;
    this.account = account;
    this.side = side;
  }

  getPositionID(): string | null {
    if (this.position) {
      return this.position!.id;
    }
    return null;
  }

  _getPositionBalance(): BigInt | null {
    if (this.position) {
      return this.position!.balance;
    }
    return null;
  }

  setCollateral(isCollateral: boolean): void {
    if (this.position) {
      this.position!.isCollateral = isCollateral;
      this.position!.save();
    }
  }

  addPosition(
    event: ethereum.Event,
    asset: Bytes,
    newBalance: BigInt,
    shares: BigInt | null,
    transactionType: string,
    priceUSD: BigDecimal
  ): string | null {
    if (
      transactionType === TransactionType.DEPOSIT ||
      (transactionType === TransactionType.BORROW && shares === null)
    ) {
      log.critical(
        "[addPosition] shares must be provided for supply or borrow",
        []
      );
      return null;
    }
    let positionCounter = _PositionCounter.load(this.counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(this.counterID);
      positionCounter.nextCount = 0;
      positionCounter.lastTimestamp = event.block.timestamp;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);
    const openPosition = position == null;
    if (!openPosition) {
      // update existing position
      position = position!;
      position.balance = newBalance;
      if (
        transactionType == TransactionType.DEPOSIT ||
        transactionType === TransactionType.DEPOSIT_COLLATERAL
      ) {
        position.depositCount += INT_ONE;
      } else if (transactionType == TransactionType.BORROW) {
        position.borrowCount += INT_ONE;
      }
      // Note: liquidateCount is not incremented here
      position.save();
      this.position = position;

      //
      // take position snapshot
      //
      this.snapshotPosition(event, priceUSD);
      return null;
    }
    position = new Position(positionID);
    position.account = this.account.id;
    position.market = this.market.id;
    position.asset = asset;
    position.hashOpened = event.transaction.hash;
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = this.side;
    position.balance = newBalance;
    if (shares) position.shares = shares;
    position.depositCount = INT_ZERO;
    position.withdrawCount = INT_ZERO;
    position.borrowCount = INT_ZERO;
    position.repayCount = INT_ZERO;
    position.liquidationCount = INT_ZERO;
    position.transferredCount = INT_ZERO;
    position.receivedCount = INT_ZERO;

    if (transactionType == TransactionType.DEPOSIT) {
      position.depositCount += INT_ONE;
      position.isCollateral = false;
    } else if (transactionType === TransactionType.DEPOSIT_COLLATERAL) {
      position.depositCount += INT_ONE;
      position.isCollateral = true;
    } else if (transactionType == TransactionType.BORROW) {
      position.borrowCount += INT_ONE;
    }
    position.save();

    //
    // update account position
    //
    this.account.positionCount += 1;
    this.account.openPositionCount += 1;
    this.account.save();

    //
    // update market position
    //
    this.market.positionCount += 1;
    this.market.openPositionCount += 1;

    if (
      transactionType == TransactionType.DEPOSIT ||
      transactionType == TransactionType.DEPOSIT_COLLATERAL
    ) {
      this.market.lendingPositionCount += 1;
    } else if (transactionType == TransactionType.BORROW) {
      this.market.borrowingPositionCount += 1;
    }
    this.market.save();

    //
    // update protocol position
    //
    const protocol = getProtocol();
    protocol.cumulativePositionCount += 1;
    protocol.openPositionCount += 1;
    protocol.save();

    this.position = position;

    //
    // take position snapshot
    //
    this.snapshotPosition(event, priceUSD);
    this.dailyActivePosition(positionCounter, event);
    return this.getPositionID();
  }

  subtractPosition(
    event: ethereum.Event,
    newBalance: BigInt,
    shares: BigInt | null,
    transactionType: string,
    priceUSD: BigDecimal
  ): string | null {
    if (
      transactionType === TransactionType.WITHDRAW ||
      (transactionType === TransactionType.WITHDRAW_COLLATERAL &&
        shares === null)
    ) {
      log.critical(
        "[subtractPosition] shares must be provided for withdraw or repay",
        []
      );
      return null;
    }
    const positionCounter = _PositionCounter.load(this.counterID);
    if (!positionCounter) {
      log.critical("[subtractPosition] position counter {} not found", [
        this.counterID,
      ]);
      return null;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());
    const position = Position.load(positionID);
    if (!position) {
      log.critical("[subtractPosition] position {} not found", [positionID]);
      return null;
    }

    position.balance = newBalance;
    if (shares) position.shares = shares;

    if (
      transactionType == TransactionType.WITHDRAW ||
      transactionType === TransactionType.WITHDRAW_COLLATERAL
    ) {
      position.withdrawCount += INT_ONE;
    } else if (transactionType == TransactionType.REPAY) {
      position.repayCount += INT_ONE;
    } else if (transactionType == TransactionType.LIQUIDATE) {
      position.liquidationCount += INT_ONE;
    }
    position.save();

    const closePosition = position.balance == BIGINT_ZERO;
    if (closePosition) {
      //
      // update position counter
      //
      positionCounter.nextCount += INT_ONE;
      positionCounter.save();

      //
      // close position
      //
      position.hashClosed = event.transaction.hash;
      position.blockNumberClosed = event.block.number;
      position.timestampClosed = event.block.timestamp;
      position.save();

      //
      // update account position
      //
      this.account.openPositionCount -= INT_ONE;
      this.account.closedPositionCount += INT_ONE;
      this.account.save();

      //
      // update market position
      //
      this.market.openPositionCount -= INT_ONE;
      this.market.closedPositionCount += INT_ONE;
      this.market.save();

      //
      // update protocol position
      //
      const protocol = getProtocol();
      protocol.openPositionCount -= INT_ONE;
      protocol.save();
    }
    this.position = position;

    //
    // update position snapshot
    //
    this.snapshotPosition(event, priceUSD);
    this.dailyActivePosition(positionCounter, event);
    return this.getPositionID();
  }

  private snapshotPosition(event: ethereum.Event, priceUSD: BigDecimal): void {
    const snapshot = new PositionSnapshot(
      this.position!.id.concat("-")
        .concat(event.transaction.hash.toHexString())
        .concat("-")
        .concat(event.logIndex.toString())
    );
    const token = new TokenManager(this.position!.asset, event);
    const mantissaFactorBD = exponentToBigDecimal(token.getDecimals());
    snapshot.hash = event.transaction.hash;
    snapshot.logIndex = event.logIndex.toI32();
    snapshot.nonce = event.transaction.nonce;
    snapshot.account = this.account.id;
    snapshot.position = this.position!.id;
    snapshot.balance = this.position!.balance;
    snapshot.balanceUSD = this.position!.balance.toBigDecimal()
      .div(mantissaFactorBD)
      .times(priceUSD);
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;

    if (this.position!.principal) snapshot.principal = this.position!.principal;
    if (
      this.market.borrowIndex &&
      this.position!.side == PositionSide.BORROWER
    ) {
      snapshot.index = this.market.borrowIndex;
    } else if (
      this.market.supplyIndex &&
      this.position!.side == PositionSide.COLLATERAL
    ) {
      snapshot.index = this.market.supplyIndex;
    }

    snapshot.save();
  }

  private dailyActivePosition(
    counter: _PositionCounter,
    event: ethereum.Event
  ): void {
    const lastDay = counter.lastTimestamp.toI32() / SECONDS_PER_DAY;
    const currentDay = event.block.timestamp.toI32() / SECONDS_PER_DAY;
    if (lastDay == currentDay) {
      return;
    }

    // this is a new active position
    const snapshots = new SnapshotManager(event, this.market);
    snapshots.addDailyActivePosition(this.side);

    counter.lastTimestamp = event.block.timestamp;
    counter.save();
  }

  private _checkPositionConsistency(
    positionSide: PositionSide,
    transactionType: TransactionType
  ): null {
    if (
      positionSide === PositionSide.COLLATERAL &&
      !(
        transactionType === TransactionType.DEPOSIT_COLLATERAL ||
        transactionType === TransactionType.WITHDRAW_COLLATERAL
      )
    ) {
      log.critical(
        "[subtractPosition] transaction type {} is not valid for collateral position",
        [transactionType as string]
      );
      return null;
    }
    if (
      positionSide === PositionSide.SUPPLIER &&
      !(
        transactionType === TransactionType.DEPOSIT ||
        transactionType === TransactionType.WITHDRAW
      )
    ) {
      log.critical(
        "[subtractPosition] transaction type {} is not valid for supply position",
        [transactionType as string]
      );
      return null;
    }
    if (
      positionSide === PositionSide.BORROWER &&
      !(
        transactionType === TransactionType.BORROW ||
        transactionType === TransactionType.REPAY
      )
    ) {
      log.critical(
        "[subtractPosition] transaction type {} is not valid for borrow position",
        [transactionType as string]
      );
      return null;
    }
  }
}

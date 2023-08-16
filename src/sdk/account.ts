import { Bytes } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { INT_ONE, INT_ZERO } from "./constants";

/**
 * This file contains the AccountClass, which does
 * the operations on the Account entity. This includes:
 *  - Creating a new Account
 *  - Updating an existing Account
 *  - Making a position
 *  - Making position snapshots
 *
 * Schema Version:  3.1.0
 * SDK Version:     1.0.6
 * Author(s):
 *  - @dmelotik
 *  - @dhruv-chauhan
 */

export class AccountManager {
    private _isNew: boolean; // true if the account was created
    private _account: Account;

    constructor(account: Bytes) {
        let _account = Account.load(account);
        if (!_account) {
            _account = new Account(account);
            _account.positionCount = INT_ZERO;
            _account.openPositionCount = INT_ZERO;
            _account.closedPositionCount = INT_ZERO;
            _account.depositCount = INT_ZERO;
            _account.withdrawCount = INT_ZERO;
            _account.borrowCount = INT_ZERO;
            _account.repayCount = INT_ZERO;
            _account.liquidateCount = INT_ZERO;
            _account.liquidationCount = INT_ZERO;
            _account.transferredCount = INT_ZERO;
            _account.receivedCount = INT_ZERO;
            _account.flashloanCount = INT_ZERO;
            _account.save();
            this._isNew = true;
        } else {
            this._isNew = false;
        }
        this._account = _account;
    }

    getAccount(): Account {
        return this._account;
    }

    // returns true if the account was created in this instance
    isNewUser(): boolean {

        // true if there have been no transactions submitted by the user
        // ie, liquidations and receives don't count (did not spend gas)
        return this._isNew || (
            this._account.depositCount == INT_ZERO &&
            this._account.withdrawCount == INT_ZERO &&
            this._account.borrowCount == INT_ZERO &&
            this._account.repayCount == INT_ZERO &&
            this._account.liquidateCount == INT_ZERO &&
            this._account.transferredCount == INT_ZERO &&
            this._account.flashloanCount == INT_ZERO
        );
    }

    countFlashloan(): void {
        this._account.flashloanCount += INT_ONE;
        this._account.save();
    }

    // Ensure this is called on the liquidators account
    countLiquidate(): void {
        this._account.liquidateCount += INT_ONE;
        this._account.save();
    }

}
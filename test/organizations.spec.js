const expectedExceptionPromise = require("../utils/expectedException.js");
const Organizations = artifacts.require("./Organizations.sol");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Organizations', accounts => {

    let owner0, owner1, worker0, orgs;

    before("should prepare", async () => {
        assert.isAtLeast(accounts.length, 3);
        owner0 = accounts[0];
        owner1 = accounts[1];
        worker0 = accounts[2];
        const balance = await web3.eth.getBalancePromise(owner0);
        assert.isAtLeast(web3.fromWei(balance).toNumber(), 10);
    });

    describe("deploy", () => {

        it("should be possible to deploy Organizations contract", async () => {
            const orgs = await Organizations.new({ from: owner0 });
            const contractBalance = await orgs.contractBalance();
            assert.strictEqual(contractBalance.toNumber(), 0, 'Wrong initial contract balance');
        });

    });

    describe("Add an organization", () => {
      beforeEach("should deploy organizations contract", async () => {
          orgs = await Organizations.new({ from: owner0 });
      });

      it("should be possible to add an organization", async () => {
          const tx = await orgs.addOrganization({ from: owner0 });
          const orgBalance = await orgs.getOrganizationBalance();
          assert.strictEqual(orgBalance.toNumber(), 0, 'Wrong initial org balance');
          assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logOrgAdded = tx.logs[0];
          assert.strictEqual(logOrgAdded.event, "LogOrganizationAdded");
          assert.strictEqual(logOrgAdded.args._org, owner0);
      });

      it("should not be possible to add an existing organization", async () => {
          await orgs.addOrganization({ from: owner0 });
          return expectedExceptionPromise(
              () => orgs.addOrganization({ from: owner0, gas: 3000000 }),
              3000000);
      });

    });

    describe("Deposit Operations", () => {

      beforeEach("should deploy organizations contract and add organization", async () => {
          orgs = await Organizations.new({ from: owner0 });
          orgs.addOrganization({ from: owner0 })
      });

      it("should be possible to deposit funds", async () => {
          const amount = web3.toWei(1, 'ether');
          const tx = await orgs.deposit({ from: owner0, value: amount });
          const contractBalance = await orgs.contractBalance();
          assert.strictEqual(contractBalance.toNumber(), +amount, 'Wrong balance amount');
          assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logDeposit = tx.logs[0];
          assert.strictEqual(logDeposit.event, "LogDeposit");
          assert.strictEqual(logDeposit.args.amount.toNumber(), +amount, 'Wrong log amount');
      });

      it("should not be possible to deposit 0 funds", async () => {
          const amount = web3.toWei(0, 'ether');
          return expectedExceptionPromise(
              () => orgs.deposit({ from: owner0, value: amount, gas: 3000000 }),
              3000000);
      });

      it("should not be possible to deposit to non existing organization", async () => {
          const amount = web3.toWei(1, 'ether');
          return expectedExceptionPromise(
              () => orgs.deposit({ from: owner1, value: amount,  gas: 3000000 }),
              3000000);
      });

      it("should not be possible to deposit w/ no funds", async () => {
          return expectedExceptionPromise(
              () => orgs.deposit({ from: owner0,  gas: 3000000 }),
              3000000);
      });

    });

    describe("Reward Operations", () => {

      beforeEach("should deploy organizations contract and add organization", async () => {
          orgs = await Organizations.new({ from: owner0 });
          orgs.addOrganization({ from: owner0 })
      });

      it("should be possible to reward worker", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0.5, 'ether');
          const initialWorkerBalance = await web3.eth.getBalancePromise(worker0);
          await orgs.deposit({ from: owner0, value: amount });
          const tx = await orgs.rewardWorker(worker0, rewardAmount, { from: owner0});
          assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logReward = tx.logs[0];
          assert.strictEqual(logReward.event, "LogWorkerRewarded");
          assert.strictEqual(logReward.args._worker, worker0, 'Wrong rewarded worker');
          assert.strictEqual(logReward.args._reward.toNumber(), +rewardAmount, 'Wrong reward amount');
          const finalWorkerBalance = await web3.eth.getBalancePromise(worker0);
          const balanceDiff = (
            finalWorkerBalance.toNumber() -
            initialWorkerBalance.toNumber()
          );
          assert.strictEqual(balanceDiff, +rewardAmount, 'Wrong final worker balance');
      });

      it("should not be possible to reward invalid address", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0.5, 'ether');
          await orgs.deposit({ from: owner0, value: amount });
          return expectedExceptionPromise(
              () => orgs.rewardWorker(0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward worker of non-existant organization", async () => {
        const amount = web3.toWei(1, 'ether');
        const rewardAmount = web3.toWei(0.5, 'ether');
        const initialWorkerBalance = await web3.eth.getBalancePromise(worker0);
        await orgs.deposit({ from: owner0, value: amount });
          return expectedExceptionPromise(
              () => orgs.rewardWorker(worker0, rewardAmount, { from: owner1, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward 0", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0, 'ether');
          await orgs.deposit({ from: owner0, value: amount });
          return expectedExceptionPromise(
              () => orgs.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward more than current contract balance", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(2, 'ether');
          await orgs.deposit({ from: owner0, value: amount });
          return expectedExceptionPromise(
              () => orgs.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward more than organization balance", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(2, 'ether');
          await orgs.addOrganization({ from: owner1 })
          await orgs.deposit({ from: owner0, value: amount });
          await orgs.deposit({ from: owner1, value: 3 * amount });
          return expectedExceptionPromise(
              () => orgs.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

    });

});

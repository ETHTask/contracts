const expectedExceptionPromise = require("../utils/expectedException.js");
const Organization = artifacts.require("./Organization.sol");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Organization', accounts => {

    let owner0, owner1, worker0, worker1, org;

    before("should prepare", async () => {
        assert.isAtLeast(accounts.length, 4);
        owner0 = accounts[0];
        owner1 = accounts[1]
        worker0 = accounts[2];
        worker1 = accounts[3];
        const balance = await web3.eth.getBalancePromise(owner0);
        assert.isAtLeast(web3.fromWei(balance).toNumber(), 10);
    });

    describe("deploy", () => {

        it("should be possible to deploy an Organization", async () => {
            const org = await Organization.new({ from: owner0 });
            const contractBalance = await org.contractBalance();
            assert.strictEqual(contractBalance.toNumber(), 0, 'Wrong initial balance');
        });

    });

    describe("Worker Operations", () => {

      beforeEach("should deploy organization", async () => {
          org = await Organization.new({ from: owner0 });
      });

        it("should be possible to add a worker", async () => {
            const tx = await org.addWorker(worker0, { from: owner0 });
            const workerExists = await org.getWorkerExistance(worker0);
            assert.strictEqual(tx.receipt.logs.length, 1);
            assert.strictEqual(tx.logs.length, 1);
            const logWorkerAdded = tx.logs[0];
            assert.strictEqual(logWorkerAdded.event, "LogWorkerAdded");
            assert.strictEqual(logWorkerAdded.args._worker, worker0);
            assert.strictEqual(workerExists, true, 'Worker does not exist');
        });

        it("should be possible to remove a worker", async () => {
            await org.addWorker(worker0, { from: owner0 });
            const tx = await org.removeWorker(worker0, { from: owner0 });
            const workerExists = await org.getWorkerExistance(worker0);
            assert.strictEqual(tx.receipt.logs.length, 1);
            assert.strictEqual(tx.logs.length, 1);
            const logWorkerAdded = tx.logs[0];
            assert.strictEqual(logWorkerAdded.event, "LogWorkerRemoved");
            assert.strictEqual(logWorkerAdded.args._worker, worker0);
            assert.strictEqual(workerExists, false, 'Worker still exists');
        });

        it("should be possible to add multiple workers", async () => {
            const tx = await org.addWorker(worker0, { from: owner0 });
            const workerExists = await org.getWorkerExistance(worker0);
            assert.strictEqual(tx.receipt.logs.length, 1);
            assert.strictEqual(tx.logs.length, 1);
            const logWorkerAdded = tx.logs[0];
            assert.strictEqual(logWorkerAdded.event, "LogWorkerAdded");
            assert.strictEqual(logWorkerAdded.args._worker, worker0);
            assert.strictEqual(workerExists, true, 'Worker does not exist');

            const tx2 = await org.addWorker(worker1, { from: owner0 });
            const workerExists2 = await org.getWorkerExistance(worker0);
            assert.strictEqual(tx2.receipt.logs.length, 1);
            assert.strictEqual(tx2.logs.length, 1);
            const logWorkerAdded2 = tx2.logs[0];
            assert.strictEqual(logWorkerAdded2.event, "LogWorkerAdded");
            assert.strictEqual(logWorkerAdded2.args._worker, worker1);
            assert.strictEqual(workerExists2, true, 'Worker does not exist');
        });

        it("should not be possible to add a worker w/ wrong owner", () => {
          return expectedExceptionPromise(
              () => org.addWorker(worker0, { from: owner1, gas: 3000000 }),
              3000000);
        });

        it("should not be possible to add an existing worker", async () => {
            await org.addWorker(worker0, { from: owner0 });
            return expectedExceptionPromise(
                () => org.addWorker(worker0, { from: owner0, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to add worker w/ invalid address", async () => {
            return expectedExceptionPromise(
                () => org.addWorker(0, { from: owner0, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to remove a worker w/ wrong owner", async () => {
            await org.addWorker(worker0, { from: owner0 });
            return expectedExceptionPromise(
                () => org.removeWorker(0, { from: owner0, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to remove a non-existing worker", async () => {
            return expectedExceptionPromise(
                () => org.removeWorker(worker0, { from: owner0, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to remove a worker w/ invalid address", async () => {
            return expectedExceptionPromise(
                () => org.removeWorker(0, { from: owner0, gas: 3000000 }),
                3000000);
        });

    });

    describe("Deposit Operations", () => {

      beforeEach("should deploy organization", async () => {
          org = await Organization.new({ from: owner0 });
      });

      it("should be possible to deposit funds", async () => {
          const amount = web3.toWei(1, 'ether');
          const tx = await org.deposit({ from: owner0, value: amount });
          const contractBalance = await org.contractBalance();
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
              () => org.deposit({ from: owner0, value: amount, gas: 3000000 }),
              3000000);
      });

      it("should not be possible to deposit w/ wrong owner", async () => {
          const amount = web3.toWei(1, 'ether');
          return expectedExceptionPromise(
              () => org.deposit({ from: owner1, value: amount,  gas: 3000000 }),
              3000000);
      });

      it("should not be possible to deposit w/ no funds", async () => {
          return expectedExceptionPromise(
              () => org.deposit({ from: owner1,  gas: 3000000 }),
              3000000);
      });

    });

    describe("Reward Operations", () => {

      beforeEach("should deploy organization", async () => {
          org = await Organization.new({ from: owner0 });
      });

      it("should be possible to reward worker", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0.5, 'ether');
          const initialWorkerBalance = await web3.eth.getBalancePromise(worker0);
          await org.deposit({ from: owner0, value: amount });
          await org.addWorker(worker0, { from: owner0 });
          const tx = await org.rewardWorker(worker0, rewardAmount, { from: owner0});
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
          await org.deposit({ from: owner0, value: amount });
          await org.addWorker(worker0, { from: owner0 });
          return expectedExceptionPromise(
              () => org.rewardWorker(0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward non-existant worker", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0.5, 'ether');
          await org.deposit({ from: owner0, value: amount });
          return expectedExceptionPromise(
              () => org.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward 0", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0, 'ether');
          await org.deposit({ from: owner0, value: amount });
          await org.addWorker(worker0, { from: owner0 });
          return expectedExceptionPromise(
              () => org.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward more than current contract balance", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(2, 'ether');
          await org.deposit({ from: owner0, value: amount });
          await org.addWorker(worker0, { from: owner0 });
          return expectedExceptionPromise(
              () => org.rewardWorker(worker0, rewardAmount, { from: owner0, gas: 3000000}),
              3000000);
      });

      it("should not be possible to reward w/ wrong owner", async () => {
          const amount = web3.toWei(1, 'ether');
          const rewardAmount = web3.toWei(0.5, 'ether');
          await org.deposit({ from: owner0, value: amount });
          await org.addWorker(worker0, { from: owner0 });
          return expectedExceptionPromise(
              () => org.rewardWorker(worker0, rewardAmount, { from: owner1, gas: 3000000}),
              3000000);
      });

    });

});

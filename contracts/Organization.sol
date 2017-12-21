pragma solidity ^0.4.17;

contract Organization {
  uint contractBalance ;
  mapping(address => bool) workerMapping;

  event LogWorkerAdded(address _worker);
  event LogWorkerDeleted(address _worker);
  event LogWorkerRewarded(address _worker, uint _reward);
  event LogDeposit(uint amount);

  function Organization()
    public
    payable
    depositNotZero()
  {
    contractBalance += msg.value;
  }

  function addWorker(address _worker)
    public
    validWorkerAddress(_worker)
    isNewWorker(_worker)
    returns (bool success)
  {
    workerMapping[_worker] = true;
    LogWorkerAdded(_worker);
    return success;
  }

  function removeWorker(address _worker)
    public
    validWorkerAddress(_worker)
    isExistingWorker(_worker)
    returns (bool success)
  {
    workerMapping[_worker] = false;
    LogWorkerDeleted(_worker);
    return success;
  }

  function rewardWorker(address _worker, uint rewardAmount)
    public
    validWorkerAddress(_worker)
    isExistingWorker(_worker)
    isValidRewardAmount(rewardAmount)
    sufficientFunds(rewardAmount)
    returns (bool success)
  {
    contractBalance -= rewardAmount;
    LogWorkerRewarded(_worker, rewardAmount);
    _worker.transfer(rewardAmount);
    return true;
  }

  function deposit()
    payable
    public
    depositNotZero()
    returns (bool success)
  {
    contractBalance += msg.value;
    LogDeposit(msg.value);
    return true;
  }

  modifier depositNotZero() {
    require(msg.value > 0);
    _;
  }

  modifier validWorkerAddress(address _worker) {
    require(_worker != 0);
    _;
  }

  modifier isNewWorker(address _worker) {
    require(workerMapping[_worker] == false);
    _;
  }

  modifier isExistingWorker(address _worker) {
    require(workerMapping[_worker] == true);
    _;
  }

  modifier isValidRewardAmount(uint _reward) {
    require(_reward != 0);
    _;
  }

  modifier sufficientFunds(uint _reward) {
    require(contractBalance > _reward);
    _;
  }
}

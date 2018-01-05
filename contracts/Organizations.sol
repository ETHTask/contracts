pragma solidity ^0.4.17;


contract Organizations {
    uint public contractBalance;
    mapping(address => mapping(address => bool)) private orgWorkerMapping;
    mapping(address => bool) private orgExistanceMapping;
    mapping(address => uint) private orgBalanceMapping;

    event LogOrganizationAdded(address _org);
    event LogWorkerAdded(address _worker);
    event LogWorkerRemoved(address _worker);
    event LogWorkerRewarded(address _worker, uint _reward);
    event LogDeposit(uint amount);

    function addOrganization()
    public
    isNewOrganization()
    returns (bool success)
    {
        orgExistanceMapping[msg.sender] = true;
        LogOrganizationAdded(msg.sender);
        return success;
    }

    function addWorker(address _worker)
    public
    validWorkerAddress(_worker)
    isNewWorker(_worker)
    isExistingOrganization()
    returns (bool success)
    {
        orgWorkerMapping[msg.sender][_worker] = true;
        LogWorkerAdded(_worker);
        return success;
    }

    function removeWorker(address _worker)
    public
    validWorkerAddress(_worker)
    isExistingWorker(_worker)
    isExistingOrganization()
    returns (bool success)
    {
        orgWorkerMapping[msg.sender][_worker] = false;
        LogWorkerRemoved(_worker);
        return success;
    }

    function rewardWorker(address _worker, uint rewardAmount)
    public
    validWorkerAddress(_worker)
    isExistingWorker(_worker)
    isValidRewardAmount(rewardAmount)
    isExistingOrganization()
    sufficientContractFunds(rewardAmount)
    sufficientOrgFunds(rewardAmount)
    returns (bool success)
    {
        contractBalance -= rewardAmount;
        orgBalanceMapping[msg.sender] -= rewardAmount;
        LogWorkerRewarded(_worker, rewardAmount);
        _worker.transfer(rewardAmount);
        return true;
    }

    function deposit()
    public
    payable
    depositNotZero()
    isExistingOrganization()
    returns (bool success)
    {
        contractBalance += msg.value;
        orgBalanceMapping[msg.sender] += msg.value;
        LogDeposit(msg.value);
        return true;
    }

    function getWorkerExistance(address worker)
    public
    constant
    isExistingOrganization()
    isExistingWorker(worker)
    returns (bool)
    {
        return orgWorkerMapping[msg.sender][worker];
    }

    function getOrganizationBalance()
    public
    constant
    isExistingOrganization()
    returns (uint)
    {
        return orgBalanceMapping[msg.sender];
    }

    modifier depositNotZero() {
        require(msg.value > 0);
        _;
    }

    modifier isNewOrganization() {
        require(orgExistanceMapping[msg.sender] == false);
        _;
    }

    modifier isExistingOrganization() {
        require(orgExistanceMapping[msg.sender] == true);
        _;
    }

    modifier validWorkerAddress(address _worker) {
        require(_worker != 0);
        _;
    }

    modifier isNewWorker(address _worker) {
        require(orgWorkerMapping[msg.sender][_worker] == false);
        _;
    }

    modifier isExistingWorker(address _worker) {
        require(orgWorkerMapping[msg.sender][_worker] == true);
        _;
    }

    modifier isValidRewardAmount(uint _reward) {
        require(_reward != 0);
        _;
    }

    modifier sufficientContractFunds(uint _reward) {
        require(contractBalance > _reward);
        _;
    }

    modifier sufficientOrgFunds(uint _reward) {
        require(orgBalanceMapping[msg.sender] > _reward);
        _;
    }
}

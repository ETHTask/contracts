pragma solidity ^0.4.17;


contract Organizations {
    uint public contractBalance;
    mapping(address => bool) private orgExistanceMapping;
    mapping(address => uint) private orgBalanceMapping;

    event LogOrganizationAdded(address _org);
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

    function rewardWorker(address _worker, uint rewardAmount)
    public
    validWorkerAddress(_worker)
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

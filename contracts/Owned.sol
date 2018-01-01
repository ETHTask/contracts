pragma solidity ^0.4.17;


contract Owned {
    address public owner;

    event LogOwnerSet(address oldOwner, address newOwner);

    function Owned() public {
        owner = msg.sender;
    }

    function setOwner(address newOwner)
    public
    fromOwner
    isNonZeroAddress(newOwner)
    returns(bool success)
    {
        require(newOwner != owner);
        LogOwnerSet(owner, newOwner);
        owner = newOwner;
        return true;
    }

    function getOwner()
    public
    constant
    returns(address _owner)
    {
        return owner;
    }

    modifier fromOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier isNonZeroAddress(address newOwner) {
        require(newOwner != 0);
        _;
    }
}

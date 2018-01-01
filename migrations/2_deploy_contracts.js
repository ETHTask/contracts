var Organization = artifacts.require("./Organization.sol");
var Owned = artifacts.require("./Owned.sol");

module.exports = function(deployer) {
  deployer.deploy(Organization);
  deployer.deploy(Owned);
};

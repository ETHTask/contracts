var Migrations = artifacts.require("./Migrations.sol");
var Organization = artifacts.require("./Organization.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Organization);
};

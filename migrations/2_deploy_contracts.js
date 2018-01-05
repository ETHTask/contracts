var Organizations = artifacts.require("./Organizations.sol");

module.exports = function(deployer) {
  deployer.deploy(Organizations);
};

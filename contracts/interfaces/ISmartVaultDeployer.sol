// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISmartVaultDeployer {
    function deploy(address _manager, address _owner, address _euros) external returns (address);
}
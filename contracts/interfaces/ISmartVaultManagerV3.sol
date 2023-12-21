// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "contracts/interfaces/ISmartVaultManager.sol";
import "contracts/interfaces/ISmartVaultManagerV2.sol";

interface ISmartVaultManagerV3 is ISmartVaultManagerV2, ISmartVaultManager {
    function swapRouter2() external view returns (address);
}
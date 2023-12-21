// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISmartVaultManagerV2 {
    function weth() external view returns (address);
    function swapRouter() external view returns (address);
    function swapFeeRate() external view returns (uint256);
}
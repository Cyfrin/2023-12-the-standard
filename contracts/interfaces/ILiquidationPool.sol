// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface ILiquidationPool {
    function distributeFees(uint256 _amount) external;
}
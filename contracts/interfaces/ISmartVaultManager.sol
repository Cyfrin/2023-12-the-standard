// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISmartVaultManager {
    function HUNDRED_PC() external view returns (uint256);
    function tokenManager() external view returns (address);
    function protocol() external view returns (address);
    function burnFeeRate() external view returns (uint256);
    function mintFeeRate() external view returns (uint256);
    function collateralRate() external view returns (uint256);
    function liquidateVault(uint256 _tokenId) external;
    function totalSupply() external view returns (uint256);
}
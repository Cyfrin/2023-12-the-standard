// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "contracts/interfaces/ITokenManager.sol";

interface ISmartVault {
    struct Asset { ITokenManager.Token token; uint256 amount; uint256 collateralValue; }
    struct Status { 
        address vaultAddress; uint256 minted; uint256 maxMintable; uint256 totalCollateralValue;
        Asset[] collateral; bool liquidated; uint8 version; bytes32 vaultType;
    }

    function status() external view returns (Status memory);
    function undercollateralised() external view returns (bool);
    function setOwner(address _newOwner) external;
    function liquidate() external;
}
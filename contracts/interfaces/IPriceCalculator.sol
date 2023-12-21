// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "contracts/interfaces/ITokenManager.sol";

interface IPriceCalculator {
    function tokenToEurAvg(ITokenManager.Token memory _token, uint256 _amount) external view returns (uint256);
    function tokenToEur(ITokenManager.Token memory _token, uint256 _amount) external view returns (uint256);
    function eurToToken(ITokenManager.Token memory _token, uint256 _amount) external view returns (uint256);
}
// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

interface ITokenManager {
    struct Token { bytes32 symbol; address addr; uint8 dec; address clAddr; uint8 clDec; }

    function getAcceptedTokens() external view returns (Token[] memory);

    function getToken(bytes32 _symbol) external view returns (Token memory);

    function getTokenIfExists(address _tokenAddr) external view returns (Token memory);
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "contracts/interfaces/ISmartVaultManager.sol";
import "contracts/interfaces/ITokenManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockSmartVaultManager is ISmartVaultManager {
    uint256 public constant HUNDRED_PC = 1e5;
    uint256 public immutable collateralRate;
    address public immutable tokenManager;
    address public protocol;
    uint256 public burnFeeRate;
    uint256 public mintFeeRate;

    constructor(uint256 _collateralRate, address _tokenManager) {
        collateralRate = _collateralRate;
        tokenManager = _tokenManager;
    }

    receive() external payable {}

    function liquidateVault(uint256 _tokenId) external {
        bool liquidated;
        ITokenManager.Token[] memory tokens = ITokenManager(tokenManager).getAcceptedTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            ITokenManager.Token memory token = tokens[i];
            if (token.addr == address(0) && address(this).balance > 0) {
                (bool _sent,) = payable(msg.sender).call{value: address(this).balance}("");
                require(_sent);
                liquidated = true;
            } else if (token.addr != address(0)) {
                IERC20 ierc20 = IERC20(token.addr);
                if (ierc20.balanceOf(address(this)) > 0) {
                    ierc20.transfer(msg.sender, ierc20.balanceOf(address(this)));
                    liquidated = true;
                } 
            }
        }
        require(liquidated, "vault-not-undercollateralised");
    }

    function totalSupply() external view returns (uint256) {}
}
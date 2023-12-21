// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/interfaces/IWETH.sol";

contract WETHMock is IWETH, ERC20 {

    constructor() ERC20("Wrapped Ether", "WETH") {
    }

    function withdraw(uint256) external {
    }
}
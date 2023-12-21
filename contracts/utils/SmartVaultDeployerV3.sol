// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "contracts/SmartVaultV3.sol";
import "contracts/utils/PriceCalculator.sol";
import "contracts/interfaces/ISmartVaultDeployer.sol";

contract SmartVaultDeployerV3 is ISmartVaultDeployer {    
    bytes32 private immutable NATIVE;
    address private immutable priceCalculator;

    constructor(bytes32 _native, address _clEurUsd) {
        NATIVE = _native;
        priceCalculator = address(new PriceCalculator(_native, _clEurUsd));
    }
    
    function deploy(address _manager, address _owner, address _euros) external returns (address) {
        return address(new SmartVaultV3(NATIVE, _manager, _owner, _euros, priceCalculator));
    }
}

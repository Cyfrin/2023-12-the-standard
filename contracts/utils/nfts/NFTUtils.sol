// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/interfaces/ISmartVault.sol";
import "contracts/interfaces/INFTMetadataGenerator.sol";
import "contracts/utils/nfts/SVGGenerator.sol";

library NFTUtils {
    using Strings for uint256;
    using Strings for uint16;

    function toShortString(bytes32 _data) pure external returns (string memory) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint8 i = 0; i < 32; i++) {
            bytes1 char = _data[i];
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint8 j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    function padFraction(bytes memory _input, uint8 _dec) private pure returns (bytes memory fractionalPartPadded) {
        fractionalPartPadded = new bytes(_dec);
        uint256 i = fractionalPartPadded.length;
        uint256 j = _input.length;
        bool smallestCharacterAppended;
        while(i > 0) {
            i--;
            if (j > 0) {
                j--;
                if (_input[j] != bytes1("0") || smallestCharacterAppended) {
                    fractionalPartPadded[i] = _input[j];
                    smallestCharacterAppended = true;
                } else {
                    fractionalPartPadded = new bytes(fractionalPartPadded.length - 1);
                }
            } else {
                fractionalPartPadded[i] = "0";
            }
        }
    }

    function truncateFraction(bytes memory _input, uint8 _places) private pure returns (bytes memory truncated) {
        truncated = new bytes(_places);
        for (uint256 i = 0; i < _places; i++) {
            truncated[i] = _input[i];
        }
    }

    function toDecimalString(uint256 _amount, uint8 _inputDec) external pure returns (string memory) {
        uint8 maxDecPlaces = 5;
        string memory wholePart = (_amount / 10 ** _inputDec).toString();
        uint256 fraction = _amount % 10 ** _inputDec;
        if (fraction == 0) return wholePart;
        bytes memory fractionalPart = bytes(fraction.toString());
        bytes memory fractionalPartPadded = padFraction(fractionalPart, _inputDec);
        if (fractionalPartPadded.length > maxDecPlaces) fractionalPartPadded = truncateFraction(fractionalPartPadded, maxDecPlaces);
        return string(abi.encodePacked(wholePart, ".", fractionalPartPadded));
    }
}

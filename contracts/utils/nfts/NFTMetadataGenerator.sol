// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/interfaces/ISmartVault.sol";
import "contracts/interfaces/INFTMetadataGenerator.sol";
import "contracts/utils/nfts/SVGGenerator.sol";
import "contracts/utils/nfts/NFTUtils.sol";

contract NFTMetadataGenerator is INFTMetadataGenerator {
    using Strings for uint256;
    using Strings for uint16;

    SVGGenerator private immutable svgGenerator;

    constructor() {
        svgGenerator = new SVGGenerator();
    }

    function mapCollateralForJSON(ISmartVault.Asset[] memory _collateral) private pure returns (string memory collateralTraits) {
        collateralTraits = "";
        for (uint256 i = 0; i < _collateral.length; i++) {
            ISmartVault.Asset memory asset = _collateral[i];
            collateralTraits = string(abi.encodePacked(collateralTraits, '{"trait_type":"', NFTUtils.toShortString(asset.token.symbol), '", ','"display_type": "number",','"value": ',NFTUtils.toDecimalString(asset.amount, asset.token.dec),'},'));
        }
    }

    function generateNFTMetadata(uint256 _tokenId, ISmartVault.Status memory _vaultStatus) external view returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(abi.encodePacked(
                    "{",
                        '"name": "The Standard Smart Vault #',_tokenId.toString(),'",',
                        '"description": "The Standard Smart Vault (',NFTUtils.toShortString(_vaultStatus.vaultType),')",',
                        '"attributes": [',
                            '{"trait_type": "Status", "value": "',_vaultStatus.liquidated ?"liquidated":"active",'"},',
                            '{"trait_type": "Debt",  "display_type": "number", "value": ', NFTUtils.toDecimalString(_vaultStatus.minted, 18),'},',
                            '{"trait_type": "Max Borrowable Amount", "display_type": "number", "value": "',NFTUtils.toDecimalString(_vaultStatus.maxMintable, 18),'"},',
                            '{"trait_type": "Collateral Value in EUROs", "display_type": "number", "value": ',NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue, 18),'},',
                            '{"trait_type": "Value minus debt", "display_type": "number", "value": ',NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue - _vaultStatus.minted, 18),'},',
                            mapCollateralForJSON(_vaultStatus.collateral),
                            '{"trait_type": "Version", "value": "',uint256(_vaultStatus.version).toString(),'"},',
                            '{"trait_type": "Vault Type", "value": "',NFTUtils.toShortString(_vaultStatus.vaultType),'"}',
                        '],',
                        '"image_data": "',svgGenerator.generateSvg(_tokenId, _vaultStatus),'"',
                    "}"
                ))
            )
        );
    }
}

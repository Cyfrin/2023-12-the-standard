// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/interfaces/ISmartVault.sol";
import "contracts/utils/nfts/DefGenerator.sol";
import "contracts/utils/nfts/NFTUtils.sol";

contract SVGGenerator {
    using Strings for uint256;
    using Strings for uint16;

    uint16 private constant TABLE_ROW_HEIGHT = 67;
    uint16 private constant TABLE_ROW_WIDTH = 1235;
    uint16 private constant TABLE_INITIAL_Y = 460;
    uint16 private constant TABLE_INITIAL_X = 357;
    uint32 private constant HUNDRED_PC = 1e5;

    DefGenerator private immutable defGenerator;

    constructor() {
        defGenerator = new DefGenerator();
    }

    struct CollateralForSVG { string text; uint256 size; }

    function mapCollateralForSVG(ISmartVault.Asset[] memory _collateral) private pure returns (CollateralForSVG memory) {
        string memory displayText = "";
        uint256 paddingTop = 50;
        uint256 paddingLeftSymbol = 22;
        uint256 paddingLeftAmount = paddingLeftSymbol + 250;
        uint256 collateralSize = 0;
        for (uint256 i = 0; i < _collateral.length; i++) {
            ISmartVault.Asset memory asset = _collateral[i];
            uint256 xShift = collateralSize % 2 == 0 ? 0 : TABLE_ROW_WIDTH >> 1;
            if (asset.amount > 0) {
                uint256 currentRow = collateralSize >> 1;
                uint256 textYPosition = TABLE_INITIAL_Y + currentRow * TABLE_ROW_HEIGHT + paddingTop;
                displayText = string(abi.encodePacked(displayText,
                    "<g>",
                        "<text class='cls-8' transform='translate(",(TABLE_INITIAL_X + xShift + paddingLeftSymbol).toString()," ",textYPosition.toString(),")'>",
                            "<tspan x='0' y='0'>",NFTUtils.toShortString(asset.token.symbol),"</tspan>",
                        "</text>",
                        "<text class='cls-8' transform='translate(",(TABLE_INITIAL_X + xShift + paddingLeftAmount).toString()," ",textYPosition.toString(),")'>",
                            "<tspan x='0' y='0'>",NFTUtils.toDecimalString(asset.amount, asset.token.dec),"</tspan>",
                        "</text>",
                    "</g>"
                ));
                collateralSize++;
            }
        }
        if (collateralSize == 0) {
            displayText = string(abi.encodePacked(
                "<g>",
                    "<text class='cls-8' transform='translate(",(TABLE_INITIAL_X + paddingLeftSymbol).toString()," ",(TABLE_INITIAL_Y + paddingTop).toString(),")'>",
                        "<tspan x='0' y='0'>N/A</tspan>",
                    "</text>",
                "</g>"
            ));
            collateralSize = 1;
        }
        return CollateralForSVG(displayText, collateralSize);
    }

    function mapRows(uint256 _collateralSize) private pure returns (string memory mappedRows) {
        mappedRows = "";
        uint256 rowCount = (_collateralSize + 1) >> 1;
        for (uint256 i = 0; i < (rowCount + 1) >> 1; i++) {
            mappedRows = string(abi.encodePacked(
                mappedRows, "<rect class='cls-9' x='",TABLE_INITIAL_X.toString(),"' y='",(TABLE_INITIAL_Y+i*TABLE_ROW_HEIGHT).toString(),"' width='",TABLE_ROW_WIDTH.toString(),"' height='",TABLE_ROW_HEIGHT.toString(),"'/>"
            ));
        }
        uint256 rowMidpoint = TABLE_INITIAL_X + TABLE_ROW_WIDTH >> 1;
        uint256 tableEndY = TABLE_INITIAL_Y + rowCount * TABLE_ROW_HEIGHT;
        mappedRows = string(abi.encodePacked(mappedRows,
        "<line class='cls-11' x1='",rowMidpoint.toString(),"' y1='",TABLE_INITIAL_Y.toString(),"' x2='",rowMidpoint.toString(),"' y2='",tableEndY.toString(),"'/>"));
    }

    function collateralDebtPecentage(ISmartVault.Status memory _vaultStatus) private pure returns (string memory) {
        return _vaultStatus.minted == 0 ? "N/A" : string(abi.encodePacked(NFTUtils.toDecimalString(HUNDRED_PC * _vaultStatus.totalCollateralValue / _vaultStatus.minted, 3),"%"));
    }

    function generateSvg(uint256 _tokenId, ISmartVault.Status memory _vaultStatus) external view returns (string memory) {
        CollateralForSVG memory collateral = mapCollateralForSVG(_vaultStatus.collateral);
        return
            string(
                    abi.encodePacked(
                        "<?xml version='1.0' encoding='UTF-8'?>",
                        "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 2880 1620'>",
                            defGenerator.generateDefs(_tokenId),
                            "<g>",
                                "<rect class='token-",_tokenId.toString(),"-cls-12' width='2880' height='1620'/>",
                                "<rect width='2600' height='1540' class='transparent-background-container' transform='translate(140, 40)' rx='80'/>",
                            "</g>",
                            "<g>",
                                "<g>",
                                    "<text class='cls-4' transform='translate(239.87 164.27)'><tspan x='0' y='0'>The owner of this NFT owns the collateral and debt</tspan></text>",
                                    "<text class='cls-2' transform='translate(244.87 254.3)'><tspan x='0' y='0'>NOTE: NFT marketplace caching might show older NFT data, it is up to the buyer to check the blockchain </tspan></text>",
                                "</g>",
                                "<text class='cls-6' transform='translate(357.54 426.33)'><tspan x='0' y='0'>Collateral locked in this vault</tspan></text>",
                                "<text class='cls-5' transform='translate(1715.63 426.33)'><tspan x='0' y='0'>EUROs SmartVault #",_tokenId.toString(),"</tspan></text>",
                                mapRows(collateral.size),
                                collateral.text,
                                "<g>",
                                    "<text class='cls-5' transform='translate(1713.34 719.41)'><tspan x='0' y='0'>Total Value</tspan></text>",
                                    "<text class='cls-7' transform='translate(2191.03 719.41)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue, 18)," EUROs</tspan></text>",
                                "</g>",
                                "<g>",
                                    "<text class='cls-5' transform='translate(1713.34 822.75)'><tspan x='0' y='0'>Debt</tspan></text>",
                                    "<text class='cls-7' transform='translate(2191.03 822.75)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.minted, 18)," EUROs</tspan></text>",
                                "</g>",
                                "<g>",
                                    "<text class='cls-5' transform='translate(1713.34 924.1)'><tspan x='0' y='0'>Collateral/Debt</tspan></text>",
                                    "<text class='cls-7' transform='translate(2191.03 924.1)'><tspan x='0' y='0'>",collateralDebtPecentage(_vaultStatus),"</tspan></text>",
                                "</g>",
                                "<g>",
                                    "<text class='cls-5' transform='translate(1714.21 1136.92)'><tspan x='0' y='0'>Total value minus debt:</tspan></text>",
                                    "<text class='cls-5' transform='translate(1715.63 1220.22)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue - _vaultStatus.minted, 18)," EUROs</tspan></text>",
                                "</g>",
                            "</g>",
                            "<g>",
                                "<g>",
                                    "<path class='cls-3' d='M293.17,1446c2.92,0,5.59,.31,8.01,.92,2.42,.61,4.77,1.48,7.05,2.58l-4.2,9.9c-1.99-.88-3.82-1.56-5.52-2.06-1.69-.5-3.47-.74-5.34-.74-3.45,0-6.31,1.01-8.58,3.02-2.28,2.01-3.74,4.92-4.38,8.71h17.25v7.53h-17.87c0,.23-.02,.54-.04,.92-.03,.38-.04,.83-.04,1.36v1.31c0,.41,.03,.85,.09,1.31h15.15v7.62h-14.45c1.4,6.95,5.98,10.42,13.75,10.42,2.22,0,4.31-.22,6.26-.66,1.96-.44,3.78-1.04,5.47-1.8v10.95c-1.64,.82-3.46,1.45-5.47,1.88-2.01,.44-4.37,.66-7.05,.66-6.83,0-12.52-1.85-17.08-5.56-4.55-3.71-7.44-9.01-8.67-15.9h-5.87v-7.62h5.08c-.12-.82-.18-1.69-.18-2.63v-1.31c0-.41,.03-.73,.09-.96h-4.99v-7.53h5.69c.76-4.67,2.31-8.67,4.64-12,2.33-3.33,5.31-5.88,8.93-7.66,3.62-1.78,7.71-2.67,12.26-2.67Z'/>",
                                    "<path class='cls-3' d='M255.82,1479.57h-16.33v-23.22c0-17.76,14.45-32.21,32.21-32.21h61.25v16.33h-61.25c-8.75,0-15.88,7.12-15.88,15.88v23.22Z'/>",
                                    "<path class='cls-3' d='M300.59,1531.88h-60.71v-16.33h60.71c8.61,0,15.88-5.22,15.88-11.4v-24.17h16.33v24.17c0,15.29-14.45,27.73-32.21,27.73Z'/>",
                                "</g>",
                                "<g>",
                                    "<text class='cls-10' transform='translate(357.2 1494.48)'><tspan x='0' y='0'>EUROs SmartVault</tspan></text>",
                                "</g>",
                            "</g>",
                            "<g>",
                                "<g>",
                                    "<g>",
                                        "<text class='cls-1' transform='translate(2173.2 1496.1)'><tspan x='0' y='0'>TheStandard.io</tspan></text>",
                                    "</g>",
                                    "<rect class='cls-3' x='2097.6' y='1453.66' width='16.43' height='49.6'/>",
                                    "<path class='cls-3' d='M2074.82,1479.74h-16.38v-23.29c0-17.81,14.49-32.31,32.31-32.31h61.43v16.38h-61.43c-8.78,0-15.93,7.14-15.93,15.93v23.29Z'/>",
                                    "<path class='cls-3' d='M2119.72,1532.21h-60.9v-16.38h60.9c8.63,0,15.93-5.24,15.93-11.44v-24.24h16.38v24.24c0,15.34-14.49,27.82-32.31,27.82Z'/>",
                                "</g>",
                            "</g>",
                        "</svg>"
                    )
            );
    }

}
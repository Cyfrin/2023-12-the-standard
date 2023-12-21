// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/utils/nfts/NFTUtils.sol";

contract DefGenerator {
    using Strings for uint256;
    using Strings for uint16;

    struct Gradient { bytes32 colour1; bytes32 colour2; bytes32 colour3; }

    function getGradient(uint256 _tokenId) private pure returns (Gradient memory) {
        bytes32[25] memory colours = [
            bytes32("#FF69B4"), bytes32("#9B00FF"), bytes32("#00FFFF"), bytes32("#0000FF"), bytes32("#333333"), bytes32("#FFD700"), bytes32("#00FFFF"),
            bytes32("#9B00FF"), bytes32("#C0C0C0"), bytes32("#0000A0"), bytes32("#CCFF00"), bytes32("#FFFF33"), bytes32("#FF0000"), bytes32("#800080"),
            bytes32("#4B0082"), bytes32("#6F00FF"), bytes32("#FF1493"), bytes32("#FFAA1D"), bytes32("#FF7E00"), bytes32("#00FF00"), bytes32("#FF6EC7"),
            bytes32("#8B00FF"), bytes32("#FFA07A"), bytes32("#FE4164"), bytes32("#008080")
        ];
        return Gradient(
            colours[_tokenId % colours.length],
            colours[(_tokenId % colours.length + _tokenId / colours.length + 1) % colours.length],
            colours[(_tokenId % colours.length + _tokenId / colours.length + _tokenId / colours.length ** 2 + 2) % colours.length]
        );
    }

    function generateDefs(uint256 _tokenId) external pure returns (string memory) {
        Gradient memory gradient = getGradient(_tokenId);
        return
            string(
                    abi.encodePacked(
                        "<defs>",
                            "<style>",
                                ".cls-1 {",
                                    "font-family: Arial;",
                                    "font-weight: bold;",
                                    "font-size: 60.88px;",
                                "}",
                                ".cls-1, .cls-2, .cls-3, .cls-4, .cls-5, .cls-6, .cls-7, .cls-8, .cls-9, .cls-10 {",
                                    "fill: #fff;",
                                    "text-shadow: 1px 1px #00000080;",
                                "}",
                                ".cls-11 {",
                                    "fill: none;",
                                    "stroke: #fff;",
                                    "stroke-miterlimit: 10;",
                                    "stroke-width: 3px;",
                                "}",
                                ".cls-2 {",
                                    "font-size: 46.5px;",
                                "}",
                                ".cls-2, .cls-4, .cls-7, .cls-8, .cls-10 {",
                                    "font-family: Arial;",
                                "}",
                                ".cls-4 {",
                                    "font-size: 95.97px;",
                                "}",
                                ".token-",_tokenId.toString(),"-cls-12 {",
                                    "fill: url(#linear-gradient-",_tokenId.toString(),");",
                                "}",
                                ".cls-5 {",
                                    "font-family: Arial;",
                                    "font-weight: bold;",
                                "}",
                                ".cls-5, .cls-7 {",
                                    "font-size: 50.39px;",
                                "}",
                                ".cls-6 {",
                                    "font-family: Arial;",
                                    "font-size: 55px;",
                                "}",
                                ".cls-8 {",
                                    "font-size: 42.69px;",
                                "}",
                                ".cls-9 {",
                                    "opacity: .17;",
                                "}",
                                ".cls-10 {",
                                    "font-size: 63.77px;",
                                "}",
                                ".transparent-background-container {",
                                    "fill: rgba(0, 0, 0, 0.3);",
                                "}",
                            "</style>",
                            "<linearGradient id='linear-gradient-",_tokenId.toString(),"' x1='315' y1='1935' x2='2565' y2='-315' gradientTransform='matrix(1, 0, 0, 1, 0, 0)' gradientUnits='userSpaceOnUse'>",
                                "<stop offset='.38' stop-color='",NFTUtils.toShortString(gradient.colour1),"'/>",
                                "<stop offset='.77' stop-color='",NFTUtils.toShortString(gradient.colour2),"'/>",
                                "<stop offset='1' stop-color='",NFTUtils.toShortString(gradient.colour3),"'/>",
                            "</linearGradient>",
                        "</defs>"
                    )
            );
    }

}
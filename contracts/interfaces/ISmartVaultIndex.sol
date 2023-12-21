// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISmartVaultIndex {
    function getTokenIds(address _user) external view returns (uint256[] memory);
    function getVaultAddress(uint256 _tokenId) external view returns (address payable);
    function addVaultAddress(uint256 _tokenId, address payable _vault) external;
    function transferTokenId(address _from, address _to, uint256 _tokenId) external;
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/ISmartVaultIndex.sol";

contract SmartVaultIndex is ISmartVaultIndex, Ownable {
    address public manager;
    mapping(address => uint256[]) private tokenIds;
    mapping(uint256 => address payable) private vaultAddresses;

    modifier onlyManager {
        require(msg.sender == manager, "err-unauthorised");
        _;
    }

    function getTokenIds(address _user) external view returns (uint256[] memory) {
        return tokenIds[_user];
    }

    function getVaultAddress(uint256 _tokenId) external view returns (address payable) {
        return vaultAddresses[_tokenId];
    }

    function addVaultAddress(uint256 _tokenId, address payable _vault) external onlyManager {
        vaultAddresses[_tokenId] = _vault;
    }

    function removeTokenId(address _user, uint256 _tokenId) private {
        uint256[] memory currentIds = tokenIds[_user];
        uint256 idsLength = currentIds.length;
        delete tokenIds[_user];
        for (uint256 i = 0; i < idsLength; i++) {
            if (currentIds[i] != _tokenId) tokenIds[_user].push(currentIds[i]);
        }
    }

    function transferTokenId(address _from, address _to, uint256 _tokenId) external onlyManager {
        removeTokenId(_from, _tokenId);
        tokenIds[_to].push(_tokenId);
    }

    function setVaultManager(address _manager) external onlyOwner {
        manager = _manager;
    }
}

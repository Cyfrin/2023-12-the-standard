// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol" as Chainlink;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/interfaces/IEUROs.sol";
import "contracts/interfaces/ILiquidationPool.sol";
import "contracts/interfaces/ILiquidationPoolManager.sol";
import "contracts/interfaces/ISmartVaultManager.sol";
import "contracts/interfaces/ITokenManager.sol";

contract LiquidationPool is ILiquidationPool {
    using SafeERC20 for IERC20;

    address private immutable TST;
    address private immutable EUROs;
    address private immutable eurUsd;

    address[] public holders;
    mapping(address => Position) private positions;
    mapping(bytes => uint256) private rewards;
    PendingStake[] private pendingStakes;
    address payable public manager;
    address public tokenManager;

    struct Position {  address holder; uint256 TST; uint256 EUROs; }
    struct Reward { bytes32 symbol; uint256 amount; uint8 dec; }
    struct PendingStake { address holder; uint256 createdAt; uint256 TST; uint256 EUROs; }

    constructor(address _TST, address _EUROs, address _eurUsd, address _tokenManager) {
        TST = _TST;
        EUROs = _EUROs;
        eurUsd = _eurUsd;
        tokenManager = _tokenManager;
        manager = payable(msg.sender);
    }

    modifier onlyManager {
        require(msg.sender == manager, "err-invalid-user");
        _;
    }

    function stake(Position memory _position) private pure returns (uint256) {
        return _position.TST > _position.EUROs ? _position.EUROs : _position.TST;
    }

    function getStakeTotal() private view returns (uint256 _stakes) {
        for (uint256 i = 0; i < holders.length; i++) {
            Position memory _position = positions[holders[i]];
            _stakes += stake(_position);
        }
    }

    function getTstTotal() private view returns (uint256 _tst) {
        for (uint256 i = 0; i < holders.length; i++) {
            _tst += positions[holders[i]].TST;
        }
        for (uint256 i = 0; i < pendingStakes.length; i++) {
            _tst += pendingStakes[i].TST;
        }
    }

    function findRewards(address _holder) private view returns (Reward[] memory) {
        ITokenManager.Token[] memory _tokens = ITokenManager(tokenManager).getAcceptedTokens();
        Reward[] memory _rewards = new Reward[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            _rewards[i] = Reward(_tokens[i].symbol, rewards[abi.encodePacked(_holder, _tokens[i].symbol)], _tokens[i].dec);
        }
        return _rewards;
    }

    function holderPendingStakes(address _holder) private view returns (uint256 _pendingTST, uint256 _pendingEUROs) {
        for (uint256 i = 0; i < pendingStakes.length; i++) {
            PendingStake memory _pendingStake = pendingStakes[i];
            if (_pendingStake.holder == _holder) {
                _pendingTST += _pendingStake.TST;
                _pendingEUROs += _pendingStake.EUROs;
            }
        }
    }
    
    function position(address _holder) external view returns(Position memory _position, Reward[] memory _rewards) {
        _position = positions[_holder];
        (uint256 _pendingTST, uint256 _pendingEUROs) = holderPendingStakes(_holder);
        _position.EUROs += _pendingEUROs;
        _position.TST += _pendingTST;
        if (_position.TST > 0) _position.EUROs += IERC20(EUROs).balanceOf(manager) * _position.TST / getTstTotal();
        _rewards = findRewards(_holder);
    }

    function empty(Position memory _position) private pure returns (bool) {
        return _position.TST == 0 && _position.EUROs == 0;
    }

    function deleteHolder(address _holder) private {
        for (uint256 i = 0; i < holders.length; i++) {
            if (holders[i] == _holder) {
                holders[i] = holders[holders.length - 1];
                holders.pop();
            }
        }
    }

    function deletePendingStake(uint256 _i) private {
        for (uint256 i = _i; i < pendingStakes.length - 1; i++) {
            pendingStakes[i] = pendingStakes[i+1];
        }
        pendingStakes.pop();
    }

    function addUniqueHolder(address _holder) private {
        for (uint256 i = 0; i < holders.length; i++) {
            if (holders[i] == _holder) return;
        }
        holders.push(_holder);
    }

    function consolidatePendingStakes() private {
        uint256 deadline = block.timestamp - 1 days;
        for (int256 i = 0; uint256(i) < pendingStakes.length; i++) {
            PendingStake memory _stake = pendingStakes[uint256(i)];
            if (_stake.createdAt < deadline) {
                positions[_stake.holder].holder = _stake.holder;
                positions[_stake.holder].TST += _stake.TST;
                positions[_stake.holder].EUROs += _stake.EUROs;
                deletePendingStake(uint256(i));
                // pause iterating on loop because there has been a deletion. "next" item has same index
                i--;
            }
        }
    }

    function increasePosition(uint256 _tstVal, uint256 _eurosVal) external {
        require(_tstVal > 0 || _eurosVal > 0);
        consolidatePendingStakes();
        ILiquidationPoolManager(manager).distributeFees();
        if (_tstVal > 0) IERC20(TST).safeTransferFrom(msg.sender, address(this), _tstVal);
        if (_eurosVal > 0) IERC20(EUROs).safeTransferFrom(msg.sender, address(this), _eurosVal);
        pendingStakes.push(PendingStake(msg.sender, block.timestamp, _tstVal, _eurosVal));
        addUniqueHolder(msg.sender);
    }

    function deletePosition(Position memory _position) private {
        deleteHolder(_position.holder);
        delete positions[_position.holder];
    }

    function decreasePosition(uint256 _tstVal, uint256 _eurosVal) external {
        consolidatePendingStakes();
        ILiquidationPoolManager(manager).distributeFees();
        require(_tstVal <= positions[msg.sender].TST && _eurosVal <= positions[msg.sender].EUROs, "invalid-decr-amount");
        if (_tstVal > 0) {
            IERC20(TST).safeTransfer(msg.sender, _tstVal);
            positions[msg.sender].TST -= _tstVal;
        }
        if (_eurosVal > 0) {
            IERC20(EUROs).safeTransfer(msg.sender, _eurosVal);
            positions[msg.sender].EUROs -= _eurosVal;
        }
        if (empty(positions[msg.sender])) deletePosition(positions[msg.sender]);
    }

    function claimRewards() external {
        ITokenManager.Token[] memory _tokens = ITokenManager(tokenManager).getAcceptedTokens();
        for (uint256 i = 0; i < _tokens.length; i++) {
            ITokenManager.Token memory _token = _tokens[i];
            uint256 _rewardAmount = rewards[abi.encodePacked(msg.sender, _token.symbol)];
            if (_rewardAmount > 0) {
                delete rewards[abi.encodePacked(msg.sender, _token.symbol)];
                if (_token.addr == address(0)) {
                    (bool _sent,) = payable(msg.sender).call{value: _rewardAmount}("");
                    require(_sent);
                } else {
                    IERC20(_token.addr).transfer(msg.sender, _rewardAmount);
                }   
            }

        }
    }

    function distributeFees(uint256 _amount) external onlyManager {
        uint256 tstTotal = getTstTotal();
        if (tstTotal > 0) {
            IERC20(EUROs).safeTransferFrom(msg.sender, address(this), _amount);
            for (uint256 i = 0; i < holders.length; i++) {
                address _holder = holders[i];
                positions[_holder].EUROs += _amount * positions[_holder].TST / tstTotal;
            }
            for (uint256 i = 0; i < pendingStakes.length; i++) {
                pendingStakes[i].EUROs += _amount * pendingStakes[i].TST / tstTotal;
            }
        }
    }

    function returnUnpurchasedNative(ILiquidationPoolManager.Asset[] memory _assets, uint256 _nativePurchased) private {
        for (uint256 i = 0; i < _assets.length; i++) {
            if (_assets[i].token.addr == address(0) && _assets[i].token.symbol != bytes32(0)) {
                (bool _sent,) = manager.call{value: _assets[i].amount - _nativePurchased}("");
                require(_sent);
            }
        }
    }

    function distributeAssets(ILiquidationPoolManager.Asset[] memory _assets, uint256 _collateralRate, uint256 _hundredPC) external payable {
        consolidatePendingStakes();
        (,int256 priceEurUsd,,,) = Chainlink.AggregatorV3Interface(eurUsd).latestRoundData();
        uint256 stakeTotal = getStakeTotal();
        uint256 burnEuros;
        uint256 nativePurchased;
        for (uint256 j = 0; j < holders.length; j++) {
            Position memory _position = positions[holders[j]];
            uint256 _positionStake = stake(_position);
            if (_positionStake > 0) {
                for (uint256 i = 0; i < _assets.length; i++) {
                    ILiquidationPoolManager.Asset memory asset = _assets[i];
                    if (asset.amount > 0) {
                        (,int256 assetPriceUsd,,,) = Chainlink.AggregatorV3Interface(asset.token.clAddr).latestRoundData();
                        uint256 _portion = asset.amount * _positionStake / stakeTotal;
                        uint256 costInEuros = _portion * 10 ** (18 - asset.token.dec) * uint256(assetPriceUsd) / uint256(priceEurUsd)
                            * _hundredPC / _collateralRate;
                        if (costInEuros > _position.EUROs) {
                            _portion = _portion * _position.EUROs / costInEuros;
                            costInEuros = _position.EUROs;
                        }
                        _position.EUROs -= costInEuros;
                        rewards[abi.encodePacked(_position.holder, asset.token.symbol)] += _portion;
                        burnEuros += costInEuros;
                        if (asset.token.addr == address(0)) {
                            nativePurchased += _portion;
                        } else {
                            IERC20(asset.token.addr).safeTransferFrom(manager, address(this), _portion);
                        }
                    }
                }
            }
            positions[holders[j]] = _position;
        }
        if (burnEuros > 0) IEUROs(EUROs).burn(address(this), burnEuros);
        returnUnpurchasedNative(_assets, nativePurchased);
    }
}

# Aderyn Analysis Report

This report was generated by [Aderyn](https://github.com/Cyfrin/aderyn), a static analysis tool built by [Cyfrin](https://cyfrin.io), a blockchain security company. This report is not a substitute for manual audit or security review. It should not be relied upon for any purpose other than to assist in the identification of potential security vulnerabilities.
# Table of Contents

- [Summary](#summary)
  - [Files Summary](#files-summary)
  - [Files Details](#files-details)
  - [Issue Summary](#issue-summary)
- [High Issues](#high-issues)
  - [H-1: Arbitrary `from` passed to `transferFrom` (or `safeTransferFrom`)](#h-1-arbitrary-from-passed-to-transferfrom-or-safetransferfrom)
- [Medium Issues](#medium-issues)
  - [M-1: Centralization Risk for trusted owners](#m-1-centralization-risk-for-trusted-owners)
  - [M-2: Using `ERC721::_mint()` can be dangerous](#m-2-using-erc721mint-can-be-dangerous)
- [Low Issues](#low-issues)
  - [L-1: `abi.encodePacked()` should not be used with dynamic types when passing the result to a hash function such as `keccak256()`](#l-1-abiencodepacked-should-not-be-used-with-dynamic-types-when-passing-the-result-to-a-hash-function-such-as-keccak256)
  - [L-2: Deprecated OpenZeppelin functions should not be used](#l-2-deprecated-openzeppelin-functions-should-not-be-used)
  - [L-3: Unsafe ERC20 Operations should not be used](#l-3-unsafe-erc20-operations-should-not-be-used)
  - [L-4: Solidity pragma should be specific, not wide](#l-4-solidity-pragma-should-be-specific-not-wide)
  - [L-5: Conditional storage checks are not consistent](#l-5-conditional-storage-checks-are-not-consistent)
  - [L-6: PUSH0 is not supported by all chains](#l-6-push0-is-not-supported-by-all-chains)
- [NC Issues](#nc-issues)
  - [NC-1: Missing checks for `address(0)` when assigning values to address state variables](#nc-1-missing-checks-for-address0-when-assigning-values-to-address-state-variables)
  - [NC-2: Functions not used internally could be marked external](#nc-2-functions-not-used-internally-could-be-marked-external)
  - [NC-3: Constants should be defined and used instead of literals](#nc-3-constants-should-be-defined-and-used-instead-of-literals)
  - [NC-4: Event is missing `indexed` fields](#nc-4-event-is-missing-indexed-fields)
  - [NC-5: `require()` / `revert()` statements should have descriptive reason strings or custom errors](#nc-5-require--revert-statements-should-have-descriptive-reason-strings-or-custom-errors)


# Summary

## Files Summary

| Key | Value |
| --- | --- |
| .sol Files | 33 |
| Total nSLOC | 1453 |


## Files Details

| Filepath | nSLOC |
| --- | --- |
| contracts/LiquidationPool.sol | 214 |
| contracts/LiquidationPoolManager.sol | 76 |
| contracts/SmartVaultManagerV5.sol | 120 |
| contracts/SmartVaultV3.sol | 199 |
| contracts/interfaces/IEUROs.sol | 9 |
| contracts/interfaces/ILiquidationPool.sol | 4 |
| contracts/interfaces/ILiquidationPoolManager.sol | 7 |
| contracts/interfaces/INFTMetadataGenerator.sol | 5 |
| contracts/interfaces/IPriceCalculator.sol | 7 |
| contracts/interfaces/ISmartVault.sol | 13 |
| contracts/interfaces/ISmartVaultDeployer.sol | 4 |
| contracts/interfaces/ISmartVaultIndex.sol | 7 |
| contracts/interfaces/ISmartVaultManager.sol | 11 |
| contracts/interfaces/ISmartVaultManagerV2.sol | 6 |
| contracts/interfaces/ISmartVaultManagerV3.sol | 6 |
| contracts/interfaces/ISwapRouter.sol | 14 |
| contracts/interfaces/ITokenManager.sol | 7 |
| contracts/interfaces/IWETH.sol | 5 |
| contracts/utils/ChainlinkMock.sol | 36 |
| contracts/utils/ERC20Mock.sol | 14 |
| contracts/utils/EUROsMock.sol | 19 |
| contracts/utils/MockSmartVaultManager.sol | 37 |
| contracts/utils/PriceCalculator.sol | 56 |
| contracts/utils/SmartVaultDeployerV3.sol | 15 |
| contracts/utils/SmartVaultIndex.sol | 36 |
| contracts/utils/SmartVaultManager.sol | 110 |
| contracts/utils/SwapRouterMock.sol | 34 |
| contracts/utils/TokenManagerMock.sol | 44 |
| contracts/utils/WETHMock.sol | 9 |
| contracts/utils/nfts/DefGenerator.sol | 88 |
| contracts/utils/nfts/NFTMetadataGenerator.sol | 46 |
| contracts/utils/nfts/NFTUtils.sol | 61 |
| contracts/utils/nfts/SVGGenerator.sol | 134 |
| **Total** | **1453** |


## Issue Summary

| Category | No. of Issues |
| --- | --- |
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 6 |
| NC | 5 |


# High Issues

## H-1: Arbitrary `from` passed to `transferFrom` (or `safeTransferFrom`)

Passing an arbitrary `from` address to `transferFrom` (or `safeTransferFrom`) can lead to loss of funds, because anyone can transfer tokens from the `from` address if an approval is made.  

- Found in contracts/LiquidationPool.sol [Line: 232](contracts/LiquidationPool.sol#L232)

	```solidity
	                            IERC20(asset.token.addr).safeTransferFrom(manager, address(this), _portion);
	```



# Medium Issues

## M-1: Centralization Risk for trusted owners

Contracts have owners with privileged rights to perform admin tasks and need to be trusted to not perform malicious updates or drain funds.

- Found in contracts/LiquidationPoolManager.sol [Line: 11](contracts/LiquidationPoolManager.sol#L11)

	```solidity
	contract LiquidationPoolManager is Ownable {
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 84](contracts/LiquidationPoolManager.sol#L84)

	```solidity
	    function setPoolFeePercentage(uint32 _poolFeePercentage) external onlyOwner {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 103](contracts/SmartVaultManagerV5.sol#L103)

	```solidity
	    function setMintFeeRate(uint256 _rate) external onlyOwner {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 107](contracts/SmartVaultManagerV5.sol#L107)

	```solidity
	    function setBurnFeeRate(uint256 _rate) external onlyOwner {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 111](contracts/SmartVaultManagerV5.sol#L111)

	```solidity
	    function setSwapFeeRate(uint256 _rate) external onlyOwner {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 115](contracts/SmartVaultManagerV5.sol#L115)

	```solidity
	    function setWethAddress(address _weth) external onlyOwner() {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 119](contracts/SmartVaultManagerV5.sol#L119)

	```solidity
	    function setSwapRouter2(address _swapRouter) external onlyOwner() {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 123](contracts/SmartVaultManagerV5.sol#L123)

	```solidity
	    function setNFTMetadataGenerator(address _nftMetadataGenerator) external onlyOwner() {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 127](contracts/SmartVaultManagerV5.sol#L127)

	```solidity
	    function setSmartVaultDeployer(address _smartVaultDeployer) external onlyOwner() {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 131](contracts/SmartVaultManagerV5.sol#L131)

	```solidity
	    function setProtocolAddress(address _protocol) external onlyOwner() {
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 135](contracts/SmartVaultManagerV5.sol#L135)

	```solidity
	    function setLiquidatorAddress(address _liquidator) external onlyOwner() {
	```

- Found in contracts/SmartVaultV3.sol [Line: 135](contracts/SmartVaultV3.sol#L135)

	```solidity
	    function removeCollateralNative(uint256 _amount, address payable _to) external onlyOwner {
	```

- Found in contracts/SmartVaultV3.sol [Line: 142](contracts/SmartVaultV3.sol#L142)

	```solidity
	    function removeCollateral(bytes32 _symbol, uint256 _amount, address _to) external onlyOwner {
	```

- Found in contracts/SmartVaultV3.sol [Line: 149](contracts/SmartVaultV3.sol#L149)

	```solidity
	    function removeAsset(address _tokenAddr, uint256 _amount, address _to) external onlyOwner {
	```

- Found in contracts/SmartVaultV3.sol [Line: 160](contracts/SmartVaultV3.sol#L160)

	```solidity
	    function mint(address _to, uint256 _amount) external onlyOwner ifNotLiquidated {
	```

- Found in contracts/SmartVaultV3.sol [Line: 214](contracts/SmartVaultV3.sol#L214)

	```solidity
	    function swap(bytes32 _inToken, bytes32 _outToken, uint256 _amount) external onlyOwner {
	```

- Found in contracts/utils/EUROsMock.sol [Line: 8](contracts/utils/EUROsMock.sol#L8)

	```solidity
	contract EUROsMock is IEUROs, ERC20, AccessControl {
	```

- Found in contracts/utils/EUROsMock.sol [Line: 18](contracts/utils/EUROsMock.sol#L18)

	```solidity
	    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
	```

- Found in contracts/utils/EUROsMock.sol [Line: 22](contracts/utils/EUROsMock.sol#L22)

	```solidity
	    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
	```

- Found in contracts/utils/SmartVaultIndex.sol [Line: 7](contracts/utils/SmartVaultIndex.sol#L7)

	```solidity
	contract SmartVaultIndex is ISmartVaultIndex, Ownable {
	```

- Found in contracts/utils/SmartVaultIndex.sol [Line: 43](contracts/utils/SmartVaultIndex.sol#L43)

	```solidity
	    function setVaultManager(address _manager) external onlyOwner {
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 115](contracts/utils/SmartVaultManager.sol#L115)

	```solidity
	    function setMintFeeRate(uint256 _rate) external onlyOwner {
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 119](contracts/utils/SmartVaultManager.sol#L119)

	```solidity
	    function setBurnFeeRate(uint256 _rate) external onlyOwner {
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 9](contracts/utils/TokenManagerMock.sol#L9)

	```solidity
	contract TokenManagerMock is ITokenManager, Ownable {
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 36](contracts/utils/TokenManagerMock.sol#L36)

	```solidity
	    function addAcceptedToken(address _token, address _chainlinkFeed) external onlyOwner {
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 45](contracts/utils/TokenManagerMock.sol#L45)

	```solidity
	    function removeAcceptedToken(bytes32 _symbol) external onlyOwner {
	```



## M-2: Using `ERC721::_mint()` can be dangerous

Using `ERC721::_mint()` can mint ERC721 tokens to addresses which don't support ERC721 tokens. Use `_safeMint()` instead of `_mint()` for ERC721.

- Found in contracts/utils/ERC20Mock.sol [Line: 14](contracts/utils/ERC20Mock.sol#L14)

	```solidity
	        _mint(to, amount);
	```

- Found in contracts/utils/EUROsMock.sol [Line: 19](contracts/utils/EUROsMock.sol#L19)

	```solidity
	        _mint(to, amount);
	```



# Low Issues

## L-1: `abi.encodePacked()` should not be used with dynamic types when passing the result to a hash function such as `keccak256()`

Use `abi.encode()` instead which will pad items to 32 bytes, which will [prevent hash collisions](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#non-standard-packed-mode) (e.g. `abi.encodePacked(0x123,0x456)` => `0x123456` => `abi.encodePacked(0x1,0x23456)`, but `abi.encode(0x123,0x456)` => `0x0...1230...456`). Unless there is a compelling reason, `abi.encode` should be preferred. If there is only one argument to `abi.encodePacked()` it can often be cast to `bytes()` or `bytes32()` [instead](https://ethereum.stackexchange.com/questions/30912/how-to-compare-strings-in-solidity#answer-82739).
If all arguments are strings and or bytes, `bytes.concat()` should be used instead.

- Found in contracts/utils/nfts/DefGenerator.sol [Line: 31](contracts/utils/nfts/DefGenerator.sol#L31)

	```solidity
	                    abi.encodePacked(
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 25](contracts/utils/nfts/NFTMetadataGenerator.sol#L25)

	```solidity
	            collateralTraits = string(abi.encodePacked(collateralTraits, '{"trait_type":"', NFTUtils.toShortString(asset.token.symbol), '", ','"display_type": "number",','"value": ',NFTUtils.toDecimalString(asset.amount, asset.token.dec),'},'));
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 31](contracts/utils/nfts/NFTMetadataGenerator.sol#L31)

	```solidity
	            abi.encodePacked(
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 33](contracts/utils/nfts/NFTMetadataGenerator.sol#L33)

	```solidity
	                Base64.encode(abi.encodePacked(
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 66](contracts/utils/nfts/NFTUtils.sol#L66)

	```solidity
	        return string(abi.encodePacked(wholePart, ".", fractionalPartPadded));
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 39](contracts/utils/nfts/SVGGenerator.sol#L39)

	```solidity
	                displayText = string(abi.encodePacked(displayText,
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 53](contracts/utils/nfts/SVGGenerator.sol#L53)

	```solidity
	            displayText = string(abi.encodePacked(
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 69](contracts/utils/nfts/SVGGenerator.sol#L69)

	```solidity
	            mappedRows = string(abi.encodePacked(
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 75](contracts/utils/nfts/SVGGenerator.sol#L75)

	```solidity
	        mappedRows = string(abi.encodePacked(mappedRows,
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 80](contracts/utils/nfts/SVGGenerator.sol#L80)

	```solidity
	        return _vaultStatus.minted == 0 ? "N/A" : string(abi.encodePacked(NFTUtils.toDecimalString(HUNDRED_PC * _vaultStatus.totalCollateralValue / _vaultStatus.minted, 3),"%"));
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 87](contracts/utils/nfts/SVGGenerator.sol#L87)

	```solidity
	                    abi.encodePacked(
	```



## L-2: Deprecated OpenZeppelin functions should not be used

Openzeppelin has deprecated several functions and replaced with newer versions. Please consult https://docs.openzeppelin.com/

- Found in contracts/SmartVaultV3.sol [Line: 198](contracts/SmartVaultV3.sol#L198)

	```solidity
	        IERC20(_params.tokenIn).safeApprove(ISmartVaultManagerV3(manager).swapRouter2(), _params.amountIn);
	```



## L-3: Unsafe ERC20 Operations should not be used

ERC20 functions may not behave as expected. For example: return values are not always meaningful. It is recommended to use OpenZeppelin's SafeERC20 library.

- Found in contracts/LiquidationPool.sol [Line: 175](contracts/LiquidationPool.sol#L175)

	```solidity
	                    IERC20(_token.addr).transfer(msg.sender, _rewardAmount);
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 37](contracts/LiquidationPoolManager.sol#L37)

	```solidity
	            eurosToken.approve(pool, _feesForPool);
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 40](contracts/LiquidationPoolManager.sol#L40)

	```solidity
	        eurosToken.transfer(protocol, eurosToken.balanceOf(address(this)));
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 54](contracts/LiquidationPoolManager.sol#L54)

	```solidity
	                if (balance > 0) IERC20(_token.addr).transfer(protocol, balance);
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 76](contracts/LiquidationPoolManager.sol#L76)

	```solidity
	                    ierc20.approve(pool, erc20balance);
	```

- Found in contracts/utils/MockSmartVaultManager.sol [Line: 35](contracts/utils/MockSmartVaultManager.sol#L35)

	```solidity
	                    ierc20.transfer(msg.sender, ierc20.balanceOf(address(this)));
	```



## L-4: Solidity pragma should be specific, not wide

Consider using a specific version of Solidity in your contracts instead of a wide version. For example, instead of `pragma solidity ^0.8.0;`, use `pragma solidity 0.8.0;`

- Found in contracts/LiquidationPool.sol [Line: 2](contracts/LiquidationPool.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 2](contracts/LiquidationPoolManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/interfaces/ILiquidationPool.sol [Line: 2](contracts/interfaces/ILiquidationPool.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/interfaces/ILiquidationPoolManager.sol [Line: 2](contracts/interfaces/ILiquidationPoolManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/utils/MockSmartVaultManager.sol [Line: 2](contracts/utils/MockSmartVaultManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```



## L-5: Conditional storage checks are not consistent

When writing `require` or `if` conditionals that check storage values, it is important to be consistent to prevent off-by-one errors. There are instances found where the same storage variable is checked multiple times, but the conditionals are not consistent.

- Found in contracts/SmartVaultV3.sol [Line: 54](contracts/SmartVaultV3.sol#L54)

	```solidity
	        require(minted >= _amount, "err-insuff-minted");
	```

- Found in contracts/SmartVaultV3.sol [Line: 80](contracts/SmartVaultV3.sol#L80)

	```solidity
	        return _symbol == NATIVE ? address(this).balance : IERC20(_tokenAddress).balanceOf(address(this));
	```

- Found in contracts/SmartVaultV3.sol [Line: 100](contracts/SmartVaultV3.sol#L100)

	```solidity
	        return minted > maxMintable();
	```

- Found in contracts/SmartVaultV3.sol [Line: 121](contracts/SmartVaultV3.sol#L121)

	```solidity
	            if (tokens[i].symbol != NATIVE) liquidateERC20(IERC20(tokens[i].addr));
	```

- Found in contracts/SmartVaultV3.sol [Line: 128](contracts/SmartVaultV3.sol#L128)

	```solidity
	        if (minted == 0) return true;
	```

- Found in contracts/SmartVaultV3.sol [Line: 132](contracts/SmartVaultV3.sol#L132)

	```solidity
	            minted <= currentMintable - eurValueToRemove;
	```

- Found in contracts/SmartVaultV3.sol [Line: 157](contracts/SmartVaultV3.sol#L157)

	```solidity
	        return minted + _amount <= maxMintable();
	```

- Found in contracts/SmartVaultV3.sol [Line: 163](contracts/SmartVaultV3.sol#L163)

	```solidity
	        minted = minted + _amount + fee;
	```

- Found in contracts/SmartVaultV3.sol [Line: 171](contracts/SmartVaultV3.sol#L171)

	```solidity
	        minted = minted - _amount;
	```

- Found in contracts/SmartVaultV3.sol [Line: 208](contracts/SmartVaultV3.sol#L208)

	```solidity
	        uint256 requiredCollateralValue = minted * _manager.collateralRate() / _manager.HUNDRED_PC();
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 79](contracts/utils/SmartVaultManager.sol#L79)

	```solidity
	        tokenId = lastToken + 1;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 93](contracts/utils/SmartVaultManager.sol#L93)

	```solidity
	        for (uint256 i = 1; i <= lastToken; i++) {
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 35](contracts/utils/nfts/SVGGenerator.sol#L35)

	```solidity
	            uint256 xShift = collateralSize % 2 == 0 ? 0 : TABLE_ROW_WIDTH >> 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 73](contracts/utils/nfts/SVGGenerator.sol#L73)

	```solidity
	        uint256 rowMidpoint = TABLE_INITIAL_X + TABLE_ROW_WIDTH >> 1;
	```



## L-6: PUSH0 is not supported by all chains

Solc compiler version 0.8.20 switches the default target EVM version to Shanghai, which means that the generated bytecode will include PUSH0 opcodes. Be sure to select the appropriate EVM version in case you intend to deploy on a chain other than mainnet like L2 chains that may not support PUSH0, otherwise deployment of your contracts will fail.

- Found in contracts/LiquidationPool.sol [Line: 2](contracts/LiquidationPool.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 2](contracts/LiquidationPoolManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/interfaces/ILiquidationPool.sol [Line: 2](contracts/interfaces/ILiquidationPool.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/interfaces/ILiquidationPoolManager.sol [Line: 2](contracts/interfaces/ILiquidationPoolManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```

- Found in contracts/utils/MockSmartVaultManager.sol [Line: 2](contracts/utils/MockSmartVaultManager.sol#L2)

	```solidity
	pragma solidity ^0.8.17;
	```



# NC Issues

## NC-1: Missing checks for `address(0)` when assigning values to address state variables

Assigning values to address state variables without checking for `address(0)`.

- Found in contracts/LiquidationPool.sol [Line: 35](contracts/LiquidationPool.sol#L35)

	```solidity
	        tokenManager = _tokenManager;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 116](contracts/SmartVaultManagerV5.sol#L116)

	```solidity
	        weth = _weth;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 120](contracts/SmartVaultManagerV5.sol#L120)

	```solidity
	        swapRouter2 = _swapRouter;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 124](contracts/SmartVaultManagerV5.sol#L124)

	```solidity
	        nftMetadataGenerator = _nftMetadataGenerator;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 128](contracts/SmartVaultManagerV5.sol#L128)

	```solidity
	        smartVaultDeployer = _smartVaultDeployer;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 132](contracts/SmartVaultManagerV5.sol#L132)

	```solidity
	        protocol = _protocol;
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 136](contracts/SmartVaultManagerV5.sol#L136)

	```solidity
	        liquidator = _liquidator;
	```

- Found in contracts/SmartVaultV3.sol [Line: 37](contracts/SmartVaultV3.sol#L37)

	```solidity
	        owner = _owner;
	```

- Found in contracts/SmartVaultV3.sol [Line: 234](contracts/SmartVaultV3.sol#L234)

	```solidity
	        owner = _newOwner;
	```

- Found in contracts/utils/SmartVaultIndex.sol [Line: 44](contracts/utils/SmartVaultIndex.sol#L44)

	```solidity
	        manager = _manager;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 45](contracts/utils/SmartVaultManager.sol#L45)

	```solidity
	        euros = _euros;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 48](contracts/utils/SmartVaultManager.sol#L48)

	```solidity
	        protocol = _protocol;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 49](contracts/utils/SmartVaultManager.sol#L49)

	```solidity
	        liquidator = _liquidator;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 50](contracts/utils/SmartVaultManager.sol#L50)

	```solidity
	        tokenManager = _tokenManager;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 51](contracts/utils/SmartVaultManager.sol#L51)

	```solidity
	        smartVaultDeployer = _smartVaultDeployer;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 53](contracts/utils/SmartVaultManager.sol#L53)

	```solidity
	        nftMetadataGenerator = _nftMetadataGenerator;
	```



## NC-2: Functions not used internally could be marked external



- Found in contracts/SmartVaultManagerV5.sol [Line: 46](contracts/SmartVaultManagerV5.sol#L46)

	```solidity
	    function initialize() initializer public {}
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 94](contracts/SmartVaultManagerV5.sol#L94)

	```solidity
	    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
	```

- Found in contracts/utils/ERC20Mock.sol [Line: 13](contracts/utils/ERC20Mock.sol#L13)

	```solidity
	    function mint(address to, uint256 amount) public {
	```

- Found in contracts/utils/ERC20Mock.sol [Line: 17](contracts/utils/ERC20Mock.sol#L17)

	```solidity
	    function decimals() public view override returns (uint8) {
	```

- Found in contracts/utils/EUROsMock.sol [Line: 18](contracts/utils/EUROsMock.sol#L18)

	```solidity
	    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
	```

- Found in contracts/utils/EUROsMock.sol [Line: 22](contracts/utils/EUROsMock.sol#L22)

	```solidity
	    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 41](contracts/utils/SmartVaultManager.sol#L41)

	```solidity
	    function initialize(uint256 _collateralRate, uint256 _feeRate, address _euros, address _protocol, address _liquidator, address _tokenManager, address _smartVaultDeployer, address _smartVaultIndex, address _nftMetadataGenerator) initializer public {
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 106](contracts/utils/SmartVaultManager.sol#L106)

	```solidity
	    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
	```



## NC-3: Constants should be defined and used instead of literals



- Found in contracts/LiquidationPool.sol [Line: 99](contracts/LiquidationPool.sol#L99)

	```solidity
	                holders[i] = holders[holders.length - 1];
	```

- Found in contracts/LiquidationPool.sol [Line: 106](contracts/LiquidationPool.sol#L106)

	```solidity
	        for (uint256 i = _i; i < pendingStakes.length - 1; i++) {
	```

- Found in contracts/LiquidationPool.sol [Line: 107](contracts/LiquidationPool.sol#L107)

	```solidity
	            pendingStakes[i] = pendingStakes[i+1];
	```

- Found in contracts/LiquidationPool.sol [Line: 120](contracts/LiquidationPool.sol#L120)

	```solidity
	        uint256 deadline = block.timestamp - 1 days;
	```

- Found in contracts/LiquidationPool.sol [Line: 220](contracts/LiquidationPool.sol#L220)

	```solidity
	                        uint256 costInEuros = _portion * 10 ** (18 - asset.token.dec) * uint256(assetPriceUsd) / uint256(priceEurUsd)
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 71](contracts/SmartVaultManagerV5.sol#L71)

	```solidity
	        tokenId = lastToken + 1;
	```

- Found in contracts/SmartVaultV3.sol [Line: 221](contracts/SmartVaultV3.sol#L221)

	```solidity
	                fee: 3000,
	```

- Found in contracts/utils/ChainlinkMock.sol [Line: 17](contracts/utils/ChainlinkMock.sol#L17)

	```solidity
	    function decimals() external pure returns (uint8) { return 8; }
	```

- Found in contracts/utils/ChainlinkMock.sol [Line: 25](contracts/utils/ChainlinkMock.sol#L25)

	```solidity
	        prices.push(PriceRound(block.timestamp - 4 hours, _price));
	```

- Found in contracts/utils/ChainlinkMock.sol [Line: 37](contracts/utils/ChainlinkMock.sol#L37)

	```solidity
	            roundId = uint80(prices.length - 1);
	```

- Found in contracts/utils/ChainlinkMock.sol [Line: 47](contracts/utils/ChainlinkMock.sol#L47)

	```solidity
	        return 1;
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 19](contracts/utils/PriceCalculator.sol#L19)

	```solidity
	        uint256 startPeriod = block.timestamp - _hours * 1 hours;
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 25](contracts/utils/PriceCalculator.sol#L25)

	```solidity
	        uint256 roundCount = 1;
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 26](contracts/utils/PriceCalculator.sol#L26)

	```solidity
	        while (roundTS > startPeriod && roundId > 1) {
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 40](contracts/utils/PriceCalculator.sol#L40)

	```solidity
	        return _symbol == NATIVE ? 0 : 18 - ERC20(_tokenAddress).decimals();
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 45](contracts/utils/PriceCalculator.sol#L45)

	```solidity
	        uint256 scaledCollateral = _tokenValue * 10 ** getTokenScaleDiff(_token.symbol, _token.addr);
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 46](contracts/utils/PriceCalculator.sol#L46)

	```solidity
	        uint256 collateralUsd = scaledCollateral * avgPrice(4, tokenUsdClFeed);
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 53](contracts/utils/PriceCalculator.sol#L53)

	```solidity
	        uint256 scaledCollateral = _tokenValue * 10 ** getTokenScaleDiff(_token.symbol, _token.addr);
	```

- Found in contracts/utils/PriceCalculator.sol [Line: 64](contracts/utils/PriceCalculator.sol#L64)

	```solidity
	        return _eurValue * uint256(eurUsdPrice) / uint256(tokenUsdPrice) / 10 ** getTokenScaleDiff(_token.symbol, _token.addr);
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 79](contracts/utils/SmartVaultManager.sol#L79)

	```solidity
	        tokenId = lastToken + 1;
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 93](contracts/utils/SmartVaultManager.sol#L93)

	```solidity
	        for (uint256 i = 1; i <= lastToken; i++) {
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 20](contracts/utils/TokenManagerMock.sol#L20)

	```solidity
	        acceptedTokens.push(Token(NATIVE, address(0), 18, _clNativeUsd, Chainlink.AggregatorV3Interface(_clNativeUsd).decimals()));
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 49](contracts/utils/TokenManagerMock.sol#L49)

	```solidity
	                acceptedTokens[i] = acceptedTokens[acceptedTokens.length - 1];
	```

- Found in contracts/utils/nfts/DefGenerator.sol [Line: 14](contracts/utils/nfts/DefGenerator.sol#L14)

	```solidity
	        bytes32[25] memory colours = [
	```

- Found in contracts/utils/nfts/DefGenerator.sol [Line: 22](contracts/utils/nfts/DefGenerator.sol#L22)

	```solidity
	            colours[(_tokenId % colours.length + _tokenId / colours.length + 1) % colours.length],
	```

- Found in contracts/utils/nfts/DefGenerator.sol [Line: 23](contracts/utils/nfts/DefGenerator.sol#L23)

	```solidity
	            colours[(_tokenId % colours.length + _tokenId / colours.length + _tokenId / colours.length ** 2 + 2) % colours.length]
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 39](contracts/utils/nfts/NFTMetadataGenerator.sol#L39)

	```solidity
	                            '{"trait_type": "Debt",  "display_type": "number", "value": ', NFTUtils.toDecimalString(_vaultStatus.minted, 18),'},',
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 40](contracts/utils/nfts/NFTMetadataGenerator.sol#L40)

	```solidity
	                            '{"trait_type": "Max Borrowable Amount", "display_type": "number", "value": "',NFTUtils.toDecimalString(_vaultStatus.maxMintable, 18),'"},',
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 41](contracts/utils/nfts/NFTMetadataGenerator.sol#L41)

	```solidity
	                            '{"trait_type": "Collateral Value in EUROs", "display_type": "number", "value": ',NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue, 18),'},',
	```

- Found in contracts/utils/nfts/NFTMetadataGenerator.sol [Line: 42](contracts/utils/nfts/NFTMetadataGenerator.sol#L42)

	```solidity
	                            '{"trait_type": "Value minus debt", "display_type": "number", "value": ',NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue - _vaultStatus.minted, 18),'},',
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 14](contracts/utils/nfts/NFTUtils.sol#L14)

	```solidity
	        bytes memory bytesString = new bytes(32);
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 16](contracts/utils/nfts/NFTUtils.sol#L16)

	```solidity
	        for (uint8 i = 0; i < 32; i++) {
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 43](contracts/utils/nfts/NFTUtils.sol#L43)

	```solidity
	                    fractionalPartPadded = new bytes(fractionalPartPadded.length - 1);
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 59](contracts/utils/nfts/NFTUtils.sol#L59)

	```solidity
	        uint8 maxDecPlaces = 5;
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 60](contracts/utils/nfts/NFTUtils.sol#L60)

	```solidity
	        string memory wholePart = (_amount / 10 ** _inputDec).toString();
	```

- Found in contracts/utils/nfts/NFTUtils.sol [Line: 61](contracts/utils/nfts/NFTUtils.sol#L61)

	```solidity
	        uint256 fraction = _amount % 10 ** _inputDec;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 29](contracts/utils/nfts/SVGGenerator.sol#L29)

	```solidity
	        uint256 paddingTop = 50;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 30](contracts/utils/nfts/SVGGenerator.sol#L30)

	```solidity
	        uint256 paddingLeftSymbol = 22;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 31](contracts/utils/nfts/SVGGenerator.sol#L31)

	```solidity
	        uint256 paddingLeftAmount = paddingLeftSymbol + 250;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 35](contracts/utils/nfts/SVGGenerator.sol#L35)

	```solidity
	            uint256 xShift = collateralSize % 2 == 0 ? 0 : TABLE_ROW_WIDTH >> 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 37](contracts/utils/nfts/SVGGenerator.sol#L37)

	```solidity
	                uint256 currentRow = collateralSize >> 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 60](contracts/utils/nfts/SVGGenerator.sol#L60)

	```solidity
	            collateralSize = 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 67](contracts/utils/nfts/SVGGenerator.sol#L67)

	```solidity
	        uint256 rowCount = (_collateralSize + 1) >> 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 68](contracts/utils/nfts/SVGGenerator.sol#L68)

	```solidity
	        for (uint256 i = 0; i < (rowCount + 1) >> 1; i++) {
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 73](contracts/utils/nfts/SVGGenerator.sol#L73)

	```solidity
	        uint256 rowMidpoint = TABLE_INITIAL_X + TABLE_ROW_WIDTH >> 1;
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 80](contracts/utils/nfts/SVGGenerator.sol#L80)

	```solidity
	        return _vaultStatus.minted == 0 ? "N/A" : string(abi.encodePacked(NFTUtils.toDecimalString(HUNDRED_PC * _vaultStatus.totalCollateralValue / _vaultStatus.minted, 3),"%"));
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 106](contracts/utils/nfts/SVGGenerator.sol#L106)

	```solidity
	                                    "<text class='cls-7' transform='translate(2191.03 719.41)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue, 18)," EUROs</tspan></text>",
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 110](contracts/utils/nfts/SVGGenerator.sol#L110)

	```solidity
	                                    "<text class='cls-7' transform='translate(2191.03 822.75)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.minted, 18)," EUROs</tspan></text>",
	```

- Found in contracts/utils/nfts/SVGGenerator.sol [Line: 118](contracts/utils/nfts/SVGGenerator.sol#L118)

	```solidity
	                                    "<text class='cls-5' transform='translate(1715.63 1220.22)'><tspan x='0' y='0'>",NFTUtils.toDecimalString(_vaultStatus.totalCollateralValue - _vaultStatus.minted, 18)," EUROs</tspan></text>",
	```



## NC-4: Event is missing `indexed` fields

Index event fields make the field more quickly accessible to off-chain tools that parse events. However, note that each index field costs extra gas during emission, so it's not necessarily best to index the maximum allowed per event (three fields). Each event should use three indexed fields if there are three or more fields, and gas usage is not particularly of concern for the events in question. If there are fewer than three fields, all of the fields should be indexed.

- Found in contracts/SmartVaultManagerV5.sol [Line: 37](contracts/SmartVaultManagerV5.sol#L37)

	```solidity
	    event VaultDeployed(address indexed vaultAddress, address indexed owner, address vaultType, uint256 tokenId);
	```

- Found in contracts/SmartVaultManagerV5.sol [Line: 39](contracts/SmartVaultManagerV5.sol#L39)

	```solidity
	    event VaultTransferred(uint256 indexed tokenId, address from, address to);
	```

- Found in contracts/SmartVaultV3.sol [Line: 30](contracts/SmartVaultV3.sol#L30)

	```solidity
	    event CollateralRemoved(bytes32 symbol, uint256 amount, address to);
	```

- Found in contracts/SmartVaultV3.sol [Line: 31](contracts/SmartVaultV3.sol#L31)

	```solidity
	    event AssetRemoved(address token, uint256 amount, address to);
	```

- Found in contracts/SmartVaultV3.sol [Line: 32](contracts/SmartVaultV3.sol#L32)

	```solidity
	    event EUROsMinted(address to, uint256 amount, uint256 fee);
	```

- Found in contracts/SmartVaultV3.sol [Line: 33](contracts/SmartVaultV3.sol#L33)

	```solidity
	    event EUROsBurned(uint256 amount, uint256 fee);
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 32](contracts/utils/SmartVaultManager.sol#L32)

	```solidity
	    event VaultDeployed(address indexed vaultAddress, address indexed owner, address vaultType, uint256 tokenId);
	```

- Found in contracts/utils/SmartVaultManager.sol [Line: 34](contracts/utils/SmartVaultManager.sol#L34)

	```solidity
	    event VaultTransferred(uint256 indexed tokenId, address from, address to);
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 15](contracts/utils/TokenManagerMock.sol#L15)

	```solidity
	    event TokenAdded(bytes32 symbol, address token);
	```

- Found in contracts/utils/TokenManagerMock.sol [Line: 16](contracts/utils/TokenManagerMock.sol#L16)

	```solidity
	    event TokenRemoved(bytes32 symbol);
	```



## NC-5: `require()` / `revert()` statements should have descriptive reason strings or custom errors



- Found in contracts/LiquidationPool.sol [Line: 135](contracts/LiquidationPool.sol#L135)

	```solidity
	        require(_tstVal > 0 || _eurosVal > 0);
	```

- Found in contracts/LiquidationPool.sol [Line: 173](contracts/LiquidationPool.sol#L173)

	```solidity
	                    require(_sent);
	```

- Found in contracts/LiquidationPool.sol [Line: 200](contracts/LiquidationPool.sol#L200)

	```solidity
	                require(_sent);
	```

- Found in contracts/LiquidationPoolManager.sol [Line: 50](contracts/LiquidationPoolManager.sol#L50)

	```solidity
	                    require(_sent);
	```

- Found in contracts/utils/MockSmartVaultManager.sol [Line: 30](contracts/utils/MockSmartVaultManager.sol#L30)

	```solidity
	                require(_sent);
	```




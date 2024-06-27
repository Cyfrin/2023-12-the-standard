# The Standard

[//]: # (contest-details-open)

## Contest Details

- Total Prize Pool:
  - HM Awards: $17,500
  - Low Awards: $2,500
- Starts - December 27, 2023 Noon UTC
- Ends - January 10, 2024 Noon UTC

## Stats

- nSLOC: 609
- Complexity Score: 698
- Dollars per Complexity: $28.65
- Dollars per nSLOC: $32.84

## About the Project

Secure your crypto assets, such as ETH, WBTC, ARB, LINK, & PAXG tokenized gold, in smart contracts that you control and no one else, then effortlessly borrow stablecoins with 0% interest loans and no time limit to pay back.

- [Website](https://www.thestandard.io/)
- [Twitter](https://www.thestandard.io/)
- [GitHub](https://github.com/the-standard)

## Actors

- **Borrowers**: users creating Smart Vaults, depositing their collateral, borrowing EUROs stablecoins against it

- **Smart Vault Manager**: contract managing vault deployments, controls admin data which dictates behaviour of Smart Vaults e.g. fee rates, collateral rates, dependency addresses, managed by The Standard

- **Stakers**: users adding TST and/or EUROs to the Liquidation Pool, in order to gain rewards from borrowing fees and vault liquidations

- **Liquidation Pool Manager**: contract managing liquidations and distribution of borrowing fees in the pool

[//]: # (scope-open)

## Scope (contracts)

All contracts at commit `7c9f84772eacb588c00a2add9f46aa93211a7132`

- [SmartVaultV3]
- [SmartVaultManagerV5]
- [LiquidationPool]
- [LiquidationPoolManager]

## Compatibilities

The live version of these contracts (deployed to Arbitrum One) have some key external dependencies:

- [WBTC](https://arbiscan.io/token/0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f)
- [ARB](https://arbiscan.io/address/0x912ce59144191c1204e64559fe8253a0e49e6548)
- [LINK](https://arbiscan.io/token/0xf97f4df75117a78c1a5a0dbb814af92458539fb4)
- [PAXG](https://arbiscan.io/token/0xfeb4dfc8c4cf7ed305bb08065d08ec6ee6728429)
- [Chainlink ETH / USD feed](https://arbiscan.io/address/0x639fe6ab55c921f74e7fac1ee960c0b6293ba612)
- [Chainlink WBTC / USD feed](https://arbiscan.io/address/0xd0c7101eacbb49f3decccc166d238410d6d46d57)
- [Chainlink ARB / USD feed](https://arbiscan.io/address/0xb2a824043730fe05f3da2efafa1cbbe83fa548d6)
- [Chainlink LINK / USD feed](https://arbiscan.io/address/0x86e53cf1b870786351da77a57575e79cb55812cb)
- [Chainlink PAXG / USD feed](https://arbiscan.io/address/0x2ba975d4d7922cd264267af16f3bd177f206fe3c)
- [Chainlink EUR / USD feed](https://arbiscan.io/address/0xa14d53bc1f1c0f31b4aa3bd109344e5009051a84)
- [Uniswap V3 Swap Router](https://arbiscan.io/address/0xE592427A0AEce92De3Edee1F18E0157C05861564)
- [The Standard EURO](https://arbiscan.io/token/0x643b34980e635719c15a2d4ce69571a258f940e9)
- [The Standard Token](https://arbiscan.io/token/0xf5a27e55c748bcddbfea5477cb9ae924f0f7fd2e)

As well as administrative dependencies managed by us:

- A [Token Manager](https://arbiscan.io/address/0x33c5A816382760b6E5fb50d8854a61b3383a32a0), storing data about which tokens are accepted Smart Vault Collateral
- A [Deployer](https://arbiscan.io/address/0x53509eF0e49c8a386b81093711aF1eF29357cc25), facilitating user creations of Smart Vaults
- An [Index](https://arbiscan.io/address/0x56c7506410e5e242261c5E0db6941956c686E5A1), storing vault owners' token IDs and vault addresses
- A [Price Calculator](https://arbiscan.io/address/0x6ff84e5bf2cff6cf1f23071a6f4e2e169d535e97), using Chainlink data feeds to calculate price conversions for vaults
- An [NFT Metadata Generator](https://arbiscan.io/address/0x3C70276Ee29FD659a9D06983522b731784012c54), producing token URI metadata based on current vault state

For this test environment, collateral tokens have been replaced by a test ERC20 token. EUROs and TST have been replaced with mock versions. Chainlink feeds have been replaced by static price feeds. Uniswap swaps have been stubbed by a contract stub.

The administrative dependencies are managed by The Standard and are therefore not within the scope of this audit. They are replicated in the test environment.

```
Compatibilities:
  Blockchains:
      - Any EVM chains with live Chainlink data feeds and live Uniswap pools
  Tokens:
      - ETH
```

[//]: # (scope-close)

[//]: # (getting-started-open)

## Getting Started

This project uses Hardhat.

To install the dependencies:

```
npm install
```

To run the test suite:

```
npx hardhat test
```

To start the default test environment, you can start a local Hardhat node:

```
npx hardhat node
```

And use the deploy script to build the environment on the running node:

```
npx hardhat run --network localhost scripts/deploy.js
```

You should see an output similar to:

```
SmartVaultManager: 0x...
LiquidationPoolManager: 0x...
LiquidationPool: 0x...
User 0x... has balance 9999.923234... ETH
User 0x... minted with 1000 test TST
User 0x... minted with 1000 test EUROs
User 0x... minted with 1000 test USDs
```

Use these addresses to interact with your locally deployed contracts.

[//]: # (getting-started-close)

[//]: # (known-issues-open)

## Known Issues

**SmartVaultManagerV5**

- This is version 5 of an OpenZeppelin upgradeable contract. That is why there is no constructor setting the initial state variables
- `_safeMint` is a reentrancy risk, however this is mitigated by the fact that the contract will try to mint the same token ID again, and reverting
- Dependencies on our administrative SmartVaultIndex, SmartVaultDeployer, NFTMetadataGenerator contracts
- `vaults` function array length is unchecked going into for loop. An abuse of NFT minting by a user could prevent them from being able to use this `vaults` function
- `mint` function is dependent on our SmartVaultDeployer and SmartVaultIndex contracts, however we have the administrative control over setting these addresses
- Very important access control roles are granted to the Smart Vaults (`MINTER_ROLE`, `BURNER_ROLE`), giving these contracts strong permissions over the supply of EUROs, however this is a necessary key feature in our project, as users must be able to borrow through their vaults. As such the SmartVaultManager must also have a admin role in EUROs access control
- If a Smart Vault's `undercollateralised` function reverts, it cannot be liquidated
- No zero address check for administrative functions `setWethAddress`, `setSwapRouter2`, `setNFTMetadataGenerator`, `setSmartVaultDeployer`, `setProtocolAddress`, `setLiquidatorAddress`. However we have benefited from this. This can allow the blocking of certain Smart Vault features. e.g. we were previously able to block a vulnerability in the Smart Vault feature by setting the Swap Router to a zero address

**SmartVaultV3**

- Dependencies on our administrative contracts SmartVaultManager and PriceCalculator, but these addresses are set by our contracts on deployment. This is also the case with the EUROs contract. These addresses could be set to anything on deployment, but this Smart Vault contract only provides value to a user if it has EUROs minting and burning permissions, which are only granted when deployed via SmartVaultManager's `mint`
- Length of accepted tokens array throughout contract is unchecked, but this Token Manager contract is managed by us and there is unlikely to be more than 5-10 tokens in this array
- Throughout contract, dependent on an accurate prices being produced by PriceCalculator `tokenToEurAvg`, `tokenToEur`, `eurToToken` functions, but this contract is managed by us, and uses Chainlink data feeds for reliable price data
- `maxMintable` function will revert if SmartVaultManager `collateralRate` is 0, but this value is controlled by us and should never be
- `getAssetBalance` function will revert if the token provided has an incorrect combination of symbol bytes array and token address, however this data is managed by our TokenManager contract
- Contract requires the `protocol` address to be a payable address. This address will be set to the LiquidationPoolManager, which has a `receive` function
- Also requires `protocol` to be able to access the ERC20s sent. LiquidationPoolManager uses the same TokenManager list to handle assets.
- `liquidateERC20` is dependent on the token addresses provided by our TokenManager being correct
- `mint` function requires SmartVaultManager's `HUNDRED_PC` to not be 0, but the value is a constant
- `swap` is dependent on Uniswap V3 Swap Router. The address must be correct for this swap to be safely completed. This swap router address is controlled by our administrative SmartVaultManager contract
- `minimumAmountOut` can be set to 0 if there is no value required to keep collateral above required level. The user is likely to lose some value in the swap, especially when Uniswap fees are factored in, but this is at the user's discretion
- `setOwner` can change control of the vault, but this can only be completed by the SmartVaultManager contract, and is only called when completing an NFT transfer

**LiquidationPoolManager**

- Length of accepted tokens array is unchecked, but this TokenManager contract is managed by us and there is unlikely to be more than 5-10 tokens in this array
- `protocol` address must be payable, and able to handle ERC20s transferred. This address will be set to our Protocol's treasury wallet.

**LiquidationPool**

- No length check for number of stake `holders`. This could cause a problem throughout contract if there are a high number of stakers
- TokenManager `getAcceptedTokens` array length unchecked, but uses an administrative contract which is managed by us. Unlikely to be more than 5-10 items
- `position` function depends on `getTstTotal` not being 0. However, if current position has TST, then `TSTtotal` will never be 0
- `distributeFees` function requires an approval of EUROs beforehand, but LiquidationPoolManager approves the amount before calling the function
- `distributeAssets` function requires `stakeTotal` to be greater than 0, but this will always be the case if any `_positionStake > 0`
- Function is also dependent on Chainlink EUR / USD providing a price greater than 0
- Also dependent on accurate {Token} / USD prices being accurate, and greater than 0
- Dependent on `collateralRate` being greater than 0. This value is managed in our administrative SmartVaultManager contract, and the project is dependent on that value being correct
- `LiquidationPool` requires EUROs `BURNER_ROLE` permission, but this is an important function of the Liquidation Pool

**Additional Issues**
- Issues caught by Aderyn [here](https://github.com/Cyfrin/2023-12-the-standard/issues/1)

[//]: # (known-issues-close)

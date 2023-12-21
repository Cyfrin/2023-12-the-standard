const { ethers } = require("hardhat");
const { BigNumber } = ethers;

const HUNDRED_PC = BigNumber.from(100000);
const DEFAULT_COLLATERAL_RATE = BigNumber.from(120000); // 120%
const DEFAULT_ETH_USD_PRICE = BigNumber.from(160000000000); // $1600
const DEFAULT_EUR_USD_PRICE = BigNumber.from(106000000); // $1.06
const DEFAULT_WBTC_USD_PRICE = BigNumber.from(3500000000000);
const DEFAULT_USDC_USD_PRICE = BigNumber.from(100000000);
const PROTOCOL_FEE_RATE = BigNumber.from(500); // 0.5%
const POOL_FEE_PERCENTAGE = BigNumber.from(50000); // 50%
const ETH = ethers.utils.formatBytes32String('ETH');
const WETH_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const DAY = 60 * 60 * 24;
const TOKEN_ID = 1;

const getNFTMetadataContract = async _ => {
  const LibContract = await ethers.getContractFactory('NFTUtils');
  const lib = await LibContract.deploy();
  await lib.deployed();
  return await ethers.getContractFactory('NFTMetadataGenerator', {
    libraries: {
      NFTUtils: lib.address,
    },
  });
}

const fullyUpgradedSmartVaultManager = async (
  collateralRate, protocolFeeRate, eurosAddress, protocolAddress, 
  liquidatorAddress, tokenManagerAddress, smartVaultDeployerAddress,
  smartVaultIndexAddress, nFTMetadataGeneratorAddress, wethAddress, 
  swapRouterAddress
) => {
  const v1 = await upgrades.deployProxy(await ethers.getContractFactory('SmartVaultManager'), [
    collateralRate, protocolFeeRate, eurosAddress, protocolAddress, 
    liquidatorAddress, tokenManagerAddress, smartVaultDeployerAddress,
    smartVaultIndexAddress, nFTMetadataGeneratorAddress
  ]);

  const V5 = await upgrades.upgradeProxy(v1.address, await ethers.getContractFactory('SmartVaultManagerV5'));

  await V5.setSwapFeeRate(protocolFeeRate);
  await V5.setWethAddress(wethAddress);
  await V5.setSwapRouter2(swapRouterAddress);
  return V5;
}

const getCollateralOf = (symbol, collateral) => collateral.filter(c => c.token.symbol === ethers.utils.formatBytes32String(symbol))[0];

const mockTokenManager = async _ => {
  const MockERC20Factory = await ethers.getContractFactory('ERC20Mock');
  WBTC = await MockERC20Factory.deploy('Wrapped Bitcoin', 'WBTC', 8);
  USDC = await MockERC20Factory.deploy('USD Coin', 'USDC', 6);
  const EthUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('ETH/USD'); // $1900
  await EthUsd.setPrice(DEFAULT_ETH_USD_PRICE);
  const WbtcUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('WBTC/USD'); // $35,000
  await WbtcUsd.setPrice(DEFAULT_WBTC_USD_PRICE);
  const UsdcUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USDC/USD'); // 1$
  await UsdcUsd.setPrice(DEFAULT_USDC_USD_PRICE);
  const TokenManager = await (await ethers.getContractFactory('TokenManagerMock')).deploy(
    ethers.utils.formatBytes32String('ETH'), EthUsd.address
  );
  await TokenManager.addAcceptedToken(WBTC.address, WbtcUsd.address);
  await TokenManager.addAcceptedToken(USDC.address, UsdcUsd.address);
  return { TokenManager, WBTC, USDC };
};

const fastForward = async time => {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine");
}

const rewardAmountForAsset = (rewards, symbol) => {
  return rewards.filter(reward => reward.symbol === ethers.utils.formatBytes32String(symbol))[0].amount;
}

module.exports = {
  HUNDRED_PC,
  DEFAULT_COLLATERAL_RATE,
  DEFAULT_ETH_USD_PRICE,
  DEFAULT_EUR_USD_PRICE,
  DEFAULT_WBTC_USD_PRICE,
  DEFAULT_USDC_USD_PRICE,
  PROTOCOL_FEE_RATE,
  POOL_FEE_PERCENTAGE,
  ETH,
  WETH_ADDRESS,
  DAY,
  TOKEN_ID,
  getNFTMetadataContract,
  fullyUpgradedSmartVaultManager,
  getCollateralOf,
  mockTokenManager,
  fastForward,
  rewardAmountForAsset
}
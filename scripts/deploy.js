const { ethers, upgrades } = require("hardhat");
const { BigNumber } = ethers;

const ETH = ethers.utils.formatBytes32String('ETH');
const ETH_PRICE = BigNumber.from(2000).mul(BigNumber.from(10).pow(8)); // $2000
const EUR_PRICE = BigNumber.from(108).mul(BigNumber.from(10).pow(6)); // $1.08
const USD_PRICE = BigNumber.from(10).pow(8); // $1

async function main() {
  const [ user, protocol ] = await ethers.getSigners();
  
  const EUROs = await (await ethers.getContractFactory('EUROsMock')).deploy();
  await EUROs.deployed();

  const CL_ETH_USD = await (await ethers.getContractFactory('ChainlinkMock')).deploy('ETH / USD');
  await CL_ETH_USD.deployed();
  await (await CL_ETH_USD.setPrice(ETH_PRICE)).wait();

  const TokenManager = await (await ethers.getContractFactory('TokenManagerMock')).deploy(ETH, CL_ETH_USD.address);
  await TokenManager.deployed();

  const CL_EUR_USD = await (await ethers.getContractFactory('ChainlinkMock')).deploy('EUR / USD');
  await CL_EUR_USD.deployed();
  await (await CL_EUR_USD.setPrice(EUR_PRICE)).wait();
  
  const Deployer = await (await ethers.getContractFactory('SmartVaultDeployerV3')).deploy(ETH, CL_EUR_USD.address);
  await Deployer.deployed();

  const SmartVaultIndex = await (await ethers.getContractFactory('SmartVaultIndex')).deploy();
  await SmartVaultIndex.deployed();

  const LibContract = await ethers.getContractFactory('NFTUtils');
  const lib = await LibContract.deploy();
  await lib.deployed();
  const NFTMetadataGenerator = await (await ethers.getContractFactory('NFTMetadataGenerator', {
    libraries: {
      NFTUtils: lib.address,
    },
  })).deploy();
  await NFTMetadataGenerator.deployed();

  const SwapRouter = await (await ethers.getContractFactory('SwapRouterMock')).deploy();
  await SwapRouter.deployed();

  const SmartVaultManager = await upgrades.deployProxy(await ethers.getContractFactory('SmartVaultManager'), [
    '110000', 500, EUROs.address, ethers.constants.AddressZero, ethers.constants.AddressZero, TokenManager.address,
    Deployer.address, SmartVaultIndex.address, NFTMetadataGenerator.address
  ]);
  await SmartVaultManager.deployed();
  const v5 = await upgrades.upgradeProxy(SmartVaultManager.address, await ethers.getContractFactory('SmartVaultManagerV5'));
  await (await v5.setSwapFeeRate(500)).wait();
  await (await v5.setSwapRouter2(SwapRouter.address)).wait();

  await (await SmartVaultIndex.setVaultManager(SmartVaultManager.address)).wait();
  await (await EUROs.grantRole(await EUROs.DEFAULT_ADMIN_ROLE(), SmartVaultManager.address)).wait();

  const TST = await (await ethers.getContractFactory('ERC20Mock')).deploy('The Standard Token', 'TST', 18);
  const USDs = await (await ethers.getContractFactory('ERC20Mock')).deploy('The Standard Token', 'USDs', 6);

  await (await EUROs.mint(user.address, ethers.utils.parseEther('1000'))).wait();
  await (await TST.mint(user.address, ethers.utils.parseEther('1000'))).wait();
  await (await USDs.mint(user.address, 1000000000)).wait();

  const CL_USD_USD = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USDs / USD');
  await CL_USD_USD.deployed();
  await (await CL_USD_USD.setPrice(USD_PRICE)).wait();

  await (await TokenManager.addAcceptedToken(USDs.address, CL_USD_USD.address)).wait();
  
  const LiquidationPoolManager = await (await ethers.getContractFactory('LiquidationPoolManager')).deploy(
    TST.address, EUROs.address, SmartVaultManager.address, CL_EUR_USD.address, protocol.address, 50000
  )
  await LiquidationPoolManager.deployed();
    
  const LiquidationPoolAddress = await LiquidationPoolManager.pool();
  await (await EUROs.grantRole(await EUROs.BURNER_ROLE(), LiquidationPoolAddress)).wait();
    
  await (await v5.setProtocolAddress(LiquidationPoolManager.address)).wait();
  await (await v5.setLiquidatorAddress(LiquidationPoolManager.address)).wait();
  
  console.log('================')
  console.log(`SmartVaultManager: ${SmartVaultManager.address}`);
  console.log(`LiquidationPoolManager: ${LiquidationPoolManager.address}`);
  console.log(`LiquidationPool: ${LiquidationPoolAddress}`);
  console.log('----------------')
  console.log(`TST: ${TST.address}`);
  console.log(`EUROs: ${EUROs.address}`);
  console.log(`USDs: ${USDs.address}`);
  console.log('----------------')
  console.log(`User ${user.address} has balance ${ethers.utils.formatEther(await ethers.provider.getBalance(user.address))} ETH`);
  console.log(`User ${user.address} minted with 1000 test TST`);
  console.log(`User ${user.address} minted with 1000 test EUROs`);
  console.log(`User ${user.address} minted with 1000 test USDs`);
  console.log('================')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

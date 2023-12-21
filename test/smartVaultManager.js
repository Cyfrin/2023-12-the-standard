const { expect } = require('chai');
const { ethers } = require('hardhat');
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { BigNumber } = ethers;
const { DEFAULT_ETH_USD_PRICE, DEFAULT_EUR_USD_PRICE, DEFAULT_COLLATERAL_RATE, PROTOCOL_FEE_RATE, ETH, getNFTMetadataContract, fullyUpgradedSmartVaultManager, WETH_ADDRESS } = require('./common');

let VaultManager, TokenManager, EUROs, Tether, ClEthUsd, ClEurUsd, ClUsdUsd, NFTMetadataGenerator,
SwapRouterMock, SmartVaultDeployer, admin, user, protocol, liquidator, otherUser, LiquidationPoolManager;

describe('SmartVaultManager', async () => {
  beforeEach(async () => {
    [ admin, user, protocol, liquidator, otherUser, LiquidationPoolManager ] = await ethers.getSigners();
    ClEthUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('ETH / USD');
    await ClEthUsd.setPrice(DEFAULT_ETH_USD_PRICE);
    ClEurUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('EUR / USD');
    await ClEurUsd.setPrice(DEFAULT_EUR_USD_PRICE);
    ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USD / USD');
    await ClUsdUsd.setPrice(100000000);
    TokenManager = await (await ethers.getContractFactory('TokenManagerMock')).deploy(ETH, ClEthUsd.address);
    EUROs = await (await ethers.getContractFactory('EUROsMock')).deploy();
    Tether = await (await ethers.getContractFactory('ERC20Mock')).deploy('Tether', 'USDT', 6);
    SmartVaultDeployer = await (await ethers.getContractFactory('SmartVaultDeployerV3')).deploy(ETH, ClEurUsd.address);
    const SmartVaultIndex = await (await ethers.getContractFactory('SmartVaultIndex')).deploy();
    SwapRouterMock = await (await ethers.getContractFactory('SwapRouterMock')).deploy();
    NFTMetadataGenerator = await (await getNFTMetadataContract()).deploy();
    VaultManager = await fullyUpgradedSmartVaultManager(
      DEFAULT_COLLATERAL_RATE, PROTOCOL_FEE_RATE, EUROs.address, protocol.address,
      liquidator.address, TokenManager.address, SmartVaultDeployer.address,
      SmartVaultIndex.address, NFTMetadataGenerator.address, WETH_ADDRESS,
      SwapRouterMock.address
    );
    await SmartVaultIndex.setVaultManager(VaultManager.address);
    await EUROs.grantRole(await EUROs.DEFAULT_ADMIN_ROLE(), VaultManager.address);
  });

  describe('setting admin data', async () => {
    it('allows owner to admin data', async () => {
      expect(await VaultManager.mintFeeRate()).to.equal(PROTOCOL_FEE_RATE);
      expect(await VaultManager.burnFeeRate()).to.equal(PROTOCOL_FEE_RATE);
      expect(await VaultManager.swapFeeRate()).to.equal(PROTOCOL_FEE_RATE);
      expect(await VaultManager.nftMetadataGenerator()).to.equal(NFTMetadataGenerator.address);
      expect(await VaultManager.swapRouter2()).to.equal(SwapRouterMock.address);
      expect(await VaultManager.weth()).to.equal(WETH_ADDRESS);
      expect(await VaultManager.smartVaultDeployer()).to.equal(SmartVaultDeployer.address);

      const newMintFeeRate = 2000;
      const newBurnFeeRate = 3000;
      const newSwapFeeRate = 4000;
      const newGenerator = await (await getNFTMetadataContract()).deploy();
      const newSwapRouter = await (await ethers.getContractFactory('SwapRouterMock')).deploy();
      const newWeth = await (await ethers.getContractFactory('ERC20Mock')).deploy('Wrapped Ether', 'WETH', 18);
      const deployerV3 = await (await ethers.getContractFactory('SmartVaultDeployerV3')).deploy(ETH, ClEurUsd.address);
      await expect(VaultManager.connect(user).setMintFeeRate(newMintFeeRate)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setBurnFeeRate(newBurnFeeRate)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setSwapFeeRate(newSwapFeeRate)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setNFTMetadataGenerator(newGenerator.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setSwapRouter2(newSwapRouter.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setWethAddress(newWeth.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setSmartVaultDeployer(deployerV3.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setProtocolAddress(LiquidationPoolManager.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(VaultManager.connect(user).setLiquidatorAddress(LiquidationPoolManager.address)).to.be.revertedWith('Ownable: caller is not the owner');

      await expect(VaultManager.setMintFeeRate(newMintFeeRate)).not.to.be.reverted;
      await expect(VaultManager.setBurnFeeRate(newBurnFeeRate)).not.to.be.reverted;
      await expect(VaultManager.setSwapFeeRate(newSwapFeeRate)).not.to.be.reverted;
      await expect(VaultManager.setNFTMetadataGenerator(newGenerator.address)).not.to.be.reverted;
      await expect(VaultManager.setSwapRouter2(newSwapRouter.address)).not.to.be.reverted;
      await expect(VaultManager.setWethAddress(newWeth.address)).not.to.be.reverted;
      await expect(VaultManager.setSmartVaultDeployer(deployerV3.address)).not.to.be.reverted;
      await expect(VaultManager.setProtocolAddress(LiquidationPoolManager.address)).not.to.be.reverted;
      await expect(VaultManager.setLiquidatorAddress(LiquidationPoolManager.address)).not.to.be.reverted;

      expect(await VaultManager.mintFeeRate()).to.equal(newMintFeeRate);
      expect(await VaultManager.burnFeeRate()).to.equal(newBurnFeeRate);
      expect(await VaultManager.swapFeeRate()).to.equal(newSwapFeeRate);
      expect(await VaultManager.nftMetadataGenerator()).to.equal(newGenerator.address);
      expect(await VaultManager.swapRouter()).to.equal(ethers.constants.AddressZero);
      expect(await VaultManager.swapRouter2()).to.equal(newSwapRouter.address);
      expect(await VaultManager.weth()).to.equal(newWeth.address);
      expect(await VaultManager.smartVaultDeployer()).to.equal(deployerV3.address);
      expect(await VaultManager.protocol()).to.equal(LiquidationPoolManager.address);
      expect(await VaultManager.liquidator()).to.equal(LiquidationPoolManager.address);
    });
  });

  describe('opening', async () => {
    it('opens a vault with no collateral deposited, no tokens minted, given collateral %', async () => {
      const mint = VaultManager.connect(user).mint();
      await expect(mint).to.emit(VaultManager, 'VaultDeployed').withArgs(anyValue, user.address, EUROs.address, 1);
      expect(await VaultManager.totalSupply()).to.equal(1);
      
      const vaults = await VaultManager.connect(user).vaults();
      expect(vaults).to.be.length(1);
      const totalCollateral = vaults[0].status.collateral.reduce((a, b) => a.add(b.amount), BigNumber.from(0));
      expect(totalCollateral).to.equal(0);
      expect(vaults[0].status.minted).to.equal(0);
      expect(vaults[0].status.maxMintable).to.equal(0);
      expect(vaults[0].status.totalCollateralValue).to.equal(0);
      expect(vaults[0].collateralRate).to.equal(DEFAULT_COLLATERAL_RATE);
      expect(vaults[0].mintFeeRate).to.equal(PROTOCOL_FEE_RATE);
      expect(vaults[0].burnFeeRate).to.equal(PROTOCOL_FEE_RATE);
    });
  });

  context('open vault', async () => {
    let tokenId, vaultAddress, otherTokenId, otherVaultAddress;
    beforeEach(async () => {
      await VaultManager.connect(user).mint();
      await VaultManager.connect(user).mint();
      await VaultManager.connect(otherUser).mint();
      ({ tokenId, status } = (await VaultManager.connect(user).vaults())[0]);
      ({ vaultAddress } = status);
      const otherVault = (await VaultManager.connect(otherUser).vaults())[0];
      otherTokenId = otherVault.tokenId;
      otherVaultAddress = otherVault.vaultAddress;
    });

    describe('liquidation', async () => {
      it('liquidates all undercollateralised vaults', async () => {
        const protocolETHBalance = await protocol.getBalance();
        const protocolUSDTBalance = await Tether.balanceOf(protocol.address);
        await TokenManager.addAcceptedToken(Tether.address, ClUsdUsd.address);
        const tetherValue = 1000000000;
        const ethValue = ethers.utils.parseEther('1');
        await Tether.mint(vaultAddress, tetherValue);
        await user.sendTransaction({to: vaultAddress, value: ethValue});
        
        const { maxMintable } = (await VaultManager.connect(user).vaults())[0].status;
        const mintValue = maxMintable.mul(99).div(100);
        
        const vault = await ethers.getContractAt('SmartVaultV3', vaultAddress);
        await vault.connect(user).mint(user.address, mintValue)

        let liquidate = VaultManager.connect(admin).liquidateVault(1);
        await expect(liquidate).to.be.revertedWith('err-invalid-liquidator');

        // shouldn't liquidate any vaults, as both are sufficiently collateralised, should revert so no gas fees paid
        liquidate = VaultManager.connect(liquidator).liquidateVault(1);
        await expect(liquidate).to.be.revertedWith('vault-not-undercollateralised');
        liquidate = VaultManager.connect(liquidator).liquidateVault(2);
        await expect(liquidate).to.be.revertedWith('vault-not-undercollateralised');

        // drop price of eth to $1000, first vault becomes undercollateralised
        await ClEthUsd.setPrice(100000000000);

        
        liquidate = VaultManager.connect(liquidator).liquidateVault(2);
        await expect(liquidate).to.be.revertedWith('vault-not-undercollateralised');
        // first user's vault should be liquidated
        liquidate = VaultManager.connect(liquidator).liquidateVault(1);
        await expect(liquidate).not.to.be.reverted;
        await expect(liquidate).to.emit(VaultManager, 'VaultLiquidated').withArgs(vaultAddress);
        const userVaults = await VaultManager.connect(user).vaults();
        const otherUserVaults = await VaultManager.connect(otherUser).vaults();
        expect(userVaults[0].status.liquidated).to.equal(true);
        expect(otherUserVaults[0].status.liquidated).to.equal(false);
        expect(userVaults[0].status.minted).to.equal(0);
        expect(userVaults[0].status.maxMintable).to.equal(0);
        expect(userVaults[0].status.totalCollateralValue).to.equal(0);
        userVaults[0].status.collateral.forEach(asset => {
          expect(asset.amount).to.equal(0);
        });
        expect(await Tether.balanceOf(protocol.address)).to.equal(protocolUSDTBalance.add(tetherValue));
        expect(await protocol.getBalance()).to.equal(protocolETHBalance.add(ethValue));
      });
    });

    describe('transfer', async () => {
      it('should update all the ownership data properly', async () => {
        let userVaults = await VaultManager.connect(user).vaults();
        expect(userVaults).to.have.length(2);
        let otherUserVaults = await VaultManager.connect(otherUser).vaults();
        expect(otherUserVaults).to.have.length(1);
        const vault = await ethers.getContractAt('SmartVaultV3', vaultAddress);
        expect(await vault.owner()).to.equal(user.address);

        const transfer = VaultManager.connect(user).transferFrom(user.address, otherUser.address, tokenId);
        await expect(transfer).to.emit(VaultManager, 'VaultTransferred').withArgs(tokenId, user.address, otherUser.address);

        expect(await VaultManager.ownerOf(tokenId)).to.equal(otherUser.address);

        userVaults = await VaultManager.connect(user).vaults();
        expect(userVaults).to.have.length(1);
        otherUserVaults = await VaultManager.connect(otherUser).vaults();
        expect(otherUserVaults).to.have.length(2);
        expect(otherUserVaults.map(v => v.tokenId.toString())).to.include(tokenId.toString());
        
        expect(await vault.owner()).to.equal(otherUser.address);
      });
    });

    describe('nft metadata', async () => {
      it('produces dynamic nft metadata', async () => {
        // json data url, should have "json" and "data" and "base64" in there
        const metadataJSON = await VaultManager.tokenURI(1);
        expect(metadataJSON).to.have.string('application/json');
        expect(metadataJSON).to.have.string('data');
        expect(metadataJSON).to.have.string('base64');
      });
    });
  });
});
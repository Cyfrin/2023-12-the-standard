const { ethers } = require('hardhat');
const { BigNumber } = ethers;
const { expect } = require('chai');
const { DEFAULT_ETH_USD_PRICE, DEFAULT_EUR_USD_PRICE, DEFAULT_COLLATERAL_RATE, PROTOCOL_FEE_RATE, getCollateralOf, ETH, getNFTMetadataContract, fullyUpgradedSmartVaultManager } = require('./common');
const { HUNDRED_PC } = require('./common');

let VaultManager, Vault, TokenManager, ClEthUsd, EUROs, SwapRouterMock, MockWeth, admin, user, otherUser, protocol;

describe('SmartVault', async () => {
  beforeEach(async () => {
    [ admin, user, otherUser, protocol ] = await ethers.getSigners();
    ClEthUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('ETH / USD');
    await ClEthUsd.setPrice(DEFAULT_ETH_USD_PRICE);
    const ClEurUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('EUR / USD');
    await ClEurUsd.setPrice(DEFAULT_EUR_USD_PRICE);
    EUROs = await (await ethers.getContractFactory('EUROsMock')).deploy();
    TokenManager = await (await ethers.getContractFactory('TokenManagerMock')).deploy(ETH, ClEthUsd.address);
    const SmartVaultDeployer = await (await ethers.getContractFactory('SmartVaultDeployerV3')).deploy(ETH, ClEurUsd.address);
    const SmartVaultIndex = await (await ethers.getContractFactory('SmartVaultIndex')).deploy();
    const NFTMetadataGenerator = await (await getNFTMetadataContract()).deploy();
    SwapRouterMock = await (await ethers.getContractFactory('SwapRouterMock')).deploy();
    MockWeth = await (await ethers.getContractFactory('WETHMock')).deploy();
    VaultManager = await fullyUpgradedSmartVaultManager(
      DEFAULT_COLLATERAL_RATE, PROTOCOL_FEE_RATE, EUROs.address, protocol.address, 
      protocol.address, TokenManager.address, SmartVaultDeployer.address,
      SmartVaultIndex.address, NFTMetadataGenerator.address, MockWeth.address,
      SwapRouterMock.address
    );
    await SmartVaultIndex.setVaultManager(VaultManager.address);
    await EUROs.grantRole(await EUROs.DEFAULT_ADMIN_ROLE(), VaultManager.address);
    await VaultManager.connect(user).mint();
    const { status } = (await VaultManager.connect(user).vaults())[0];
    const { vaultAddress } = status;
    Vault = await ethers.getContractAt('SmartVaultV3', vaultAddress);
  });

  describe('ownership', async () => {
    it('will not allow setting of new owner if not manager', async () => {
      const ownerUpdate = Vault.connect(user).setOwner(otherUser.address);
      await expect(ownerUpdate).to.be.revertedWith('err-invalid-user');
    });
  });

  describe('adding collateral', async () => {
    it('accepts native currency as collateral', async () => {
      const value = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value});

      const { collateral, maxMintable, totalCollateralValue } = await Vault.status();
      const collateralETH = getCollateralOf('ETH', collateral)
      expect(collateralETH.amount).to.equal(value);
      const euroCollateral = value.mul(DEFAULT_ETH_USD_PRICE).div(DEFAULT_EUR_USD_PRICE);
      expect(collateralETH.collateralValue).to.equal(euroCollateral);
      expect(totalCollateralValue).to.equal(euroCollateral);
      expect(totalCollateralValue).to.equal(euroCollateral);
      const maximumMint = euroCollateral.mul(HUNDRED_PC).div(DEFAULT_COLLATERAL_RATE);
      expect(maxMintable).to.equal(maximumMint);
    });

    it('accepts certain 6 decimal ERC20s as collateral', async () => {
      const Tether = await (await ethers.getContractFactory('ERC20Mock')).deploy('Tether', 'USDT', 6);
      const clUsdUsdPrice = 100000000;
      const ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USD / USD');
      await ClUsdUsd.setPrice(clUsdUsdPrice);
      await TokenManager.addAcceptedToken(Tether.address, ClUsdUsd.address);
      // mint user 100 USDT
      const value = BigNumber.from(100000000);
      await Tether.mint(user.address, value);

      await Tether.connect(user).transfer(Vault.address, value);

      const { collateral, maxMintable, totalCollateralValue } = await Vault.status();
      const collateralETH = getCollateralOf('USDT', collateral)
      expect(collateralETH.amount).to.equal(value);
      // scale up power of twelve because usdt is 6 dec
      const euroCollateral = value.mul(BigNumber.from(10).pow(12)).mul(clUsdUsdPrice).div(DEFAULT_EUR_USD_PRICE);
      expect(collateralETH.collateralValue).to.equal(euroCollateral);
      expect(totalCollateralValue).to.equal(euroCollateral);
      const maximumMint = euroCollateral.mul(HUNDRED_PC).div(DEFAULT_COLLATERAL_RATE);
      expect(maxMintable).to.equal(maximumMint);
    });

    it('accepts certain 18 decimal ERC20s as collateral', async () => {
      const Dai = await (await ethers.getContractFactory('ERC20Mock')).deploy('Dai Stablecoin', 'DAI', 18);
      const clUsdUsdPrice = 100000000;
      const ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USD / USD');
      await ClUsdUsd.setPrice(clUsdUsdPrice);
      await TokenManager.addAcceptedToken(Dai.address, ClUsdUsd.address);
      // mint user 100 DAI
      const value = ethers.utils.parseEther('100');
      await Dai.mint(user.address, value);

      await Dai.connect(user).transfer(Vault.address, value);

      const { collateral, maxMintable, totalCollateralValue } = await Vault.status();
      expect(getCollateralOf('DAI', collateral).amount).to.equal(value);
      // scale up power of twelve because usdt is 6 dec
      const euroCollateral = value.mul(clUsdUsdPrice).div(DEFAULT_EUR_USD_PRICE);
      expect(totalCollateralValue).to.equal(euroCollateral);
      const maximumMint = euroCollateral.mul(HUNDRED_PC).div(DEFAULT_COLLATERAL_RATE);
      expect(maxMintable).to.equal(maximumMint);
    });
  });

  describe('removing collateral', async () => {
    it('allows removal of native currency if owner and it will not undercollateralise vault', async () => {
      const value = ethers.utils.parseEther('1');
      const half = value.div(2);
      await user.sendTransaction({to: Vault.address, value});

      let { collateral, maxMintable } = await Vault.status();
      expect(getCollateralOf('ETH', collateral).amount).to.equal(value);

      let remove = Vault.connect(otherUser).removeCollateralNative(value, user.address);
      await expect(remove).to.be.revertedWith('err-invalid-user');

      remove = Vault.connect(user).removeCollateralNative(half, user.address);
      await expect(remove).not.to.be.reverted;
      await expect(remove).to.emit(Vault, 'CollateralRemoved').withArgs(ETH, half, user.address);
      ({ collateral, maxMintable } = await Vault.status());
      expect(getCollateralOf('ETH', collateral).amount).to.equal(half);

      // mint max euros
      const mintingFee = maxMintable.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      await Vault.connect(user).mint(user.address, maxMintable.sub(mintingFee));

      // cannot remove any eth
      remove = Vault.connect(user).removeCollateralNative(ethers.utils.parseEther('0.0001'), user.address);
      await expect(remove).to.be.revertedWith('err-under-coll');
    });

    it('allows removal of ERC20 if owner and it will not undercollateralise vault', async () => {
      const Tether = await (await ethers.getContractFactory('ERC20Mock')).deploy('Tether', 'USDT', 6);
      const USDTBytes = ethers.utils.formatBytes32String('USDT');
      const clUsdUsdPrice = 100000000;
      const ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USD / USD');
      await ClUsdUsd.setPrice(clUsdUsdPrice);
      await TokenManager.addAcceptedToken(Tether.address, ClUsdUsd.address);

      // 1000 USDT
      const value = 1000000000;
      const half = value / 2;
      await Tether.mint(Vault.address, value);

      let { collateral, maxMintable } = await Vault.status();
      expect(getCollateralOf('USDT', collateral).amount).to.equal(value);

      let remove = Vault.connect(otherUser).removeCollateral(USDTBytes, value, user.address);
      await expect(remove).to.be.revertedWith('err-invalid-user');

      remove = Vault.connect(user).removeCollateral(USDTBytes, half, user.address);
      await expect(remove).not.to.be.reverted;
      await expect(remove).to.emit(Vault, 'CollateralRemoved').withArgs(USDTBytes, half, user.address);
      ({ collateral, maxMintable } = await Vault.status());
      expect(getCollateralOf('USDT', collateral).amount).to.equal(half);

      // mint max euros
      const mintingFee = maxMintable.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      await Vault.connect(user).mint(user.address, maxMintable.sub(mintingFee));

      // cannot remove any eth
      remove = Vault.connect(user).removeCollateral(ethers.utils.formatBytes32String('USDT'), 1000000, user.address);
      await expect(remove).to.be.revertedWith('err-under-coll');
    });

    it('allows removal of ERC20s that are or are not valid collateral, if not undercollateralising', async () => {
      const SUSD6 = await (await ethers.getContractFactory('ERC20Mock')).deploy('sUSD6', 'SUSD6', 6);
      const SUSD18 = await (await ethers.getContractFactory('ERC20Mock')).deploy('sUSD18', 'SUSD18', 18);
      const ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('USD / USD');
      await ClUsdUsd.setPrice(100000000)
      await TokenManager.addAcceptedToken(SUSD18.address, ClUsdUsd.address);
      const SUSD6value = 1000000000;
      const SUSD18value = ethers.utils.parseEther('1000');

      await expect(Vault.connect(user).removeAsset(SUSD6.address, SUSD6value, user.address)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
      
      await SUSD6.mint(Vault.address, SUSD6value);
      await SUSD18.mint(Vault.address, SUSD18value);
      
      let { collateral, maxMintable } = await Vault.status();
      expect(getCollateralOf('SUSD6', collateral)).to.be.undefined;
      expect(getCollateralOf('SUSD18', collateral).amount).to.equal(SUSD18value);
      
      await Vault.connect(user).mint(user.address, maxMintable.div(2));

      await expect(Vault.removeAsset(SUSD6.address, SUSD6value, user.address)).to.be.revertedWith('err-invalid-user');
      
      await Vault.connect(user).removeAsset(SUSD6.address, SUSD6value, user.address);
      expect(await SUSD6.balanceOf(Vault.address)).to.equal(0);
      expect(await SUSD6.balanceOf(user.address)).to.equal(SUSD6value);
      
      await expect(Vault.connect(user).removeAsset(SUSD18.address, SUSD18value, user.address)).to.be.revertedWith('err-under-coll');

      // partial removal, because some needed as collateral
      const part = SUSD18value.div(3);
      const remove = Vault.connect(user).removeAsset(SUSD18.address, part, user.address);
      await expect(remove).not.to.be.reverted;
      await expect(remove).to.emit(Vault, 'AssetRemoved').withArgs(SUSD18.address, part, user.address);
      expect(await SUSD18.balanceOf(Vault.address)).to.equal(SUSD18value.sub(part));
      expect(await SUSD18.balanceOf(user.address)).to.equal(part);
    })
  });

  describe('minting', async () => {
    it('only allows the vault owner to mint from smart vault directly', async () => {
      const mintedValue = ethers.utils.parseEther('100');
      await expect(Vault.connect(user).mint(user.address, mintedValue)).to.be.revertedWith('err-under-coll');

      const collateral = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value: collateral});
      
      let mint = Vault.connect(otherUser).mint(user.address, mintedValue);
      await expect(mint).to.be.revertedWith('err-invalid-user');

      mint = Vault.connect(user).mint(user.address, mintedValue);
      await expect(mint).not.to.be.reverted;
      const { minted } = await Vault.status();
      const fee = mintedValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC)
      await expect(mint).emit(Vault, 'EUROsMinted').withArgs(user.address, mintedValue, fee);

      expect(minted).to.equal(mintedValue.add(fee));
      expect(await EUROs.balanceOf(user.address)).to.equal(mintedValue);
      expect(await EUROs.balanceOf(protocol.address)).to.equal(fee);
    });
  });

  describe('burning', async () => {
    it('allows burning of EUROs if there is a minted amount, charges a fee', async () => {
      const collateral = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value: collateral});

      const burnedValue = ethers.utils.parseEther('50');
      let burn = Vault.connect(user).burn(burnedValue);
      await expect(burn).to.be.revertedWith('err-insuff-minted');

      // 100 to user
      // 1 to protocol
      // 101 minted in vault
      const mintedValue = ethers.utils.parseEther('100');
      await Vault.connect(user).mint(user.address, mintedValue);

      burn = Vault.connect(user).burn(burnedValue);
      await expect(burn).to.be.revertedWith('ERC20: insufficient allowance');

      const mintingFee = mintedValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      const burningFee = burnedValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);

      // must allow transfer to protocol
      await EUROs.connect(user).approve(Vault.address, burningFee);
      // user pays back 50 to vault
      // .5 given to protocol
      // 51 minted in vault
      burn = Vault.connect(user).burn(burnedValue);
      await expect(burn).not.to.be.reverted;
      await expect(burn).to.emit(Vault, 'EUROsBurned').withArgs(burnedValue, burningFee);

      minted = (await Vault.status()).minted;
      expect(minted).to.equal(mintedValue.add(mintingFee).sub(burnedValue));

      const fees = mintingFee.add(burningFee);
      expect(await EUROs.balanceOf(user.address)).to.equal(minted.sub(fees));
      expect(await EUROs.balanceOf(protocol.address)).to.equal(fees);
    });
  });

  describe('liquidation', async () => {
    it('indicates whether vault is undercollateralised in current state', async () => {
      expect(await Vault.undercollateralised()).to.equal(false);

      const collateral = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value: collateral});
      expect(await Vault.undercollateralised()).to.equal(false);

      const mintedValue = ethers.utils.parseEther('900');
      await Vault.connect(user).mint(user.address, mintedValue);
      expect(await Vault.undercollateralised()).to.equal(false);

      // eth / usd price drops to $1000
      await ClEthUsd.setPrice(100000000000);
      expect(await Vault.undercollateralised()).to.equal(true);
    });

    it('allows manager to liquidate vault, if undercollateralised', async () => {
      const ethValue = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value: ethValue});

      const mintedValue = ethers.utils.parseEther('900');
      await Vault.connect(user).mint(user.address, mintedValue);

      await expect(VaultManager.connect(protocol).liquidateVault(1)).to.be.revertedWith('vault-not-undercollateralised');
      
      // drop price, now vault is liquidatable
      await ClEthUsd.setPrice(100000000000);

      await expect(Vault.liquidate()).to.be.revertedWith('err-invalid-user');

      await expect(VaultManager.connect(protocol).liquidateVault(1)).not.to.be.reverted;
      const { minted, maxMintable, totalCollateralValue, collateral, liquidated } = await Vault.status();
      expect(minted).to.equal(0);
      expect(maxMintable).to.equal(0);
      expect(totalCollateralValue).to.equal(0);
      collateral.forEach(asset => expect(asset.amount).to.equal(0));
      expect(liquidated).to.equal(true);
    });

    it('will not allow minting of EUROs if liquidated', async () => {
      const ethValue = ethers.utils.parseEther('1');
      await user.sendTransaction({to: Vault.address, value: ethValue});

      const mintedValue = ethers.utils.parseEther('900');
      await Vault.connect(user).mint(user.address, mintedValue);
      
      // drop price, now vault is liquidatable
      await ClEthUsd.setPrice(100000000000);

      await VaultManager.connect(protocol).liquidateVault(1);
      const { liquidated } = await Vault.status();
      expect(liquidated).to.equal(true);

      await user.sendTransaction({to: Vault.address, value: ethValue.mul(2)});
      await expect(Vault.connect(user).mint(user.address, mintedValue)).to.be.revertedWith('err-liquidated');
    });
  });

  describe('swaps', async () => {
    let Stablecoin;

    beforeEach(async () => {
      Stablecoin = await (await ethers.getContractFactory('ERC20Mock')).deploy('sUSD', 'sUSD', 6);
      const clUsdUsdPrice = 100000000;
      const ClUsdUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('sUSD / USD');
      await ClUsdUsd.setPrice(clUsdUsdPrice);
      await TokenManager.addAcceptedToken(Stablecoin.address, ClUsdUsd.address);
    });

    it('only allows owner to perform swap', async () => {
      const inToken = ethers.utils.formatBytes32String('ETH');
      const outToken = ethers.utils.formatBytes32String('sUSD');
      const swapValue = ethers.utils.parseEther('0.5');
      const swap = Vault.connect(admin).swap(inToken, outToken, swapValue);

      await expect(swap).to.be.revertedWith('err-invalid-user');
    });

    it('invokes swaprouter with value for eth swap, paying fees to protocol', async () => {
      // user vault has 1 ETH collateral
      await user.sendTransaction({to: Vault.address, value: ethers.utils.parseEther('1')});
      // user borrows 1200 EUROs
      const borrowValue = ethers.utils.parseEther('1200');
      await Vault.connect(user).mint(user.address, borrowValue);
      const inToken = ethers.utils.formatBytes32String('ETH');
      const outToken = ethers.utils.formatBytes32String('sUSD');
      // user is swapping .5 ETH
      const swapValue = ethers.utils.parseEther('0.5');
      const swapFee = swapValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      // minimum collateral after swap must be €1200 (borrowed) + €6 (fee) * 1.2 (rate) = €1447.2
      // remaining collateral not swapped: .5 ETH * $1600 = $800 = $800 / 1.06 = €754.72
      // swap must receive at least €1320 - €754.72 = €692.48 = $734.032;
      const ethCollateralValue = swapValue.mul(DEFAULT_ETH_USD_PRICE).div(DEFAULT_EUR_USD_PRICE);
      const borrowFee = borrowValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      const minCollateralInUsd = borrowValue.add(borrowFee).mul(DEFAULT_COLLATERAL_RATE).div(HUNDRED_PC) // 110% of borrowed (with fee)
                                  .sub(ethCollateralValue) // some collateral will not be swapped
                                  .mul(DEFAULT_EUR_USD_PRICE).div(100000000) // convert to USD
                                  .div(BigNumber.from(10).pow(12)) // scale down because stablecoin is 6 dec
      const protocolBalance = await protocol.getBalance();
      const swap = await Vault.connect(user).swap(inToken, outToken, swapValue);
      const ts = (await ethers.provider.getBlock(swap.blockNumber)).timestamp;

      const {
        tokenIn, tokenOut, fee, recipient, deadline, amountIn, amountOutMinimum,
        sqrtPriceLimitX96, txValue
      } = await SwapRouterMock.receivedSwap();

      expect(tokenIn).to.equal(MockWeth.address);
      expect(tokenOut).to.equal(Stablecoin.address);
      expect(fee).to.equal(3000);
      expect(recipient).to.equal(Vault.address);
      expect(deadline).to.equal(ts);
      expect(amountIn).to.equal(swapValue.sub(swapFee));
      expect(amountOutMinimum).to.equal(minCollateralInUsd);
      expect(sqrtPriceLimitX96).to.equal(0);
      expect(txValue).to.equal(swapValue.sub(swapFee));
      expect(await protocol.getBalance()).to.equal(protocolBalance.add(swapFee));
    });

    it('amount out minimum is 0 if over collateral still', async () => {
      // user vault has 1 ETH collateral
      await user.sendTransaction({to: Vault.address, value: ethers.utils.parseEther('1')});
      // user borrows 500 EUROs
      const borrowValue = ethers.utils.parseEther('500');
      await Vault.connect(user).mint(user.address, borrowValue);
      const inToken = ethers.utils.formatBytes32String('ETH');
      const outToken = ethers.utils.formatBytes32String('sUSD');
      // user is swapping .5 ETH
      const swapValue = ethers.utils.parseEther('0.5');
      const swapFee = swapValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      // 1 ETH collateral = $1600 / 1.06 (eur / usd) = €1509.43
      // borrowed = 500 EUROs
      // required collateral = 120% of 500 = €600
      // .5 swap = 50% of 1509.43 = €754.72
      // even if swap returned 0 assets, vault would remain above €600 required collateral value
      // minimum swap therefore 0
      const protocolBalance = await protocol.getBalance();
      const swap = await Vault.connect(user).swap(inToken, outToken, swapValue);
      const ts = (await ethers.provider.getBlock(swap.blockNumber)).timestamp;

      const {
        tokenIn, tokenOut, fee, recipient, deadline, amountIn, amountOutMinimum,
        sqrtPriceLimitX96, txValue
      } = await SwapRouterMock.receivedSwap();

      expect(tokenIn).to.equal(MockWeth.address);
      expect(tokenOut).to.equal(Stablecoin.address);
      expect(fee).to.equal(3000);
      expect(recipient).to.equal(Vault.address);
      expect(deadline).to.equal(ts);
      expect(amountIn).to.equal(swapValue.sub(swapFee));
      expect(amountOutMinimum).to.equal(0);
      expect(sqrtPriceLimitX96).to.equal(0);
      expect(txValue).to.equal(swapValue.sub(swapFee));
      expect(await protocol.getBalance()).to.equal(protocolBalance.add(swapFee));
    });

    it('invokes swaprouter after creating approval for erc20, paying fees to protocol, converting all weth back to eth', async () => {
      await Stablecoin.mint(Vault.address, ethers.utils.parseEther('100'));
      const inToken = ethers.utils.formatBytes32String('sUSD');
      const outToken = ethers.utils.formatBytes32String('ETH');
      const swapValue = ethers.utils.parseEther('50');
      const swapFee = swapValue.mul(PROTOCOL_FEE_RATE).div(HUNDRED_PC);
      const actualSwap = swapValue.sub(swapFee);
      const swap = await Vault.connect(user).swap(inToken, outToken, swapValue);
      const ts = (await ethers.provider.getBlock(swap.blockNumber)).timestamp;

      expect(await Stablecoin.allowance(Vault.address, SwapRouterMock.address)).to.equal(actualSwap);
      const {
        tokenIn, tokenOut, fee, recipient, deadline, amountIn, amountOutMinimum,
        sqrtPriceLimitX96, txValue
      } = await SwapRouterMock.receivedSwap();
      expect(tokenIn).to.equal(Stablecoin.address);
      expect(tokenOut).to.equal(MockWeth.address);
      expect(fee).to.equal(3000);
      expect(recipient).to.equal(Vault.address);
      expect(deadline).to.equal(ts);
      expect(amountIn).to.equal(actualSwap);
      expect(amountOutMinimum).to.equal(0);
      expect(sqrtPriceLimitX96).to.equal(0);
      expect(txValue).to.equal(0);
      expect(await Stablecoin.balanceOf(protocol.address)).to.equal(swapFee);
    });
  });
});
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;
const { mockTokenManager, DEFAULT_COLLATERAL_RATE, TOKEN_ID, rewardAmountForAsset, DAY, fastForward, POOL_FEE_PERCENTAGE, DEFAULT_EUR_USD_PRICE } = require("./common");

describe('LiquidationPool', async () => {
  let user1, user2, user3, Protocol, LiquidationPoolManager, LiquidationPool, MockSmartVaultManager,
  ERC20MockFactory, TST, EUROs;

  beforeEach(async () => {
    [ user1, user2, user3, Protocol ] = await ethers.getSigners();
    ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    TST = await ERC20MockFactory.deploy('The Standard Token', 'TST', 18);
    EUROs = await (await ethers.getContractFactory('EUROsMock')).deploy();
    const EurUsd = await (await ethers.getContractFactory('ChainlinkMock')).deploy('EUR / USD');
    await EurUsd.setPrice(DEFAULT_EUR_USD_PRICE);
    const { TokenManager } = await mockTokenManager();
    MockSmartVaultManager = await (await ethers.getContractFactory('MockSmartVaultManager')).deploy(DEFAULT_COLLATERAL_RATE, TokenManager.address);
    LiquidationPoolManager = await (await ethers.getContractFactory('LiquidationPoolManager')).deploy(
      TST.address, EUROs.address, MockSmartVaultManager.address, EurUsd.address, Protocol.address, POOL_FEE_PERCENTAGE
    );
    LiquidationPool = await ethers.getContractAt('LiquidationPool', await LiquidationPoolManager.pool());
    await EUROs.grantRole(await EUROs.BURNER_ROLE(), LiquidationPool.address)
  });
  
  afterEach(async () => {
    await network.provider.send("hardhat_reset")
  });

  describe('position', async () => {
    it('provides the position data for given user', async () => {
      const { _position } = await LiquidationPool.position(user1.address);

      expect(_position.TST).to.equal('0');
      expect(_position.EUROs).to.equal('0');
    });

    it('does not include unclaimed EUROs fees for non-holders', async () => {
      const fees = ethers.utils.parseEther('100');

      await EUROs.mint(LiquidationPoolManager.address, fees);

      const { _position } = await LiquidationPool.position(user1.address);
      expect(_position.TST).to.equal(0);
      expect(_position.EUROs).to.equal(0);
    });
  });

  describe('increase position', async () => {
    it('allows increasing position by one or both assets', async () => {
      const balance = ethers.utils.parseEther('5000');
      const tstVal = ethers.utils.parseEther('1000');
      const eurosVal = ethers.utils.parseEther('500');

      await TST.mint(user1.address, balance);
      await EUROs.mint(user1.address, balance);
      
      let increase = LiquidationPool.increasePosition(tstVal, eurosVal);
      await expect(increase).to.be.revertedWith('ERC20: insufficient allowance')

      let { _position} = await LiquidationPool.position(user1.address);
      expect(_position.TST).to.equal('0');
      expect(_position.EUROs).to.equal('0');

      await TST.approve(LiquidationPool.address, tstVal);
      await EUROs.approve(LiquidationPool.address, eurosVal);

      increase = LiquidationPool.increasePosition(tstVal, eurosVal);
      await expect(increase).not.to.be.reverted;

      ({_position} = await LiquidationPool.position(user1.address));
      expect(_position.TST).to.equal(tstVal);
      expect(_position.EUROs).to.equal(eurosVal);

      await TST.approve(LiquidationPool.address, tstVal);
      increase = LiquidationPool.increasePosition(tstVal, 0);
      await expect(increase).not.to.be.reverted;

      ({_position} = await LiquidationPool.position(user1.address));
      expect(_position.TST).to.equal(tstVal.mul(2));
      expect(_position.EUROs).to.equal(eurosVal);

      await EUROs.approve(LiquidationPool.address, eurosVal);
      increase = LiquidationPool.increasePosition(0, eurosVal);
      await expect(increase).not.to.be.reverted;
      
      ({_position} = await LiquidationPool.position(user1.address));
      expect(_position.TST).to.equal(tstVal.mul(2));
      expect(_position.EUROs).to.equal(eurosVal.mul(2));
    });

    it('triggers a distribution of fees before increasing position', async () => {
      let tstStakeValue = ethers.utils.parseEther('10000');
      await TST.mint(user1.address, tstStakeValue);
      await TST.connect(user1).approve(LiquidationPool.address, tstStakeValue);
      await LiquidationPool.connect(user1).increasePosition(tstStakeValue, 0);

      tstStakeValue = ethers.utils.parseEther('90000');
      await TST.mint(user2.address, tstStakeValue);
      await TST.connect(user2).approve(LiquidationPool.address, tstStakeValue);
      await LiquidationPool.connect(user2).increasePosition(tstStakeValue, 0);

      const fees = ethers.utils.parseEther('100');
      await EUROs.mint(LiquidationPoolManager.address, fees);

      tstStakeValue = ethers.utils.parseEther('100000');
      await TST.mint(user3.address, tstStakeValue);
      await TST.connect(user3).approve(LiquidationPool.address, tstStakeValue);
      await LiquidationPool.connect(user3).increasePosition(tstStakeValue, 0);

      // 50% of fees into pool, should receive 10% = 5% of 100 = 5;
      let { _position } = await LiquidationPool.position(user1.address);
      expect(_position.EUROs).to.equal(ethers.utils.parseEther('5'));

      // 50% of fees into pool, should receive 90% = 45% of 100 = 45;
      ({_position} = await LiquidationPool.position(user2.address));
      expect(_position.EUROs).to.equal(ethers.utils.parseEther('45'));

      // staking position after first round of fees already collected
      // should receive 0
      ({_position} = await LiquidationPool.position(user3.address));
      expect(_position.EUROs).to.equal(0);

      await EUROs.mint(LiquidationPoolManager.address, fees);

      tstStakeValue = ethers.utils.parseEther('100000');
      await TST.mint(user1.address, tstStakeValue);
      await TST.connect(user1).approve(LiquidationPool.address, tstStakeValue);
      await LiquidationPool.connect(user1).increasePosition(tstStakeValue, 0);

      // increased position after second round of fees collected
      // has 10000 staked in pool of 200000
      // should have 10% of first round + 5% of second round
      // = 5 + 2.5 = 7.5 EUROs
      ({_position} = await LiquidationPool.position(user1.address));
      expect(_position.EUROs).to.equal(ethers.utils.parseEther('7.5'));

      // received 90 EUROs in first round
      // now has 45% of pool (90000 from 200000)
      // 45 + 22.5 = 67.5 EUROs
      ({_position} = await LiquidationPool.position(user2.address));
      expect(_position.EUROs).to.equal(ethers.utils.parseEther('67.5'));

      // should receive 50% of second round of fees
      // = 25% of 100 = 25 EUROs
      ({_position} = await LiquidationPool.position(user3.address));
      expect(_position.EUROs).to.equal(ethers.utils.parseEther('25'));
    });
  });

  describe('decrease position', async () => {
    it('allows decreasing position by one or both assets', async () => {
      const balance = ethers.utils.parseEther('10000');
      await TST.mint(user1.address, balance);
      await EUROs.mint(user1.address, balance);

      await TST.approve(LiquidationPool.address, balance);
      await EUROs.approve(LiquidationPool.address, balance);

      await LiquidationPool.increasePosition(balance, balance);
      
      await fastForward(DAY);

      expect(await TST.balanceOf(user1.address)).to.equal(0);
      expect(await EUROs.balanceOf(user1.address)).to.equal(0);

      const decreaseValue = balance.div(2);
      await LiquidationPool.decreasePosition(decreaseValue, decreaseValue);

      let { _position } = await LiquidationPool.position(user1.address);
      expect(_position.TST).to.equal(balance.sub(decreaseValue));
      expect(_position.EUROs).to.equal(balance.sub(decreaseValue));

      expect(await TST.balanceOf(user1.address)).to.equal(decreaseValue);
      expect(await EUROs.balanceOf(user1.address)).to.equal(decreaseValue);

      await LiquidationPool.decreasePosition(decreaseValue, 0);

      ({ _position } = await LiquidationPool.position(user1.address));
      expect(_position.TST).to.equal(0);
      expect(_position.EUROs).to.equal(balance.sub(decreaseValue));

      expect(await TST.balanceOf(user1.address)).to.equal(balance);
      expect(await EUROs.balanceOf(user1.address)).to.equal(decreaseValue);

      await LiquidationPool.decreasePosition(0, decreaseValue);

      ({ _position } = await LiquidationPool.position(user1.address));
      expect(_position.TST).to.equal(0);
      expect(_position.EUROs).to.equal(0);

      expect(await TST.balanceOf(user1.address)).to.equal(balance);
      expect(await EUROs.balanceOf(user1.address)).to.equal(balance);
    });

    it('triggers a distribution of fees before decreasing position', async () => {
      const tstStake1 = ethers.utils.parseEther('100000');
      await TST.mint(user1.address, tstStake1);
      await TST.approve(LiquidationPool.address, tstStake1);
      await LiquidationPool.increasePosition(tstStake1, 0);

      const tstStake2 = ethers.utils.parseEther('700000');
      await TST.mint(user2.address, tstStake2);
      await TST.connect(user2).approve(LiquidationPool.address, tstStake2);
      await LiquidationPool.connect(user2).increasePosition(tstStake2, 0);

      const fees = ethers.utils.parseEther('20');
      await EUROs.mint(LiquidationPoolManager.address, fees);

      await fastForward(DAY);

      // user1 should receive 12.5% of 50% of fees when they decrease their position;
      const distributedFees1 = ethers.utils.parseEther('1.25');
      await LiquidationPool.decreasePosition(tstStake1, distributedFees1);
      expect(await TST.balanceOf(user1.address)).to.equal(tstStake1);
      expect(await EUROs.balanceOf(user1.address)).to.equal(distributedFees1);

      // user1 should receive 87.5% of 50% fees when another user decreased position;
      const distributedFees2 = ethers.utils.parseEther('8.75');
      expect(await TST.balanceOf(user2.address)).to.equal(0);
      expect(await EUROs.balanceOf(user2.address)).to.equal(0);
      const { _position } = await LiquidationPool.position(user2.address);
      expect(_position.TST).to.equal(tstStake2);
      expect(_position.EUROs).to.equal(distributedFees2);
    });

    it('does not allow decreasing beyond position value, even with assets in pool', async () => {
      const tstStake1 = ethers.utils.parseEther('10000');
      await TST.mint(user1.address, tstStake1);
      await TST.approve(LiquidationPool.address, tstStake1);
      await LiquidationPool.increasePosition(tstStake1, 0);

      const tstStake2 = ethers.utils.parseEther('20000');
      await TST.mint(user2.address, tstStake2);
      await TST.connect(user2).approve(LiquidationPool.address, tstStake2);
      await LiquidationPool.connect(user2).increasePosition(tstStake2, 0);

      // user1 can't take out 20000 with only 10000 of their own staked
      await expect(LiquidationPool.decreasePosition(tstStake2, 0)).to.be.revertedWith('invalid-decr-amount');

      const fees = ethers.utils.parseEther('500');
      await EUROs.mint(LiquidationPoolManager.address, fees);
      // user one cannot take full amount fees (only 33%)
      await expect(LiquidationPool.decreasePosition(0, fees)).to.be.revertedWith('invalid-decr-amount');
    });
  });

  describe('claim rewards', async () => {
    it('allows users to claim their accrued rewards', async () => {
      const ethCollateral = ethers.utils.parseEther('0.5');
      const wbtcCollateral = BigNumber.from(1_000_000);
      const usdcCollateral = BigNumber.from(500_000_000);
      // create some funds to be "liquidated"
      await user2.sendTransaction({to: MockSmartVaultManager.address, value: ethCollateral});
      await WBTC.mint(MockSmartVaultManager.address, wbtcCollateral);
      await USDC.mint(MockSmartVaultManager.address, usdcCollateral);

      let stakeValue = ethers.utils.parseEther('10000');
      await TST.mint(user1.address, stakeValue);
      await EUROs.mint(user1.address, stakeValue);
      await TST.connect(user1).approve(LiquidationPool.address, stakeValue);
      await EUROs.connect(user1).approve(LiquidationPool.address, stakeValue);
      await LiquidationPool.connect(user1).increasePosition(stakeValue, stakeValue);

      await fastForward(DAY);

      await LiquidationPoolManager.runLiquidation(TOKEN_ID);
      expect(await ethers.provider.getBalance(LiquidationPool.address)).to.equal(ethCollateral);
      expect(await WBTC.balanceOf(LiquidationPool.address)).to.equal(wbtcCollateral)
      expect(await USDC.balanceOf(LiquidationPool.address)).to.equal(usdcCollateral)

      let { _rewards } = await LiquidationPool.position(user1.address);
      expect(_rewards).to.have.length(3);
      expect(rewardAmountForAsset(_rewards, 'ETH')).to.equal(ethCollateral);
      expect(rewardAmountForAsset(_rewards, 'WBTC')).to.equal(wbtcCollateral);
      expect(rewardAmountForAsset(_rewards, 'USDC')).to.equal(usdcCollateral);

      await LiquidationPool.claimRewards();

      ({ _rewards } = await LiquidationPool.position(user1.address));
      expect(_rewards).to.have.length(3);
      expect(rewardAmountForAsset(_rewards, 'ETH')).to.equal(0);
      expect(rewardAmountForAsset(_rewards, 'WBTC')).to.equal(0);
      expect(rewardAmountForAsset(_rewards, 'USDC')).to.equal(0);
    });
  });
});
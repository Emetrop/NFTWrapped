import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  NFTWrapped,
  NFTWrappedLeaderboard,
  NFTWrappedBundle,
  // eslint-disable-next-line node/no-missing-import
} from "../typechain";

describe("NFTWrapped", () => {
  // accounts
  let owner: SignerWithAddress;
  let tester1: SignerWithAddress;
  let tester2: SignerWithAddress;

  let nftWrappedContract: NFTWrapped;
  let nftWrappedLeaderboardContract: NFTWrappedLeaderboard;
  let nftWrappedBundleContract: NFTWrappedBundle;

  beforeEach(async () => {
    [owner, tester1, tester2] = await ethers.getSigners();

    const NFTWrappedBundleContract = await ethers.getContractFactory(
      "NFTWrappedBundle"
    );
    nftWrappedBundleContract = await NFTWrappedBundleContract.deploy();

    const NFTWrappedContract = await ethers.getContractFactory("NFTWrapped");
    nftWrappedContract = await NFTWrappedContract.deploy(
      "https://storage.googleapis.com/nft-wrapped/nft/json/",
      nftWrappedBundleContract.address
    );
    await nftWrappedContract.deployed();

    const NFTWrappedLeaderboardContract = await ethers.getContractFactory(
      "NFTWrappedLeaderboard"
    );
    nftWrappedLeaderboardContract = await NFTWrappedLeaderboardContract.deploy(
      "https://storage.googleapis.com/nft-wrapped/leaderboard/json/",
      nftWrappedBundleContract.address
    );
    await nftWrappedLeaderboardContract.deployed();

    await nftWrappedBundleContract.setBundleContracts(
      nftWrappedContract.address,
      nftWrappedLeaderboardContract.address
    );
  });

  it("Should mint", async () => {
    expect(
      await nftWrappedContract.mint({ value: ethers.utils.parseEther("0.02") })
    )
      .to.emit(nftWrappedContract, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, 0);

    expect(await nftWrappedContract.ownerOf(1)).to.be.equal(owner.address);
  });

  it("Should mint as gift", async () => {
    expect(await nftWrappedContract.gift(tester2.address))
      .to.emit(nftWrappedContract, "Transfer")
      .withArgs(ethers.constants.AddressZero, tester2.address, 0);

    expect(await nftWrappedContract.ownerOf(1)).to.be.equal(tester2.address);
  });

  it("Should not allow to mint with low sent ETH value", async () => {
    expect(
      nftWrappedContract.mint({ value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Not enough ETH");
  });

  it("Should not allow to mint as bundle without bundle contract", async () => {
    expect(
      nftWrappedContract.connect(tester1).mintBundle(tester1.address)
    ).to.be.revertedWith("Only bundle contract");
  });

  it("Should return correct token uri", async () => {
    await nftWrappedContract.mint({ value: ethers.utils.parseEther("0.02") });

    expect(await nftWrappedContract.tokenURI(1)).to.be.equal(
      "https://storage.googleapis.com/nft-wrapped/nft/json/1.json"
    );
  });

  it("Should witdraw funds", async () => {
    expect(
      await waffle.provider.getBalance(nftWrappedContract.address)
    ).to.equal(0);

    await nftWrappedContract.mint({
      value: ethers.utils.parseEther("0.02"),
    });

    expect(
      await waffle.provider.getBalance(nftWrappedContract.address)
    ).to.equal(ethers.utils.parseEther("0.02"));

    const balanceBefore = await waffle.provider.getBalance(owner.address);

    await nftWrappedContract.withdraw();

    expect(
      await waffle.provider.getBalance(nftWrappedContract.address)
    ).to.equal(ethers.utils.parseEther("0"));

    expect(await waffle.provider.getBalance(owner.address)).closeTo(
      balanceBefore.add(ethers.utils.parseEther("0.02")),
      ethers.utils.parseEther("0.001")
    );
  });

  describe("NFTWrappedBundle", () => {
    it("Should revert when 1 contract in not correct", async () => {
      await nftWrappedBundleContract.setBundleContracts(
        nftWrappedContract.address,
        tester2.address
      );

      expect(
        nftWrappedBundleContract.mint({
          value: ethers.utils.parseEther("0.06"),
        })
      ).to.be.revertedWith("function call to a non-contract account");
    });

    it("Should mint as bundle", async () => {
      expect(
        await nftWrappedBundleContract.mint({
          value: ethers.utils.parseEther("0.06"),
        })
      )
        .to.emit(nftWrappedContract, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);

      expect(await nftWrappedContract.ownerOf(1)).to.be.equal(owner.address);
      expect(await nftWrappedLeaderboardContract.ownerOf(1)).to.be.equal(
        owner.address
      );
    });
  });
});

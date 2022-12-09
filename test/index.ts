import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  NFTWrapped,
  NFTWrappedLeaderboard,
  NFTWrappedBundle,
} from "../typechain";

describe("NFTWrapped", () => {
  // accounts
  let owner: SignerWithAddress;
  let tester1: SignerWithAddress;
  let tester2: SignerWithAddress;

  let nftWrappedContract: NFTWrapped;
  let nftWrappedLeaderboardContract: NFTWrappedLeaderboard;
  let nftWrappedBundleContract: NFTWrappedBundle;

  let merkleTree: MerkleTree;
  let leafNodes: string[] = [];

  beforeEach(async () => {
    [owner, tester1, tester2] = await ethers.getSigners();

    const whitelistedAddresses = [owner.address, tester1.address];

    const NFTWrappedBundleContract = await ethers.getContractFactory(
      "NFTWrappedBundle"
    );
    nftWrappedBundleContract = await NFTWrappedBundleContract.deploy();

    leafNodes = whitelistedAddresses.map(keccak256);
    merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });
    const merkleRoot = merkleTree.getRoot();

    const NFTWrappedContract = await ethers.getContractFactory("NFTWrapped");
    nftWrappedContract = await NFTWrappedContract.deploy(
      nftWrappedBundleContract.address,
      merkleRoot
    );
    await nftWrappedContract.deployed();

    const NFTWrappedLeaderboardContract = await ethers.getContractFactory(
      "NFTWrappedLeaderboard"
    );
    nftWrappedLeaderboardContract = await NFTWrappedLeaderboardContract.deploy(
      nftWrappedBundleContract.address,
      merkleRoot
    );
    await nftWrappedLeaderboardContract.deployed();

    await nftWrappedBundleContract.setBundleContracts(
      nftWrappedContract.address,
      nftWrappedLeaderboardContract.address
    );
  });

  it("Should finish presale", async () => {
    expect(await nftWrappedContract.isPresale()).to.be.true;

    expect(await nftWrappedContract.endPresale()).to.emit(
      nftWrappedContract,
      "PresaleEnded"
    );

    expect(await nftWrappedContract.isPresale()).to.be.false;
  });

  it("Should mint in main sale", async () => {
    await nftWrappedContract.endPresale();

    expect(
      await nftWrappedContract.mint({ value: ethers.utils.parseEther("0.02") })
    )
      .to.emit(nftWrappedContract, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, 0);

    expect(await nftWrappedContract.ownerOf(1)).to.be.equal(owner.address);
  });

  it("Should mint in presale", async () => {
    expect(
      await nftWrappedContract.mintPresale(
        merkleTree.getHexProof(leafNodes[0]),
        {
          value: ethers.utils.parseEther("0.02"),
        }
      )
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

  it("Should witdraw funds", async () => {
    expect(
      await waffle.provider.getBalance(nftWrappedContract.address)
    ).to.equal(0);

    await nftWrappedContract.mintPresale(merkleTree.getHexProof(leafNodes[0]), {
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
        nftWrappedBundleContract.mintPresale(
          merkleTree.getHexProof(leafNodes[0]),
          {
            value: ethers.utils.parseEther("0.06"),
          }
        )
      ).to.be.revertedWith("function call to a non-contract account");
    });

    it("Should mint as presale bundle", async () => {
      expect(
        await nftWrappedBundleContract.mintPresale(
          merkleTree.getHexProof(leafNodes[0]),
          {
            value: ethers.utils.parseEther("0.06"),
          }
        )
      )
        .to.emit(nftWrappedContract, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);

      expect(await nftWrappedContract.ownerOf(1)).to.be.equal(owner.address);
      expect(await nftWrappedLeaderboardContract.ownerOf(1)).to.be.equal(
        owner.address
      );
    });

    it("Should mint as mainsale bundle", async () => {
      await nftWrappedContract.endPresale();
      await nftWrappedLeaderboardContract.endPresale();

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

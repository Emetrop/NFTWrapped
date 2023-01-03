// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const NFTWrappedBundle = await ethers.getContractFactory("NFTWrappedBundle");
  const nftWrappedBundle = await NFTWrappedBundle.deploy();

  await nftWrappedBundle.deployed();

  console.log("NFTWrappedBundle deployed to:", nftWrappedBundle.address);

  const NFTWrapped = await ethers.getContractFactory("NFTWrapped");
  const nftWrapped = await NFTWrapped.deploy(
    "https://storage.googleapis.com/nft-wrapped/nft/json/",
    nftWrappedBundle.address
  );

  await nftWrapped.deployed();

  console.log("NFTWrapped deployed to:", nftWrapped.address);

  const NFTWrappedLeaderboard = await ethers.getContractFactory(
    "NFTWrappedLeaderboard"
  );
  const nftWrappedLeaderboard = await NFTWrappedLeaderboard.deploy(
    "https://storage.googleapis.com/nft-wrapped/leaderboard/json/",
    nftWrappedBundle.address
  );

  await nftWrappedLeaderboard.deployed();

  console.log(
    "NFTWrappedLeaderboard deployed to:",
    nftWrappedLeaderboard.address
  );

  await nftWrappedBundle.setBundleContracts(
    nftWrapped.address,
    nftWrappedLeaderboard.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

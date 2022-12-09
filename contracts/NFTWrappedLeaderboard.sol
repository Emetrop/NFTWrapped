// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*

 ░█▀█░█▀▀░▀█▀░░░█░█░█▀▄░█▀█░█▀█░█▀█░█▀▀░█▀▄░░░█░░░█▀▀░█▀█░█▀▄░█▀▀░█▀▄░█▀▄░█▀█░█▀█░█▀▄░█▀▄
 ░█░█░█▀▀░░█░░░░█▄█░█▀▄░█▀█░█▀▀░█▀▀░█▀▀░█░█░░░█░░░█▀▀░█▀█░█░█░█▀▀░█▀▄░█▀▄░█░█░█▀█░█▀▄░█░█
 ░▀░▀░▀░░░░▀░░░░▀░▀░▀░▀░▀░▀░▀░░░▀░░░▀▀▀░▀▀░░░░▀▀▀░▀▀▀░▀░▀░▀▀░░▀▀▀░▀░▀░▀▀░░▀▀▀░▀░▀░▀░▀░▀▀░

*/

import "./NFTWrappedAbstract.sol";

contract NFTWrappedLeaderboard is NFTWrappedAbstract {
    constructor(address bundleContract, bytes32 merkleRoot)
        NFTWrappedAbstract("NFTWrappedLeaderboard", "NFTWL", 0.05 ether, bundleContract, merkleRoot) {}
}
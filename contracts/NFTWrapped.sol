// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*

 ░█▀█░█▀▀░▀█▀░░░█░█░█▀▄░█▀█░█▀█░█▀█░█▀▀░█▀▄
 ░█░█░█▀▀░░█░░░░█▄█░█▀▄░█▀█░█▀▀░█▀▀░█▀▀░█░█
 ░▀░▀░▀░░░░▀░░░░▀░▀░▀░▀░▀░▀░▀░░░▀░░░▀▀▀░▀▀░

*/

import "./NFTWrappedAbstract.sol";

contract NFTWrapped is NFTWrappedAbstract {
    constructor(string memory baseURI, address bundleContract, bytes32 merkleRoot)
        NFTWrappedAbstract("NFTWrapped", "NFTW", 0.02 ether, baseURI, bundleContract, merkleRoot) {}
}
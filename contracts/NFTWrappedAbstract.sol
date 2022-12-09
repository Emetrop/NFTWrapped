// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./IMintableBundle.sol";

abstract contract NFTWrappedAbstract is ERC721, Ownable, IMintableBundle {
    uint256 public immutable PRICE;

    bool public isPresale = true;
    uint256 public tokenId = 0;
    bytes32 public merkleRoot;
    address public bundleContract;

    event PresaleEnded();

    constructor(string memory name, string memory symbol, uint256 _price, address _bundleContract, bytes32 _merkleRoot) ERC721(name, symbol) {
        merkleRoot = _merkleRoot;
        bundleContract = _bundleContract;
        PRICE = _price;
    }

    function mintPresale(bytes32[] calldata merkleProof) external payable {
        require(msg.value >= PRICE, "Not enough ETH");
        require(isPresale, "Presale not active");
        require(isAllowedToMint(msg.sender, merkleProof), "Not on whitelist");
        tokenId++;
        _safeMint(msg.sender, tokenId);
    }

    function mint() external payable {
        require(msg.value >= PRICE, "Not enough ETH");
        require(!isPresale, "Main sale not active");
        tokenId++;
        _safeMint(msg.sender, tokenId);
    }

    function mintPresaleBundle(address to, bytes32[] calldata merkleProof) external {
        require(msg.sender == bundleContract, "Only bundle contract");
        require(isPresale, "Presale not active");
        require(isAllowedToMint(to, merkleProof), "Not on whitelist");
        tokenId++;
        _safeMint(to, tokenId);
    }

    function mintBundle(address to) external {
        require(msg.sender == bundleContract, "Only bundle contract");
        require(!isPresale, "Main sale not active");
        tokenId++;
        _safeMint(to, tokenId);
    }

    function isAllowedToMint(address account, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    // Only owner

    function gift(address to) external onlyOwner {
        tokenId++;
        _safeMint(to, tokenId);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setBundleContract(address _bundleContract) external onlyOwner {
        bundleContract = _bundleContract;
    }

    function endPresale() external onlyOwner {
        require(isPresale, "Presale already ended");
        isPresale = false;
        emit PresaleEnded();
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
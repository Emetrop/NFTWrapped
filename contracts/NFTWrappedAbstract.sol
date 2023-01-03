// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./IMintableBundle.sol";

abstract contract NFTWrappedAbstract is ERC721, Ownable, IMintableBundle {
    using Strings for uint256;

    uint256 public immutable PRICE;

    bool public isPresale = true;
    bytes32 public merkleRoot;
    address public bundleContract;
    string public baseURI;

    uint256 private _tokenId = 0;

    event PresaleEnded();

    constructor(string memory name, string memory symbol, uint256 _price, string memory _baseURI, address _bundleContract, bytes32 _merkleRoot) ERC721(name, symbol) {
        merkleRoot = _merkleRoot;
        bundleContract = _bundleContract;
        baseURI = _baseURI;
        PRICE = _price;
    }

    function totalSupply() external returns (uint256) {
        return _tokenId;
    }

    function mintPresale(bytes32[] calldata merkleProof) external payable {
        require(msg.value >= PRICE, "Not enough ETH");
        require(isPresale, "Presale not active");
        require(isAllowedToMint(msg.sender, merkleProof), "Not on whitelist");
        _tokenId++;
        _safeMint(msg.sender, _tokenId);
    }

    function mint() external payable {
        require(msg.value >= PRICE, "Not enough ETH");
        require(!isPresale, "Main sale not active");
        _tokenId++;
        _safeMint(msg.sender, _tokenId);
    }

    function mintPresaleBundle(address to, bytes32[] calldata merkleProof) external {
        require(msg.sender == bundleContract, "Only bundle contract");
        require(isPresale, "Presale not active");
        require(isAllowedToMint(to, merkleProof), "Not on whitelist");
        _tokenId++;
        _safeMint(to, _tokenId);
    }

    function mintBundle(address to) external {
        require(msg.sender == bundleContract, "Only bundle contract");
        require(!isPresale, "Main sale not active");
        _tokenId++;
        _safeMint(to, _tokenId);
    }

    function isAllowedToMint(address account, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId));

        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // Only owner

    function gift(address to) external onlyOwner {
        _tokenId++;
        _safeMint(to, _tokenId);
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

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
}
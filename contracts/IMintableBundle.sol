// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IMintableBundle {
    function mintPresaleBundle(address to, bytes32[] calldata merkleProof) external;
    function mintBundle(address to) external;
}

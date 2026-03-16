// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title  IdentityAnchor
 * @notice Stores a tamper-evident mapping of userId → SHA-256(aadhaar_xml).
 *
 * How it works:
 *   1. After KYC passes, the Python backend calls anchorIdentity(userId, docHash).
 *   2. The hash is stored permanently on-chain. No one can change it.
 *   3. At audit time, call verifyIdentity(userId, hash) to prove the PostgreSQL
 *      record matches the on-chain commitment.
 *
 * Deploy once on your local Hardhat/Ganache node:
 *   cd blockchain
 *   npx hardhat run scripts/deploy.js --network localhost
 */
contract IdentityAnchor {

    // userId (PostgreSQL integer) → SHA-256 hash of the Aadhaar XML
    mapping(uint256 => bytes32) public identityRegistry;

    // Emitted every time an identity is anchored (visible in the block explorer)
    event IdentityAnchored(
        uint256 indexed userId,
        bytes32         docHash,
        uint256         timestamp
    );

    /**
     * @dev  Anchors a verified identity on-chain.
     *       Can be called multiple times — the latest hash overwrites.
     * @param userId   The user's integer ID from PostgreSQL.
     * @param docHash  SHA-256 hash of the Aadhaar XML as bytes32.
     */
    function anchorIdentity(uint256 userId, bytes32 docHash) external {
        identityRegistry[userId] = docHash;
        emit IdentityAnchored(userId, docHash, block.timestamp);
    }

    /**
     * @dev  Read-only verification — no gas cost when called via call().
     * @return True if the stored hash matches the claimed hash.
     */
    function verifyIdentity(uint256 userId, bytes32 claimedHash)
        external
        view
        returns (bool)
    {
        return identityRegistry[userId] == claimedHash;
    }

    /**
     * @dev  Returns the stored hash for a userId.
     *       bytes32(0) means the user has not been anchored yet.
     */
    function getIdentityHash(uint256 userId)
        external
        view
        returns (bytes32)
    {
        return identityRegistry[userId];
    }
}

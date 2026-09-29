// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title JevoPairingRegistry
 * @notice Immutable record registry for operator-approved pairings between stocks and meme tokens.
 * @dev Immutable transparency registry. Does not hold funds, handle tokens, or execute launches.
 */
contract JevoPairingRegistry {
    /// @notice Record representing an approved pairing.
    struct PairingRecord {
        bytes32 pairingId;
        string stockSymbol;
        string memeSymbol;
        uint16 scoreBps;
        uint256 timestamp;
    }

    /// @notice Address of the contract owner with recording rights.
    address public owner;

    /// @notice Total count of unique approved pairings recorded.
    uint256 public totalRecords;

    /// @dev Internal mapping from pairing ID to record.
    mapping(bytes32 => PairingRecord) private _records;

    /// @dev Internal mapping tracking if a pairing ID has been recorded.
    mapping(bytes32 => bool) private _isRecorded;

    /// @notice Emitted when a new approved pairing is recorded.
    event PairingRecorded(
        bytes32 indexed pairingId,
        string stockSymbol,
        string memeSymbol,
        uint16 scoreBps,
        uint256 timestamp
    );

    /// @notice Emitted when contract ownership is changed.
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @dev Thrown when caller is not the contract owner.
    error Unauthorized();

    /// @dev Thrown when attempting to record an already recorded pairing ID.
    error PairingAlreadyRecorded(bytes32 pairingId);

    /// @dev Thrown when scoreBps exceeds 10000 basis points (100%).
    error InvalidScoreBps(uint16 scoreBps);

    /// @dev Thrown when querying a pairing ID that does not exist.
    error PairingNotFound(bytes32 pairingId);

    /// @dev Thrown when transferring ownership to zero address.
    error ZeroAddress();

    /// @dev Restricts function access to the contract owner.
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Initializes the contract and sets deployer as initial owner.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Records an approved pairing on-chain.
     * @param pairingId Unique hash identifying the pairing.
     * @param stockSymbol Symbol of the referenced equity/stock.
     * @param memeSymbol Symbol of the paired meme token.
     * @param scoreBps Matching score in basis points (0 to 10000).
     */
    function recordApprovedPairing(
        bytes32 pairingId,
        string calldata stockSymbol,
        string calldata memeSymbol,
        uint16 scoreBps
    ) external onlyOwner {
        if (_isRecorded[pairingId]) {
            revert PairingAlreadyRecorded(pairingId);
        }
        if (scoreBps > 10000) {
            revert InvalidScoreBps(scoreBps);
        }

        uint256 currentTimestamp = block.timestamp;

        _isRecorded[pairingId] = true;
        _records[pairingId] = PairingRecord({
            pairingId: pairingId,
            stockSymbol: stockSymbol,
            memeSymbol: memeSymbol,
            scoreBps: scoreBps,
            timestamp: currentTimestamp
        });

        totalRecords++;

        emit PairingRecorded(
            pairingId,
            stockSymbol,
            memeSymbol,
            scoreBps,
            currentTimestamp
        );
    }

    /**
     * @notice Retrieves the stored record for a given pairing ID.
     * @param pairingId Unique hash of the pairing.
     * @return The stored PairingRecord struct.
     */
    function getRecord(bytes32 pairingId) external view returns (PairingRecord memory) {
        if (!_isRecorded[pairingId]) {
            revert PairingNotFound(pairingId);
        }
        return _records[pairingId];
    }

    /**
     * @notice Transfers ownership of the registry to a new address.
     * @param newOwner Address of the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert ZeroAddress();
        }
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}

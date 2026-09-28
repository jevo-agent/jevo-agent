// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {JevoPairingRegistry} from "../src/JevoPairingRegistry.sol";

contract JevoPairingRegistryTest is Test {
    JevoPairingRegistry internal registry;

    address internal owner;
    address internal alice;
    address internal bob;

    event PairingRecorded(
        bytes32 indexed pairingId,
        string stockSymbol,
        string memeSymbol,
        uint16 scoreBps,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        registry = new JevoPairingRegistry();
        vm.warp(1727500000);
    }

    /// (a) Owner record: event emitted with correct values, totalRecords incremented, getRecord returns data + timestamp
    function test_OwnerRecord_Success() public {
        bytes32 pairingId = keccak256("test-pairing-1");
        string memory stockSymbol = "NVDA";
        string memory memeSymbol = "$COMPUTE";
        uint16 scoreBps = 7500;
        uint256 expectedTimestamp = block.timestamp;

        assertEq(registry.totalRecords(), 0);

        vm.expectEmit(true, false, false, true);
        emit PairingRecorded(pairingId, stockSymbol, memeSymbol, scoreBps, expectedTimestamp);

        registry.recordApprovedPairing(pairingId, stockSymbol, memeSymbol, scoreBps);

        assertEq(registry.totalRecords(), 1);

        JevoPairingRegistry.PairingRecord memory record = registry.getRecord(pairingId);
        assertEq(record.pairingId, pairingId);
        assertEq(record.stockSymbol, stockSymbol);
        assertEq(record.memeSymbol, memeSymbol);
        assertEq(record.scoreBps, scoreBps);
        assertEq(record.timestamp, expectedTimestamp);
    }

    /// (b) Non-owner record reverts
    function test_NonOwnerRecord_Revert() public {
        bytes32 pairingId = keccak256("test-pairing-non-owner");

        vm.prank(alice);
        vm.expectRevert(JevoPairingRegistry.Unauthorized.selector);
        registry.recordApprovedPairing(pairingId, "TSLA", "$CYBER", 5000);
    }

    /// (c) Duplicate pairingId reverts
    function test_DuplicatePairingId_Revert() public {
        bytes32 pairingId = keccak256("test-pairing-duplicate");

        registry.recordApprovedPairing(pairingId, "AAPL", "$IPHONE", 8000);

        vm.expectRevert(
            abi.encodeWithSelector(
                JevoPairingRegistry.PairingAlreadyRecorded.selector,
                pairingId
            )
        );
        registry.recordApprovedPairing(pairingId, "AAPL", "$IPHONE", 8000);
    }

    /// (d) scoreBps > 10000 reverts
    function test_ScoreBpsGreaterThan10000_Revert() public {
        bytes32 pairingIdHigh = keccak256("test-pairing-invalid-score");

        vm.expectRevert(
            abi.encodeWithSelector(
                JevoPairingRegistry.InvalidScoreBps.selector,
                10001
            )
        );
        registry.recordApprovedPairing(pairingIdHigh, "GOOGL", "$AI", 10001);

        // Boundary test: exactly 10000 (100.00%) should succeed
        bytes32 pairingIdExact = keccak256("test-pairing-valid-max-score");
        registry.recordApprovedPairing(pairingIdExact, "GOOGL", "$AI", 10000);
        assertEq(registry.getRecord(pairingIdExact).scoreBps, 10000);
    }

    /// (e) Kirim ETH ke contract revert (plain send dan call dengan data)
    function test_SendEthToContract_Revert_PlainSend() public {
        vm.deal(alice, 10 ether);

        vm.prank(alice);
        (bool success, ) = address(registry).call{value: 1 ether}("");
        assertFalse(success, "Plain ETH transfer must revert");
        assertEq(address(registry).balance, 0);
    }

    function test_SendEthToContract_Revert_CallWithData() public {
        vm.deal(alice, 10 ether);

        vm.prank(alice);
        (bool success, ) = address(registry).call{value: 1 ether}(
            abi.encodeWithSignature("nonExistentFunction()")
        );
        assertFalse(success, "ETH call with calldata must revert");
        assertEq(address(registry).balance, 0);
    }

    /// (f) getRecord id tak dikenal revert
    function test_GetRecord_UnknownId_Revert() public {
        bytes32 unknownId = keccak256("unknown-pairing");

        vm.expectRevert(
            abi.encodeWithSelector(
                JevoPairingRegistry.PairingNotFound.selector,
                unknownId
            )
        );
        registry.getRecord(unknownId);
    }

    /// (g) transferOwnership: event benar, owner baru bisa record, owner lama revert; address(0) revert
    function test_TransferOwnership_SuccessAndEnforcement() public {
        // Transfer to zero address reverts
        vm.expectRevert(JevoPairingRegistry.ZeroAddress.selector);
        registry.transferOwnership(address(0));

        // Non-owner cannot transfer ownership
        vm.prank(alice);
        vm.expectRevert(JevoPairingRegistry.Unauthorized.selector);
        registry.transferOwnership(alice);

        // Valid ownership transfer emits event
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, alice);
        registry.transferOwnership(alice);

        assertEq(registry.owner(), alice);

        // Old owner can no longer record pairings
        bytes32 pairingId1 = keccak256("pairing-post-transfer-old-owner");
        vm.expectRevert(JevoPairingRegistry.Unauthorized.selector);
        registry.recordApprovedPairing(pairingId1, "MSFT", "$SOFT", 6000);

        // New owner can record pairings
        bytes32 pairingId2 = keccak256("pairing-post-transfer-new-owner");
        vm.prank(alice);
        registry.recordApprovedPairing(pairingId2, "MSFT", "$SOFT", 6000);

        JevoPairingRegistry.PairingRecord memory record = registry.getRecord(pairingId2);
        assertEq(record.stockSymbol, "MSFT");
        assertEq(record.memeSymbol, "$SOFT");
        assertEq(record.scoreBps, 6000);
    }
}

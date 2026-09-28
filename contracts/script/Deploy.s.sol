// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {JevoPairingRegistry} from "../src/JevoPairingRegistry.sol";

contract DeployScript is Script {
    function run() external returns (JevoPairingRegistry registry) {
        vm.startBroadcast();
        registry = new JevoPairingRegistry();
        vm.stopBroadcast();
    }
}

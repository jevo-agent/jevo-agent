# Jevo Contracts

This directory contains the smart contract and deployment tooling for **`JevoPairingRegistry`**.

> **Disclaimer:** Testnet only, not audited. This contract does not hold funds, does not manage tokens, and does not execute automated launches. On-chain records serve as an operator-attested registry and do not constitute an automated proof of the off-chain approval process.

---

## 1. Overview

`JevoPairingRegistry` is an immutable on-chain registry for approved pairings between stock equities and meme tokens.
- **Solidity Version:** `^0.8.24` (EVM version: `paris`)
- **No external dependencies in `src/`**: Pure Solidity without external library dependencies.
- **Access Control:** `owner` set to `msg.sender` on deployment. Owner can record pairings and transfer ownership.
- **Safety:** No payable functions, no receive/fallback handlers, no external calls, no token transfers, no delegatecall, and no selfdestruct.

---

## 2. Setup, Build & Test

### Dependencies

Forge standard library (`forge-std`) is used for tests and scripts without git submodules:

```bash
forge install foundry-rs/forge-std --no-git
```

### Build

```bash
forge build
```

### Run Tests

Run all unit tests locally with verbose output:

```bash
forge test -vv
```

### Local Dry-Run Deploy

Run a simulation without connecting to an RPC:

```bash
forge script script/Deploy.s.sol
```

---

## 3. Network & RPC Configuration

Never store RPC URLs or private keys in source files or `.env`. Export `$RPC_URL` in your active shell session before deployment.

### Robinhood Chain Endpoints

- **Testnet:**
  - Chain ID: `46630`
  - RPC URL: `https://rpc.testnet.chain.robinhood.com/rpc`
  - Faucet: `https://faucet.testnet.chain.robinhood.com`
  - Explorer: `https://explorer.testnet.chain.robinhood.com`
- **Mainnet:**
  - Chain ID: `4663`
  - RPC URL: `https://rpc.mainnet.chain.robinhood.com/rpc`
  - Explorer: `https://explorer.mainnet.chain.robinhood.com`

*Note: Public RPCs are rate-limited and intended for single deployments/demos.*

---

## 4. Wallet Management

Foundry encrypted keystores are used to sign transactions without exposing plaintext private keys.

Import keys with distinct keystore names:
```bash
# Testnet keystore
cast wallet import jevo-testnet --interactive

# Mainnet keystore (must be a fresh wallet with minimal funds only)
cast wallet import jevo-mainnet --interactive
```

---

## 5. Testnet Deployment Procedure

### Step 1: Pre-flight Verification
Ensure the target chain ID and wallet balance are valid before broadcasting:
```bash
export RPC_URL="https://rpc.testnet.chain.robinhood.com/rpc"

# Verify Chain ID (MUST output 46630)
cast chain-id --rpc-url "$RPC_URL"

# Verify Deployer Balance (> 0)
cast balance <deployer-address> --rpc-url "$RPC_URL"
```
*If the chain ID is not `46630` or balance is 0, DO NOT proceed.*

### Step 2: Broadcast Deployment
From the `contracts/` directory:
```bash
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --account jevo-testnet \
  --broadcast
```

### Step 3: Verify Contract Owner
Query the deployed contract to ensure owner matches the deployer address:
```bash
cast call <address> "owner()(address)" --rpc-url "$RPC_URL"
```

### Step 4: Explorer Verification (Optional)
Attempt verification via Blockscout API:
```bash
forge verify-contract <address> src/JevoPairingRegistry.sol:JevoPairingRegistry \
  --chain-id 46630 \
  --verifier blockscout \
  --verifier-url https://explorer.testnet.chain.robinhood.com/api
```
If the verifier API is unreachable, flatten the source code and verify manually via the web explorer:
```bash
forge flatten src/JevoPairingRegistry.sol > flattened.sol
```

### Step 5: Update Deployment Tracking
Record the contract address, transaction hash, and deployer in `DEPLOYMENTS.md`.

---

## 6. Recording an Approved Pairing (Testnet Demo)

To record a pairing using keystore signing:
```bash
cast send <address> \
  "recordApprovedPairing(bytes32,string,string,uint16)" \
  $(cast keccak "demo-1") "NVDA" '$COMPUTE' 7500 \
  --account jevo-testnet \
  --rpc-url "$RPC_URL"
```

Parameters:
- `pairingId`: `keccak256(bytes(id pairing di database))`
- `stockSymbol`: String ticker of the equity (e.g. `"NVDA"`)
- `memeSymbol`: String ticker of the meme coin (e.g. `"$COMPUTE"`)
- `scoreBps`: Similarity/correlation score in basis points (max `10000`)

---

## 7. Mainnet Guidelines

1. Deployment to Mainnet requires Chain ID `4663` and the mainnet RPC.
2. Verification API endpoint should be confirmed with Robinhood Chain documentation before execution.
3. Deploying only after explicit human operational sign-off.
4. Deploying an empty contract is acceptable; **DO NOT** record mock or simulated test pairings to Mainnet. Testnet records are permitted for demonstration purposes.

---

## 8. Technical Notes

- `pairingId` is computed off-chain as `keccak256(bytes(pairing_db_id))`.
- Contract access is restricted to the operator `owner`.
- The contract is non-payable; any attempt to transfer ETH will revert.

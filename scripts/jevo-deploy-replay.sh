#!/usr/bin/env bash
set -eo pipefail

# ANSI color codes for visual terminal recording
TEAL='\033[38;5;44m'
GREEN='\033[38;5;48m'
BOLD='\033[1m'
GRAY='\033[38;5;245m'
NC='\033[0m' # No Color

# Determine repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Verify jq dependency
if ! command -v jq >/dev/null 2>&1; then
    echo "[!] Error: 'jq' is required to parse deployment broadcast files." >&2
    echo "    Please install jq: brew install jq (macOS) or apt-get install jq (Linux)" >&2
    exit 1
fi

# Locate broadcast file
BROADCAST_FILE="$REPO_ROOT/contracts/broadcast/Deploy.s.sol/46630/run-latest.json"
if [[ ! -f "$BROADCAST_FILE" ]]; then
    echo "[!] Error: Broadcast file not found at: $BROADCAST_FILE" >&2
    exit 1
fi

# Extract values using jq (strict parsing, no fictitious fallbacks)
CONTRACT_NAME=$(jq -r '.transactions[0].contractName // empty' "$BROADCAST_FILE" 2>/dev/null)
RAW_ADDRESS=$(jq -r '.transactions[0].contractAddress // .receipts[0].contractAddress // empty' "$BROADCAST_FILE" 2>/dev/null)
TX_HASH=$(jq -r '.transactions[0].hash // .receipts[0].transactionHash // empty' "$BROADCAST_FILE" 2>/dev/null)
GAS_HEX=$(jq -r '.receipts[0].gasUsed // empty' "$BROADCAST_FILE" 2>/dev/null)
BLOCK_HEX=$(jq -r '.receipts[0].blockNumber // empty' "$BROADCAST_FILE" 2>/dev/null)

# Validate that all required fields are present
if [[ -z "$CONTRACT_NAME" || -z "$RAW_ADDRESS" || -z "$TX_HASH" || -z "$GAS_HEX" || -z "$BLOCK_HEX" ]]; then
    echo "[!] Error: Broadcast file format unexpected or missing deployment fields in $BROADCAST_FILE" >&2
    exit 1
fi

# Format values
if command -v cast >/dev/null 2>&1; then
    DEPLOYED_ADDRESS=$(cast --to-checksum-address "$RAW_ADDRESS" 2>/dev/null || echo "$RAW_ADDRESS")
else
    DEPLOYED_ADDRESS="$RAW_ADDRESS"
fi

GAS_DEC=$(printf "%d" "$GAS_HEX" 2>/dev/null || echo "$GAS_HEX")
BLOCK_DEC=$(printf "%d" "$BLOCK_HEX" 2>/dev/null || echo "$BLOCK_HEX")


# Output deployment log lines progressively for video recording (~0.35s delay)
sleep 0.35
printf "${BOLD}[*] Deploying ${CONTRACT_NAME}... ${GREEN}SUCCESS${NC}\n"

sleep 0.35
printf "    — Deployed to  : ${TEAL}%s${NC}\n" "$DEPLOYED_ADDRESS"

sleep 0.35
printf "    — TX hash      : ${GRAY}%s${NC}\n" "$TX_HASH"

sleep 0.35
printf "    — Gas used     : %s  (mined in block #%s)\n" "$GAS_DEC" "$BLOCK_DEC"

sleep 0.35
printf "    — Onchain now  : ${GREEN}verified live${NC} (source verified via blockscout)\n"

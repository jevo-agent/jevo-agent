#!/usr/bin/env bash
set -eo pipefail

# ANSI color codes for teal/green terminal output
TEAL='\033[38;5;44m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to type out text character by character for a "live" connection feel (~20ms per character)
typewriter() {
    local text="$1"
    local delay="${2:-0.02}"
    for (( i=0; i<${#text}; i++ )); do
        printf "%s" "${text:$i:1}"
        sleep "$delay"
    done
    printf "\n"
}

# Display solid JEVO AGENT ASCII banner in electric teal
printf "${TEAL}${BOLD}"
cat << 'EOF'
     ██╗███████╗██╗   ██╗ ██████╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗
     ██║██╔════╝██║   ██║██╔═══██╗    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
     ██║█████╗  ██║   ██║██║   ██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
██   ██║██╔══╝  ╚██╗ ██╔╝██║   ██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
╚█████╔╝███████╗ ╚████╔╝ ╚██████╔╝    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
 ╚════╝ ╚══════╝  ╚═══╝   ╚═════╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   
EOF
printf "${NC}\n"

# Connection simulation log lines (typed live)
# Line 1: Uplink status
typewriter "[+] SECURE UPLINK ESTABLISHED" 0.02

# Determine repository root for broadcast inspection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Resolve RPC_URL: use existing $RPC_URL if provided; otherwise auto-detect from latest broadcast
DETECTED_CHAIN=""
if [ -z "${RPC_URL:-}" ]; then
    LATEST_BROADCAST=$(ls -t "$REPO_ROOT/contracts/broadcast/Deploy.s.sol"/*/run-latest.json 2>/dev/null | head -n 1 || true)
    if [ -n "$LATEST_BROADCAST" ] && [ -f "$LATEST_BROADCAST" ] && command -v jq >/dev/null 2>&1; then
        DETECTED_CHAIN=$(jq -r '.chain // empty' "$LATEST_BROADCAST" 2>/dev/null)
        if [ "$DETECTED_CHAIN" = "4663" ]; then
            RPC_URL="https://rpc.mainnet.chain.robinhood.com"
        elif [ "$DETECTED_CHAIN" = "46630" ]; then
            RPC_URL="https://rpc.testnet.chain.robinhood.com"
        fi
    fi
fi

# Line 2: Encrypted network handshake
# Queries chain ID dynamically via `cast chain-id --rpc-url "$RPC_URL"`
CHAIN_ID=""
if command -v cast >/dev/null 2>&1 && [ -n "${RPC_URL:-}" ]; then
    CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || cast chain-id --rpc-url "$RPC_URL" --no-proxy 2>/dev/null || true)
fi

# If live query was unavailable but broadcast had chain ID, fallback to broadcast chain
if [ -z "$CHAIN_ID" ] && [ -n "${DETECTED_CHAIN:-}" ]; then
    CHAIN_ID="$DETECTED_CHAIN"
fi

if [ "$CHAIN_ID" = "4663" ]; then
    NETWORK_NAME="ROBINHOOD MAINNET"
elif [ "$CHAIN_ID" = "46630" ]; then
    NETWORK_NAME="ROBINHOOD TESTNET"
elif [[ "$CHAIN_ID" =~ ^[0-9]+$ ]]; then
    NETWORK_NAME="ROBINHOOD CHAIN (${CHAIN_ID})"
else
    NETWORK_NAME="ROBINHOOD NETWORK"
fi

if [[ "$CHAIN_ID" =~ ^[0-9]+$ ]]; then
    typewriter "[+] ENCRYPTED CONNECTION TO ${NETWORK_NAME}... OK (eth_chainId = ${CHAIN_ID})" 0.02
else
    typewriter "[+] ENCRYPTED CONNECTION TO ${NETWORK_NAME}... [unavailable]" 0.02
fi

# Line 3: Sync chain head
# Queries block number dynamically via `cast block-number --rpc-url "$RPC_URL"`
# Never hardcodes RPC_URL or block number. If cast or RPC fails, reports [unavailable].
BLOCK_NUM=""
if command -v cast >/dev/null 2>&1 && [ -n "${RPC_URL:-}" ]; then
    # Fetch real on-chain block number using user-provided RPC_URL
    BLOCK_NUM=$(cast block-number --rpc-url "$RPC_URL" 2>/dev/null || cast block-number --rpc-url "$RPC_URL" --no-proxy 2>/dev/null || true)
fi

# Ensure output is strictly numeric before displaying; otherwise fallback to [unavailable]
if [[ "$BLOCK_NUM" =~ ^[0-9]+$ ]]; then
    typewriter "[+] CHAIN HEAD SYNCED... block #${BLOCK_NUM}" 0.02
else
    typewriter "[+] CHAIN HEAD SYNCED... [unavailable]" 0.02
fi

# Empty line followed by static operator prompt ready for manual typing
printf "\n"
printf "[DEV@JEVO-AGENT]\n"
printf "└─▶\n"

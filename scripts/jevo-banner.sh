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

# Display solid JEVO VECTOR ASCII banner in electric teal
printf "${TEAL}${BOLD}"
cat << 'EOF'
██╗███████╗██╗   ██╗ ██████╗    ██╗   ██╗███████╗ ██████╗████████╗ ██████╗ ██████╗ 
██║██╔════╝██║   ██║██╔═══██╗   ██║   ██║██╔════╝██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
██║█████╗  ██║   ██║██║   ██║   ██║   ██║█████╗  ██║        ██║   ██║   ██║██████╔╝
██║██╔══╝  ╚██╗ ██╔╝██║   ██║   ╚██╗ ██╔╝██╔══╝  ██║        ██║   ██║   ██║██╔══██╗
╚═╝███████╗ ╚████╔╝ ╚██████╔╝    ╚████╔╝ ███████╗╚██████╗   ██║   ╚██████╔╝██║  ██║
   ╚══════╝  ╚═══╝   ╚═════╝      ╚═══╝  ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
EOF
printf "${NC}\n"

# Connection simulation log lines (typed live)
# Line 1: Uplink status
typewriter "[+] SECURE UPLINK ESTABLISHED" 0.02

# Line 2: Encrypted testnet handshake
# Note: 46630 is the static constant chain ID for Robinhood Testnet (not queried)
typewriter "[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... OK (eth_chainId = 46630)" 0.02

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
printf "[DEV@JEVO-VECTOR]\n"
printf "└─▶\n"

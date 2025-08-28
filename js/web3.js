// Web3 Integration for APOCAT Game
let web3Provider = null;
let userAccount = null;
let isWeb3Enabled = false;
let walletAddress = null;

async function detectWeb3() {
    const statusEl = document.getElementById('connectionStatus');
    const walletInfoEl = document.getElementById('walletInfo');
    const connectBtn = document.getElementById('connectWalletBtn');

    if (typeof window.ethereum !== 'undefined') {
        statusEl.textContent = 'MetaMask Detected';
        statusEl.style.color = '#00ff88';
        isWeb3Enabled = true;
        
        // Check if already connected
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                updateWalletDisplay();
            }
        } catch (error) {
            console.log('Error checking accounts:', error);
        }
    } else {
        statusEl.textContent = 'No Web3 Wallet';
        statusEl.style.color = '#ff6b6b';
        connectBtn.textContent = 'Install MetaMask';
        connectBtn.onclick = () => window.open('https://metamask.io/', '_blank');
    }
}

async function connectWallet() {
    if (!isWeb3Enabled) {
        window.open('https://metamask.io/', '_blank');
        return;
    }

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            updateWalletDisplay();
            console.log('Wallet connected:', walletAddress);
            
            // Add chat notification
            if (typeof addChatMessage === 'function') {
                addChatMessage('', `🔗 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} connected their wallet!`, true);
            }
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

function updateWalletDisplay() {
    const walletInfoEl = document.getElementById('walletInfo');
    const connectBtn = document.getElementById('connectWalletBtn');
    
    if (walletAddress) {
        walletInfoEl.innerHTML = `
            <div style="color: #00ff88;">✅ Connected</div>
            <div style="font-size: 10px; margin-top: 2px;">
                ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}
            </div>
        `;
        connectBtn.textContent = 'Connected ✓';
        connectBtn.style.background = '#00ff88';
        connectBtn.onclick = null;
    }
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            updateWalletDisplay();
        } else {
            walletAddress = null;
            location.reload(); // Refresh page when disconnected
        }
    });

    window.ethereum.on('chainChanged', () => {
        location.reload(); // Refresh page when chain changes
    });
}

// Initialize Web3 detection when page loads
document.addEventListener('DOMContentLoaded', detectWeb3);

// Token distribution simulation (for demo purposes)
function simulateTokenDistribution(score) {
    if (!walletAddress) return;
    
    const milestones = [1000, 5000, 10000, 25000, 50000];
    const tokenAmounts = [100, 500, 1000, 2500, 5000];
    
    for (let i = 0; i < milestones.length; i++) {
        if (score >= milestones[i]) {
            // In production, this would trigger actual token distribution
            console.log(`🪙 Token milestone reached! ${tokenAmounts[i]} APOCAT MEOW tokens earned for score ${score}`);
            
            if (typeof addChatMessage === 'function') {
                addChatMessage('', `🪙 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} earned ${tokenAmounts[i]} MEOW tokens!`, true);
            }
        }
    }
}

// Export functions for game use
window.connectWallet = connectWallet;
window.simulateTokenDistribution = simulateTokenDistribution;

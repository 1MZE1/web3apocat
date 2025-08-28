#!/usr/bin/env node

/**
 * APOCAT Token Distribution Bot
 * Handles automatic token distribution with gas fee management
 * Sells tokens for ETH when needed, maintains minimum token balance
 */

require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class ApocatDistributionBot {
    constructor() {
        this.config = {
            // Network configuration
            rpcUrl: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
            chainId: process.env.CHAIN_ID || 1,
            
            // Wallet configuration
            gameWalletPrivateKey: process.env.GAME_WALLET_PRIVATE_KEY,
            
            // Token configuration
            apocatTokenAddress: process.env.APOCAT_TOKEN_ADDRESS,
            
            // DEX configuration (Uniswap V2/V3)
            uniswapRouterAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
            wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            
            // Bot parameters
            minTokenBalance: 5000, // Minimum tokens to maintain
            targetEthReserve: 0.02, // Target ETH reserve (0.02 ETH)
            minEthReserve: 0.005,  // Emergency minimum ETH
            gasBuffer: 1.2,        // 20% gas buffer
            
            // Reward amounts (in tokens)
            rewards: {
                newHighScore: 1,
                completeRound: 0.001,
                newRoundRecord: 0.01,
                bossDefeated: 0.005,
                perfectRound: 0.002
            }
        };
        
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        this.gameWallet = new ethers.Wallet(this.config.gameWalletPrivateKey, this.provider);
        
        this.pendingRewards = new Map(); // walletAddress -> rewards array
        this.isProcessing = false;
        
        console.log('🤖 APOCAT Distribution Bot initialized');
        console.log(`📍 Game wallet: ${this.gameWallet.address}`);
    }

    async initialize() {
        try {
            // Initialize token contract
            this.tokenContract = new ethers.Contract(
                this.config.apocatTokenAddress,
                [
                    'function transfer(address to, uint256 amount) returns (bool)',
                    'function balanceOf(address) view returns (uint256)',
                    'function approve(address spender, uint256 amount) returns (bool)',
                    'function decimals() view returns (uint8)'
                ],
                this.gameWallet
            );
            
            // Initialize Uniswap router
            this.uniswapRouter = new ethers.Contract(
                this.config.uniswapRouterAddress,
                [
                    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
                    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
                ],
                this.gameWallet
            );
            
            // Check initial balances
            await this.checkBalances();
            
            console.log('✅ Bot initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Bot initialization failed:', error);
            return false;
        }
    }

    async checkBalances() {
        try {
            const ethBalance = await this.provider.getBalance(this.gameWallet.address);
            const tokenBalance = await this.tokenContract.balanceOf(this.gameWallet.address);
            
            const ethFormatted = ethers.formatEther(ethBalance);
            const tokenFormatted = ethers.formatEther(tokenBalance);
            
            console.log(`💰 Current balances:`);
            console.log(`   ETH: ${ethFormatted}`);
            console.log(`   APOCAT: ${tokenFormatted}`);
            
            return {
                eth: parseFloat(ethFormatted),
                tokens: parseFloat(tokenFormatted)
            };
        } catch (error) {
            console.error('❌ Error checking balances:', error);
            return null;
        }
    }

    async addPendingReward(walletAddress, rewardType, amount, description) {
        if (!this.pendingRewards.has(walletAddress)) {
            this.pendingRewards.set(walletAddress, []);
        }
        
        const reward = {
            type: rewardType,
            amount: amount,
            description: description,
            timestamp: Date.now()
        };
        
        this.pendingRewards.get(walletAddress).push(reward);
        
        console.log(`🪙 Added reward: ${amount} APOCAT for ${walletAddress.slice(0, 6)}... (${description})`);
        
        // Try to process rewards immediately
        await this.processRewards(walletAddress);
    }

    async processRewards(walletAddress) {
        if (this.isProcessing) {
            console.log('⏳ Already processing rewards, skipping...');
            return;
        }
        
        const rewards = this.pendingRewards.get(walletAddress);
        if (!rewards || rewards.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            const totalRewardAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);
            
            console.log(`🔄 Processing ${totalRewardAmount} APOCAT for ${walletAddress.slice(0, 6)}...`);
            
            // Check if we need to sell tokens for gas
            const gasNeeded = await this.estimateGasCost();
            const balances = await this.checkBalances();
            
            if (balances.eth < gasNeeded.ethNeeded) {
                console.log('💱 Need to sell tokens for gas...');
                await this.sellTokensForGas(gasNeeded.ethNeeded);
            }
            
            // Transfer tokens to player
            const success = await this.transferTokens(walletAddress, totalRewardAmount);
            
            if (success) {
                // Clear processed rewards
                this.pendingRewards.delete(walletAddress);
                console.log(`✅ Successfully distributed ${totalRewardAmount} APOCAT to ${walletAddress.slice(0, 6)}...`);
                
                // Check if we need to buy back tokens
                await this.checkAndBuyBackTokens();
            }
            
        } catch (error) {
            console.error('❌ Error processing rewards:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async estimateGasCost() {
        try {
            const gasPrice = await this.provider.getFeeData();
            const gasLimit = 100000; // Estimated gas for token transfer
            
            const gasCostWei = gasPrice.gasPrice * BigInt(gasLimit);
            const gasCostEth = parseFloat(ethers.formatEther(gasCostWei));
            
            // Add buffer and reserve refill
            const ethNeeded = gasCostEth * this.config.gasBuffer + 
                             Math.max(0, this.config.targetEthReserve - (await this.checkBalances()).eth);
            
            return {
                gasCostEth: gasCostEth,
                ethNeeded: ethNeeded
            };
        } catch (error) {
            console.error('❌ Error estimating gas:', error);
            return { gasCostEth: 0.01, ethNeeded: 0.02 }; // Fallback values
        }
    }

    async sellTokensForGas(ethNeeded) {
        try {
            console.log(`💱 Selling tokens for ${ethNeeded} ETH...`);
            
            // Get current token price in ETH
            const path = [this.config.apocatTokenAddress, this.config.wethAddress];
            const tokenAmountIn = ethers.parseEther('1'); // 1 token
            
            const amountsOut = await this.uniswapRouter.getAmountsOut(tokenAmountIn, path);
            const tokenPriceInEth = parseFloat(ethers.formatEther(amountsOut[1]));
            
            // Calculate tokens needed (with buffer)
            const tokensToSell = Math.ceil((ethNeeded / tokenPriceInEth) * 1.1); // 10% buffer
            const tokensToSellWei = ethers.parseEther(tokensToSell.toString());
            
            console.log(`💱 Selling ${tokensToSell} APOCAT for ~${ethNeeded} ETH`);
            
            // Approve router to spend tokens
            const approveTx = await this.tokenContract.approve(
                this.config.uniswapRouterAddress,
                tokensToSellWei
            );
            await approveTx.wait();
            
            // Execute swap
            const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
            const minEthOut = ethers.parseEther((ethNeeded * 0.95).toString()); // 5% slippage
            
            const swapTx = await this.uniswapRouter.swapExactTokensForETH(
                tokensToSellWei,
                minEthOut,
                path,
                this.gameWallet.address,
                deadline
            );
            
            const receipt = await swapTx.wait();
            console.log(`✅ Token swap successful! TX: ${receipt.hash}`);
            
            return true;
        } catch (error) {
            console.error('❌ Error selling tokens for gas:', error);
            return false;
        }
    }

    async checkAndBuyBackTokens() {
        try {
            const balances = await this.checkBalances();
            
            if (balances.tokens < this.config.minTokenBalance) {
                const tokensNeeded = this.config.minTokenBalance - balances.tokens;
                console.log(`🔄 Token balance low (${balances.tokens}), buying back ${tokensNeeded} tokens...`);
                
                await this.buyBackTokens(tokensNeeded);
            }
        } catch (error) {
            console.error('❌ Error checking token buyback:', error);
        }
    }

    async buyBackTokens(tokensNeeded) {
        try {
            // Get current token price
            const path = [this.config.wethAddress, this.config.apocatTokenAddress];
            const ethAmountIn = ethers.parseEther('0.01'); // 0.01 ETH
            
            const amountsOut = await this.uniswapRouter.getAmountsOut(ethAmountIn, path);
            const tokensPerEth = parseFloat(ethers.formatEther(amountsOut[1])) / 0.01;
            
            // Calculate ETH needed
            const ethNeeded = (tokensNeeded / tokensPerEth) * 1.1; // 10% buffer
            const ethNeededWei = ethers.parseEther(ethNeeded.toString());
            
            console.log(`🔄 Buying ${tokensNeeded} APOCAT with ${ethNeeded} ETH`);
            
            // Execute swap
            const deadline = Math.floor(Date.now() / 1000) + 300;
            const minTokensOut = ethers.parseEther((tokensNeeded * 0.95).toString()); // 5% slippage
            
            const swapTx = await this.uniswapRouter.swapExactETHForTokens(
                minTokensOut,
                path,
                this.gameWallet.address,
                deadline,
                { value: ethNeededWei }
            );
            
            const receipt = await swapTx.wait();
            console.log(`✅ Token buyback successful! TX: ${receipt.hash}`);
            
            return true;
        } catch (error) {
            console.error('❌ Error buying back tokens:', error);
            return false;
        }
    }

    async transferTokens(toAddress, amount) {
        try {
            const amountWei = ethers.parseEther(amount.toString());
            
            const tx = await this.tokenContract.transfer(toAddress, amountWei);
            const receipt = await tx.wait();
            
            console.log(`✅ Transferred ${amount} APOCAT to ${toAddress}. TX: ${receipt.hash}`);
            return true;
        } catch (error) {
            console.error('❌ Error transferring tokens:', error);
            return false;
        }
    }

    // API endpoints for game integration
    async handleRewardRequest(req, res) {
        try {
            const { walletAddress, rewardType, amount, description } = req.body;
            
            if (!walletAddress || !rewardType || !amount) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            
            await this.addPendingReward(walletAddress, rewardType, amount, description);
            
            res.json({ 
                success: true, 
                message: `Reward of ${amount} APOCAT added for ${walletAddress.slice(0, 6)}...` 
            });
        } catch (error) {
            console.error('❌ Error handling reward request:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    startServer(port = 3000) {
        const app = express();

        app.use(cors());
        app.use(express.json());

        // Reward distribution endpoint
        app.post('/api/reward', (req, res) => this.handleRewardRequest(req, res));

        // Bot status endpoint
        app.get('/api/status', async (req, res) => {
            const balances = await this.checkBalances();
            res.json({
                status: 'running',
                balances: balances,
                pendingRewards: this.pendingRewards.size,
                config: {
                    minTokenBalance: this.config.minTokenBalance,
                    targetEthReserve: this.config.targetEthReserve
                }
            });
        });

        // Manual token buyback endpoint (for testing)
        app.post('/api/buyback', async (req, res) => {
            try {
                await this.checkAndBuyBackTokens();
                res.json({ success: true, message: 'Buyback check completed' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        app.listen(port, () => {
            console.log(`🚀 APOCAT Distribution Bot API running on port ${port}`);
            console.log(`📊 Status: http://localhost:${port}/api/status`);
            console.log(`❤️ Health: http://localhost:${port}/health`);
        });
    }
}

// Initialize and start bot
async function main() {
    const bot = new ApocatDistributionBot();
    
    if (await bot.initialize()) {
        bot.startServer();
        
        // Periodic balance checks
        setInterval(async () => {
            await bot.checkBalances();
            await bot.checkAndBuyBackTokens();
        }, 300000); // Every 5 minutes
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ApocatDistributionBot;

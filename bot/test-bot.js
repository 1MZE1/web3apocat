#!/usr/bin/env node

/**
 * Test script for APOCAT Distribution Bot
 * Tests gas fee management and token buyback functionality
 */

require('dotenv').config();
const ApocatDistributionBot = require('./apocat-distribution-bot');

async function testBot() {
    console.log('🧪 Starting APOCAT Distribution Bot Tests...\n');
    
    const bot = new ApocatDistributionBot();
    
    try {
        // Test 1: Initialize bot
        console.log('📋 Test 1: Bot Initialization');
        const initialized = await bot.initialize();
        if (initialized) {
            console.log('✅ Bot initialized successfully\n');
        } else {
            console.log('❌ Bot initialization failed\n');
            return;
        }
        
        // Test 2: Check balances
        console.log('📋 Test 2: Balance Check');
        const balances = await bot.checkBalances();
        if (balances) {
            console.log('✅ Balance check successful');
            console.log(`   ETH: ${balances.eth}`);
            console.log(`   APOCAT: ${balances.tokens}\n`);
        } else {
            console.log('❌ Balance check failed\n');
        }
        
        // Test 3: Gas estimation
        console.log('📋 Test 3: Gas Cost Estimation');
        const gasCost = await bot.estimateGasCost();
        console.log('✅ Gas estimation successful');
        console.log(`   Gas cost: ${gasCost.gasCostEth} ETH`);
        console.log(`   Total ETH needed: ${gasCost.ethNeeded} ETH\n`);
        
        // Test 4: Token buyback check
        console.log('📋 Test 4: Token Buyback Check');
        await bot.checkAndBuyBackTokens();
        console.log('✅ Token buyback check completed\n');
        
        // Test 5: Simulate reward distribution
        console.log('📋 Test 5: Reward Distribution Simulation');
        const testWallet = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // Example wallet
        await bot.addPendingReward(testWallet, 'test', 0.001, 'Test reward');
        console.log('✅ Reward distribution simulation completed\n');
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function testAPIEndpoints() {
    console.log('🌐 Testing API Endpoints...\n');
    
    const axios = require('axios');
    const baseURL = 'http://localhost:3000';
    
    try {
        // Test health endpoint
        console.log('📋 Testing /health endpoint');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Health check:', healthResponse.data);
        
        // Test status endpoint
        console.log('📋 Testing /api/status endpoint');
        const statusResponse = await axios.get(`${baseURL}/api/status`);
        console.log('✅ Status check:', statusResponse.data);
        
        // Test reward endpoint
        console.log('📋 Testing /api/reward endpoint');
        const rewardResponse = await axios.post(`${baseURL}/api/reward`, {
            walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            rewardType: 'newHighScore',
            amount: 1,
            description: 'Test high score reward'
        });
        console.log('✅ Reward test:', rewardResponse.data);
        
        console.log('\n🎉 API tests completed successfully!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.log('💡 Make sure the bot server is running with: npm start');
    }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--api')) {
    testAPIEndpoints();
} else if (args.includes('--help')) {
    console.log(`
🧪 APOCAT Distribution Bot Test Suite

Usage:
  node test-bot.js          # Run core bot tests
  node test-bot.js --api    # Test API endpoints (requires running server)
  node test-bot.js --help   # Show this help

Environment Setup:
  1. Copy .env.example to .env
  2. Fill in your configuration values
  3. Run: npm install
  4. Run tests: npm test

API Testing:
  1. Start the bot: npm start
  2. In another terminal: node test-bot.js --api
    `);
} else {
    testBot();
}

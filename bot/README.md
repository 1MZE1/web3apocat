# 🤖 APOCAT Distribution Bot

Automated token distribution system with intelligent gas fee management and token buyback functionality.

## 🎯 Key Features

### ✅ **Gas Fee Management**
- **Automatic ETH procurement**: Sells APOCAT tokens for ETH when gas fees are needed
- **Smart reserve management**: Maintains 0.02 ETH reserve for future transactions
- **Buffer calculations**: 20% gas buffer to ensure transactions succeed

### ✅ **Token Buyback System**
- **Minimum balance maintenance**: Automatically buys back tokens when balance drops below 5,000 APOCAT
- **DEX integration**: Uses Uniswap V2/V3 for token swaps
- **Price optimization**: Gets real-time prices for optimal swap execution

### ✅ **Reward Distribution**
- **Multiple reward types**: High scores, round completion, boss defeats, etc.
- **Batch processing**: Efficient handling of multiple pending rewards
- **Automatic execution**: No manual intervention required

## 🚀 Quick Start

### 1. **Installation**
```bash
cd APOCAT_GAME_DEPLOY/bot
npm install
```

### 2. **Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. **Required Environment Variables**
```env
# Network
RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=1

# Wallet (KEEP SECURE!)
GAME_WALLET_PRIVATE_KEY=your_private_key_here

# Token
APOCAT_TOKEN_ADDRESS=0x_your_apocat_token_address_here
```

### 4. **Start the Bot**
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## 🔧 Configuration Options

### **Gas Management**
- `TARGET_ETH_RESERVE`: Target ETH balance (default: 0.02 ETH)
- `MIN_ETH_RESERVE`: Emergency minimum (default: 0.005 ETH)
- `MIN_TOKEN_BALANCE`: Minimum APOCAT to maintain (default: 5,000)

### **Reward Amounts**
- New High Score: 1 APOCAT
- Complete Round: 0.001 APOCAT
- New Round Record: 0.01 APOCAT
- Boss Defeated: 0.005 APOCAT
- Perfect Round: 0.002 APOCAT

## 🧪 Testing

### **Core Functionality Test**
```bash
npm test
```

### **API Endpoints Test**
```bash
# Start bot in one terminal
npm start

# Test API in another terminal
node test-bot.js --api
```

## 📡 API Endpoints

### **POST /api/reward**
Distribute tokens to a player
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "rewardType": "newHighScore",
  "amount": 1,
  "description": "New high score achieved"
}
```

### **GET /api/status**
Get bot status and balances
```json
{
  "status": "running",
  "balances": {
    "eth": 0.025,
    "tokens": 8500
  },
  "pendingRewards": 3
}
```

### **POST /api/buyback**
Trigger manual token buyback check

### **GET /health**
Health check endpoint

## 🔄 How It Works

### **1. Reward Processing Flow**
```
Game Event → Add Pending Reward → Check Gas → Sell Tokens (if needed) → Transfer Tokens → Check Buyback
```

### **2. Gas Fee Management**
```
Low ETH Balance → Calculate Tokens Needed → Approve Uniswap → Swap APOCAT for ETH → Refill Reserve
```

### **3. Token Buyback**
```
Check Token Balance → Below 5,000? → Calculate ETH Needed → Swap ETH for APOCAT → Restore Balance
```

## 🛡️ Security Features

### **Private Key Protection**
- Environment variables only
- Never logged or exposed
- Secure wallet management

### **Transaction Safety**
- Gas estimation with buffers
- Slippage protection (5%)
- Deadline protection (5 minutes)

### **Error Handling**
- Comprehensive try-catch blocks
- Graceful failure recovery
- Detailed logging

## 📊 Monitoring

### **Real-time Status**
- ETH and token balances
- Pending reward count
- Processing status

### **Logging**
- All transactions logged
- Error tracking
- Performance metrics

## 🔧 Integration with Game

### **Frontend Integration**
```javascript
// Add reward when player achieves milestone
async function awardTokens(walletAddress, rewardType, amount, description) {
    try {
        const response = await fetch('http://localhost:3000/api/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress,
                rewardType,
                amount,
                description
            })
        });
        
        const result = await response.json();
        console.log('Reward processed:', result);
    } catch (error) {
        console.error('Reward failed:', error);
    }
}
```

## 🚨 Important Notes

### **Initial Setup**
1. **Fund the game wallet** with initial APOCAT tokens and ETH
2. **Test on testnet first** before mainnet deployment
3. **Monitor gas prices** during high network congestion

### **Maintenance**
- **Regular balance checks**: Ensure adequate ETH and token reserves
- **Monitor swap prices**: Verify DEX pricing is reasonable
- **Update gas estimates**: Adjust for network conditions

### **Security**
- **Keep private keys secure**: Use environment variables only
- **Regular backups**: Backup wallet and configuration
- **Monitor transactions**: Watch for unusual activity

## 🎯 Production Deployment

### **1. Server Setup**
```bash
# Install Node.js and PM2
npm install -g pm2

# Start with PM2 (auto-restart)
pm2 start apocat-distribution-bot.js --name "apocat-bot"
pm2 save
pm2 startup
```

### **2. Reverse Proxy (Nginx)**
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### **3. SSL Certificate**
```bash
# Using Certbot
certbot --nginx -d yourdomain.com
```

## 🆘 Troubleshooting

### **Common Issues**
- **"Insufficient funds"**: Check ETH balance for gas
- **"Token swap failed"**: Verify DEX liquidity
- **"Private key invalid"**: Check .env configuration

### **Debug Mode**
```bash
DEBUG=* npm start
```

---

## 🎮 Ready for Production!

Your APOCAT Distribution Bot is now ready to handle:
- ✅ Automatic token distribution
- ✅ Gas fee management via token sales
- ✅ Token buyback when balance is low
- ✅ Real-time monitoring and status

**Start the bot and let the apoCATlypse rewards flow!** 🐱💰

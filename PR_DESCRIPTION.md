# 🚀 Feature: Historical Price Tracking for Realized Gains Calculation

## 📋 Summary

Implements comprehensive historical price tracking to enable accurate "Realized Gains" calculations for tax reporting. This feature automatically fetches and stores token prices at the moment of each claim, providing the necessary data for compliance and financial reporting.

## 🎯 Acceptance Criteria Met

- ✅ **Table claims_history add column price_at_claim_usd** - Added DECIMAL(36,18) column with proper indexing
- ✅ **Fetch price from Coingecko during indexing** - Automatic price fetching with caching and error handling

## 🔧 What's Included

### Database Schema Changes
- **New Column**: `price_at_claim_usd` (DECIMAL(36,18)) in `claims_history` table
- **Indexes**: Optimized queries for user_address, token_address, claim_timestamp, and transaction_hash
- **UUID Support**: Added uuid-ossp extension for unique identifiers

### Core Services

#### 📊 Price Service (`src/services/priceService.js`)
- **CoinGecko Integration**: Fetches current and historical token prices
- **Smart Caching**: 1-minute price cache, 1-hour token ID cache
- **Rate Limit Handling**: Graceful degradation and retry logic
- **ERC-20 Support**: Automatic token address to CoinGecko ID mapping

#### 🔄 Indexing Service (`src/services/indexingService.js`)
- **Automatic Price Population**: Fetches prices during claim processing
- **Batch Processing**: Efficient handling of multiple claims
- **Backfill Capability**: Populate missing prices for existing claims
- **Realized Gains Calculation**: Tax-compliant gain calculations

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/claims` | POST | Process single claim with automatic price fetching |
| `/api/claims/batch` | POST | Process multiple claims efficiently |
| `/api/claims/backfill-prices` | POST | Backfill missing prices for existing claims |
| `/api/claims/:userAddress/realized-gains` | GET | Calculate realized gains for tax reporting |

### Database Model
```javascript
// Key fields in claims_history model
{
  price_at_claim_usd: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: true,
    comment: 'Token price in USD at the time of claim for realized gains calculation'
  }
}
```

## 🧪 Testing

### Comprehensive Test Suite
- **Health Checks**: Verify service availability
- **Single Claim Processing**: Test individual claim with price fetching
- **Batch Processing**: Validate multiple claim handling
- **Realized Gains**: Test tax calculation accuracy
- **Price Backfill**: Verify historical price population

### Test Coverage
```bash
# Run the complete test suite
node test/historicalPriceTracking.test.js
```

## 📚 Documentation

- **`HISTORICAL_PRICE_TRACKING.md`**: Complete feature documentation
- **`RUN_LOCALLY.md`**: Local development setup guide
- **Inline Code Comments**: Comprehensive documentation throughout codebase

## 🔒 Security & Compliance

### Tax Compliance Features
- **Immutable Records**: Historical prices stored at claim time
- **Audit Trail**: Transaction hashes for blockchain verification
- **Precise Calculations**: 18-decimal precision for accurate financial reporting
- **Timestamp Accuracy**: Exact claim timestamp for price correlation

### Error Handling
- **Graceful Degradation**: System continues operating during API failures
- **Comprehensive Logging**: Detailed error tracking for debugging
- **Rate Limit Protection**: Built-in protection against API limits

## 🚀 Performance Optimizations

### Caching Strategy
- **Price Cache**: 1-minute TTL for current prices
- **Token ID Cache**: 1-hour TTL for token mappings
- **Batch Processing**: Minimize API calls through efficient batching

### Database Optimizations
- **Strategic Indexes**: Optimized for common query patterns
- **Efficient Queries**: Minimize database load through proper indexing
- **Connection Pooling**: Ready for production-scale usage

## 📈 Usage Examples

### Process a Claim
```javascript
const claim = await indexingService.processClaim({
  user_address: '0x1234...',
  token_address: '0xA0b8...',
  amount_claimed: '100.5',
  claim_timestamp: '2024-01-15T10:30:00Z',
  transaction_hash: '0xabc...',
  block_number: 18500000
});
// Automatically populates price_at_claim_usd
```

### Calculate Realized Gains
```javascript
const gains = await indexingService.getRealizedGains(
  '0x1234...',  // user address
  new Date('2024-01-01'),  // start date
  new Date('2024-12-31')   // end date
);
// Returns: { total_realized_gains_usd: 15075.50, claims_processed: 5 }
```

## 🔧 Dependencies Added

- **axios**: ^1.6.2 - For CoinGecko API integration
- **No breaking changes** - All existing functionality preserved

## 📋 Breaking Changes

None. This is a purely additive feature that maintains backward compatibility.

## 🧪 Manual Testing Commands

```bash
# Start the application
npm run dev

# Test health endpoint
curl http://localhost:3000/health

# Process a claim
curl -X POST http://localhost:3000/api/claims \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x1234...","token_address":"0xA0b8...","amount_claimed":"100.5","claim_timestamp":"2024-01-15T10:30:00Z","transaction_hash":"0xabc...","block_number":18500000}'

# Calculate realized gains
curl "http://localhost:3000/api/claims/0x1234.../realized-gains"
```

## 🎯 Impact

This implementation directly addresses **Issue 15: [DB] Historical Price Tracking** and provides:

- ✅ **Tax Compliance**: Accurate USD values for realized gains
- ✅ **Automation**: No manual price entry required
- ✅ **Scalability**: Efficient batch processing and caching
- ✅ **Reliability**: Comprehensive error handling and logging
- ✅ **Auditability**: Complete transaction history with price data

## 📞 Support

For questions or issues:
1. Check `HISTORICAL_PRICE_TRACKING.md` for detailed documentation
2. Review `RUN_LOCALLY.md` for setup instructions
3. Run the test suite to verify functionality
4. Check application logs for debugging information

---

**Resolves**: #15 - [DB] Historical Price Tracking
**Priority**: High
**Labels**: database, compliance, enhancement

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# Stock Analysis API

This API provides endpoints for managing and analyzing stock data. Below are the available endpoints and how to use them.

## Endpoints

### 1. Validate Stock
Validates a stock symbol and returns basic information.

**Endpoint**: `POST /api/validateStock`

**Request Body**:
```json
{
  "symbol": "AAPL"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5174/api/validateStock \
-H "Content-Type: application/json" \
-d '{"symbol": "AAPL"}'
```

**Response**:
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "market_cap": 2500000000000,
  "volume": 10000000,
  "price": 150.00,
  "exchange": "NASDAQ"
}
```

### 2. Save Stock
Saves or updates a stock in the database.

**Endpoint**: `POST /api/saveStock`

**Request Body**:
```json
{
  "symbol": "AAPL"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5174/api/saveStock \
-H "Content-Type: application/json" \
-d '{"symbol": "AAPL"}'
```

**Response**:
```json
{
  "message": "Stock saved successfully",
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "market_cap": 2500000000000,
    "volume": 10000000,
    "price": 150.00,
    "exchange": "NASDAQ"
  }
}
```

### 3. Update Stock Prices
Updates historical price data for all stocks.

**Endpoint**: `POST /api/updateStockPrices`

**cURL Example**:
```bash
curl -X POST http://localhost:5174/api/updateStockPrices \
-H "Content-Type: application/json"
```

**Response**:
```json
{
  "message": "Stock prices updated successfully"
}
```

### 4. Update Historical Data
Updates historical data for specific stocks.

**Endpoint**: `POST /api/updateHistoricalData`

**Request Body** (optional):
```json
{
  "symbols": ["AAPL", "MSFT", "TSLA"]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5174/api/updateHistoricalData \
-H "Content-Type: application/json" \
-d '{"symbols": ["AAPL", "MSFT", "TSLA"]}'
```

**Response**:
```json
{
  "message": "Historical data update completed",
  "results": [
    {
      "symbol": "AAPL",
      "timeframe": "1d",
      "count": 365,
      "status": "success"
    }
  ]
}
```

### 5. Analyze Waves
Analyzes Elliott Wave patterns for stocks.

**Endpoint**: `POST /api/analyzeWaves`

**Request Body** (optional):
```json
{
  "symbols": ["AAPL", "MSFT", "TSLA"]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5174/api/analyzeWaves \
-H "Content-Type: application/json" \
-d '{"symbols": ["AAPL", "MSFT", "TSLA"]}'
```

**Response**:
```json
{
  "message": "Wave analysis completed successfully",
  "status": "success"
}
```

## Running the API
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. The API will be available at `http://localhost:5174`

# Stock Analysis App

A web application for analyzing stock market trends using Elliott Wave Theory.

## Features
- Real-time stock data visualization
- Elliott Wave pattern recognition
- Customizable timeframes
- Detailed stock analysis views

## Technologies
- React
- TypeScript
- Supabase
- Tailwind CSS

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

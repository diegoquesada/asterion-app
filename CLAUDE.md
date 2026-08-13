# Project context
When working with this codebase, keep the code clear and avoid obscure tricks, unless it offers significant performance or structure benefits. Ask clarifying questions before making architectural changes.
Use a venv to manage Python packages, do not install globally.

## About the project
This project is a web app to track individual investments across multiple accounts. Backend is Python + Flask, unit tests in Pytest. Front end is React + Vite.js, unit tests in Mocha. Database is Mongodb running in a container. Mongodb is pegged at v4.4 to avoid AVX dependency. 

### Data Model
- **Account**: Basic account info (number, institution, type, tax status).
- **Investment**: Tracks a specific holding within an account. Includes `symbol`, `asset_class` (e.g., Equity, Fixed Income), `investment_vehicle` (e.g., Stock, ETF), `unit_balance`, and `avg_cost`.
- **Transaction**: Records purchases or sales for an investment.
- **Snapshot**: Captures the state of an account at a specific date.

## Key directories
- `backend` - the backend code
- `frontend` - the frontend web app
- `mongodb` - mongodb Docker configuration

## Standards
Prefer separate files for separate abstractions. Generate generous comments in the code but don't be excessively verbose. 

## Common commands
```bash
backend/start_debug_backend.sh # Start the backend in a development server
backend/run_tests.sh # Execute backend test suite
```


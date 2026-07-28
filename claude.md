# AsterionApp
This project is an app to track individual investments across multiple accounts.

## General conventions and standards
Prefer separate files for separate abstractions. Generate generous comments in the code but don't be excessively verbose. Assume basic familiarity with Python and Docker, but only basic knowledge of React.

## Data model
The app understands the concepts of Accounts, Investments, Transactions and Snapshots.

Accounts are containers for Investments, and have these properties:
- Number: string, allowing numbers, letters and dashes up to 20 characters
- Holding Institution: string up to 20 characters
- Type: Bank or Brokerage
- Tax Status: Taxable, RRSP, RESP, TFSA
- Active: yes or no

Accounts contain at least one Investment. Investments have these properties:
- Symbol: a string up to 10 characters
- Asset class: Stock, Mutual fund, ETF, Bond, GIC
- Unit balance: float
- Average cost per unit: currency

Transactions are associated with one and only one investment within an account. Transactions have these properties:
- Date
- Account
- Investment
- Type: Purchase or Sale
- Number of units: float
- Unit price: currency
- Transaction cost: currency, equals (number of units) * (unit price)

Snapshots track Investments within a given Account on a specified date. A Snapshot has the following properties:
- Date
- Account associated with the snapshot
- Unit values for each investment in the account
- Number of units of the investment as of the date
- Total value for each investment in the account. This is (unit value from the snapshot) x (number of units from the snapshot)

## Architecture
### Database
Data is in a MongoDB database running in a Docker container. MongoDB should be a version prior to 5.0 in order to avoid dependence on AVX.

### Operations
The system supports operations on Accounts, Investments, Transactions and Snapshots.

Accounts support:
- Add: this adds a new blank account with no Investments in it, and marks it as Active
- Remove: this marks the Account as Inactive
- List investments within the account
- Produce a snapshot of the account, which is stored permanently

Investments support:
- Add a new Investment to an Account
- Remove Investment from an Account: this removes the Investment but leaves its associated Transactions intact
- Transfer from one Account to another

Transactions support:
- Adding a new Transaction associated with an Investment in an Account
- Ading a purchase transaction, also adds the unit number to the investment balance, and updates the average cost
- Adding a sale transaction, also subtracts the unit number from the investment balancet

### Web app
A React web app is used to enter and visualize the data. The app has the following modules:
- An overview mode displays overall asset allocation.
- An account list, listing all the existing accounts with a total of their investment value.
- The account view displays all the investments within a given account, as a table.


# AsterionApp
This project is an app to track individual investments across multiple accounts.

## General conventions and standards
Generate generous comments in the code but don't be excessively verbose. Assume basic familiarity with Python and Docker, but no specific knowledge of React.

## Data model
This section describes the data that the app will manage. The app understands the concepts of Accounts, Investments, Transactions and Snapshots.

Accounts are containers for Investments, and have the following properties:
- Number: string, allowing numbers, letters and dashes up to 20 characters
- Holding Institution: string up to 20 characters
- Type: Bank or Brokerage
- Tax Status: Taxable, RRSP, RESP, TFSA
- Active: yes or no

Each Account contains at least one Investment. Investments have the following properties:
- Symbol: a string up to 10 characters
- Asset class: Stock, Mutual fund, ETF, Bond, GIC
- Unit balance: float
- Average cost per unit: currency

Transactions are associated with one and only one investment within an account. Transactions have the following properties:
- Date
- Account
- Investment
- Type: Purchase or Sale
- Number of units: float
- Unit price: currency
- Transaction cost: currency, equals (number of units) * (unit price)

Snapshots are meant to track Investments within a given Account on a specified date. A snapshot has the following properties:
- Date
- Account associated with the snapshot
- Unit values for each investment in the account
- Number of units of the investment as of the date
- Total value for each investment in the account. This is (unit value from the snapshot) x (number of units from the snapshot)

## Architecture
### Database
Data is tracked in a MongoDB database running in a Docker container. MongoDB should be a version prior to 5.0 in order to avoid dependence on AVX.

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
A web app written in React is used to enter and visualize the data. The app has the following modules:
- An overview mode that displays overall asset allocation. This page should display a table of accounts on the left side, and an asset allocation graph on the right. The asset allocation graph sums up all investments across all accounts, totalling by asset class. 
- An account list, listing all the existing accounts with a total of their investment value. This module allows selection of an account to drill down into the account view.
- The account view displays all the investments within a given account, as a table. This module allows selection of an investment to drill down into the investment view. This also displays a pie chart of all investments in the account classified by asset class.
- The investment view displays all the transactions recorded for the Investment within a specific account. From this view it is possible to add new transactions.

On startup, the app will display the overview module, with all accounts combined.


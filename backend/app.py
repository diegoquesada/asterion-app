""" 
AsterionApp Backend API

This Flask application provides a REST API for managing investment accounts,
investments, transactions, and snapshots. Data is stored in MongoDB.

Copyright (c) 2026 Diego Quesada
Licensed under the MIT license. See LICENSE file for details.
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# MongoDB connection configuration
MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
MONGO_USER = os.getenv('MONGO_USER', 'asterion')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD', 'asterionpass')
MONGO_DB = os.getenv('MONGO_DB', 'asterion')


def get_db():
    """Establish and return a connection to the MongoDB database."""
    client = MongoClient(
        host=MONGO_HOST,
        port=MONGO_PORT,
        username=MONGO_USER,
        password=MONGO_PASSWORD,
        authSource=MONGO_DB
    )
    return client[MONGO_DB]


def serialize_doc(doc):
    """Convert a MongoDB document to JSON-serializable format."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc


# ============================================================================
# ACCOUNTS API
# ============================================================================

@app.route('/api/accounts', methods=['GET'])
def list_accounts():
    """
    List all accounts.

    Returns:
        JSON list of all accounts with their investment totals
    """
    db = get_db()
    accounts = list(db.accounts.find())

    # Calculate total value for each account
    result = []
    for account in accounts:
        account_data = serialize_doc(account)
        # Sum up investment values
        investments = list(db.investments.find({'account_id': str(account['_id'])}))
        book_value = sum(inv.get('unit_balance', 0) * inv.get('avg_cost', 0) for inv in investments)
        account_data['total_book_value'] = book_value
        result.append(account_data)

    return jsonify(result)


@app.route('/api/accounts', methods=['POST'])
def add_account():
    """
    Add a new blank account.

    Request body:
        - number: string (account number)
        - holding_institution: string
        - type: "Bank" or "Brokerage"
        - tax_status: "Taxable", "RRSP", "RESP", or "TFSA"

    Returns:
        JSON the newly created account
    """
    db = get_db()
    data = request.json

    account = {
        'number': data['number'],
        'holding_institution': data['holding_institution'],
        'type': data['type'],
        'tax_status': data['tax_status'],
        'active': True,
        'created_at': datetime.utcnow()
    }

    result = db.accounts.insert_one(account)
    account['_id'] = result.inserted_id

    return jsonify(serialize_doc(account)), 201


@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def remove_account(account_id):
    """
    Mark an account as inactive (soft delete).

    Args:
        account_id: The account's ObjectId

    Returns:
        JSON success message
    """
    db = get_db()
    result = db.accounts.update_one(
        {'_id': ObjectId(account_id)},
        {'$set': {'active': False}}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Account not found'}), 404

    return jsonify({'message': 'Account marked as inactive'})


@app.route('/api/accounts/<account_id>', methods=['PATCH'])
def update_account(account_id):
    """
    Update an account's fields.

    Args:
        account_id: The account's ObjectId

    Request body (any combination of):
        - active: boolean
        - holding_institution: string
        - number: string
        - tax_status: string ("Taxable", "RRSP", "RESP", or "TFSA")

    Returns:
        JSON the updated account
    """
    db = get_db()
    data = request.json

    # Build update fields
    update_fields = {}
    allowed_fields = ['active', 'holding_institution', 'number', 'tax_status']

    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    update_fields['updated_at'] = datetime.utcnow()

    result = db.accounts.update_one(
        {'_id': ObjectId(account_id)},
        {'$set': update_fields}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Account not found'}), 404

    updated_account = db.accounts.find_one({'_id': ObjectId(account_id)})
    return jsonify(serialize_doc(updated_account))


@app.route('/api/accounts/<account_id>/investments', methods=['GET'])
def list_account_investments(account_id):
    """
    List all investments within an account.

    Args:
        account_id: The account's ObjectId

    Returns:
        JSON list of investments in the account
    """
    db = get_db()
    investments = list(db.investments.find({'account_id': account_id}))
    return jsonify(serialize_doc(investments))


@app.route('/api/accounts/<account_id>/snapshot', methods=['POST'])
def produce_snapshot(account_id):
    """
    Produce a snapshot of an account.

    Captures the current state of all investments in the account,
    including unit values and totals.

    Args:
        account_id: The account's ObjectId

    Request body (optional):
        - date: ISO date string (defaults to now)
        - unit_values: dict of symbol -> unit value

    Returns:
        JSON the newly created snapshot
    """
    db = get_db()
    data = request.json or {}

    # Verify account exists
    account = db.accounts.find_one({'_id': ObjectId(account_id)})
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    # Get all investments in the account
    investments = list(db.investments.find({'account_id': account_id}))

    # Build snapshot data
    snapshot_date = data.get('date', datetime.utcnow().isoformat())
    if isinstance(snapshot_date, str):
        snapshot_date = datetime.fromisoformat(snapshot_date.replace('Z', '+00:00'))

    snapshot_investments = []
    unit_values = data.get('unit_values', {})

    for inv in investments:
        symbol = inv.get('symbol')
        units = inv.get('unit_balance', 0)
        unit_value = unit_values.get(symbol, inv.get('avg_cost', 0))
        total_value = units * unit_value

        snapshot_investments.append({
            'symbol': symbol,
            'asset_class': inv.get('asset_class'),
            'investment_vehicle': inv.get('investment_vehicle'),
            'units': units,
            'unit_value': unit_value,
            'total_value': total_value
        })

    snapshot = {
        'date': snapshot_date,
        'account_id': account_id,
        'investments': snapshot_investments,
        'created_at': datetime.utcnow()
    }

    result = db.snapshots.insert_one(snapshot)
    snapshot['_id'] = result.inserted_id

    return jsonify(serialize_doc(snapshot)), 201


# ============================================================================
# INVESTMENTS API
# ============================================================================

@app.route('/api/accounts/<account_id>/investments', methods=['POST'])
def add_investment(account_id):
    """
    Add a new investment to an account.

    Args:
        account_id: The account's ObjectId

    Request body:
        - symbol: string (up to 10 chars)
        - asset_class: "Equity", "Fixed Income", "Alternative", "Mixed", or "Cash"
        - investment_vehicle: "Stock", "Mutual fund", "ETF", "Bond", or "GIC"
        - unit_balance: float (default 0)
        - avg_cost: float (default 0)

    Returns:
        JSON the newly created investment
    """
    db = get_db()
    data = request.json

    # Verify account exists
    account = db.accounts.find_one({'_id': ObjectId(account_id)})
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    investment = {
        'account_id': account_id,
        'symbol': data['symbol'],
        'asset_class': data['asset_class'],
        'investment_vehicle': data['investment_vehicle'],
        'unit_balance': data.get('unit_balance', 0),
        'avg_cost': data.get('avg_cost', 0),
        'created_at': datetime.utcnow()
    }

    result = db.investments.insert_one(investment)
    investment['_id'] = result.inserted_id

    return jsonify(serialize_doc(investment)), 201


@app.route('/api/investments/<investment_id>', methods=['DELETE'])
def remove_investment(investment_id):
    """
    Remove an investment from an account.
    Leaves associated transactions intact.

    Args:
        investment_id: The investment's ObjectId

    Returns:
        JSON success message
    """
    db = get_db()
    result = db.investments.delete_one({'_id': ObjectId(investment_id)})

    if result.deleted_count == 0:
        return jsonify({'error': 'Investment not found'}), 404

    return jsonify({'message': 'Investment removed'})


@app.route('/api/investments/<investment_id>/transfer', methods=['POST'])
def transfer_investment(investment_id):
    """
    Transfer an investment from one account to another.

    Args:
        investment_id: The investment's ObjectId

    Request body:
        - to_account_id: ObjectId of the destination account

    Returns:
        JSON the updated investment
    """
    db = get_db()
    data = request.json
    to_account_id = data.get('to_account_id')

    if not to_account_id:
        return jsonify({'error': 'to_account_id is required'}), 400

    # Verify destination account exists
    to_account = db.accounts.find_one({'_id': ObjectId(to_account_id)})
    if not to_account:
        return jsonify({'error': 'Destination account not found'}), 404

    # Update the investment's account_id
    result = db.investments.update_one(
        {'_id': ObjectId(investment_id)},
        {'$set': {'account_id': to_account_id}}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Investment not found'}), 404

    # Return updated investment
    investment = db.investments.find_one({'_id': ObjectId(investment_id)})
    return jsonify(serialize_doc(investment))


@app.route('/api/investments/<investment_id>', methods=['PATCH'])
def update_investment(investment_id):
    """
    Update an investment's fields.

    Args:
        investment_id: The investment's ObjectId

    Request body (any combination of):
        - symbol: string
        - asset_class: string ("Equity", "Fixed Income", "Alternative", "Mixed", or "Cash")
        - investment_vehicle: string ("Stock", "Mutual fund", "ETF", "Bond", or "GIC")
        - unit_balance: float
        - avg_cost: float

    Returns:
        JSON the updated investment
    """
    db = get_db()
    data = request.json

    # Build update fields
    update_fields = {}
    allowed_fields = ['symbol', 'asset_class', 'investment_vehicle', 'unit_balance', 'avg_cost']

    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    result = db.investments.update_one(
        {'_id': ObjectId(investment_id)},
        {'$set': update_fields}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Investment not found'}), 404

    updated_investment = db.investments.find_one({'_id': ObjectId(investment_id)})
    return jsonify(serialize_doc(updated_investment))


# ============================================================================
# TRANSACTIONS API
# ============================================================================

@app.route('/api/investments/<investment_id>/transactions', methods=['GET'])
def list_transactions(investment_id):
    """
    List all transactions for an investment.

    Args:
        investment_id: The investment's ObjectId

    Returns:
        JSON list of transactions
    """
    db = get_db()
    transactions = list(db.transactions.find({'investment_id': investment_id}))
    return jsonify(serialize_doc(transactions))


@app.route('/api/investments/<investment_id>/transactions', methods=['POST'])
def add_transaction(investment_id):
    """
    Add a new transaction for an investment.

    Args:
        investment_id: The investment's ObjectId

    Request body:
        - date: ISO date string
        - type: "Purchase" or "Sale"
        - units: float (number of units)
        - unit_price: float (price per unit)

    Returns:
        JSON the newly created transaction, or error if investment not found
    """
    db = get_db()
    data = request.json

    # Verify investment exists
    investment = db.investments.find_one({'_id': ObjectId(investment_id)})
    if not investment:
        return jsonify({'error': 'Investment not found'}), 404

    # Calculate transaction cost
    units = data.get('units', 0)
    unit_price = data.get('unit_price', 0)
    transaction_cost = units * unit_price

    # Parse date
    trans_date = data.get('date')
    if isinstance(trans_date, str):
        trans_date = datetime.fromisoformat(trans_date.replace('Z', '+00:00'))
    elif trans_date is None:
        trans_date = datetime.utcnow()

    transaction = {
        'investment_id': investment_id,
        'account_id': investment['account_id'],
        'date': trans_date,
        'type': data['type'],
        'units': units,
        'unit_price': unit_price,
        'transaction_cost': transaction_cost,
        'created_at': datetime.utcnow()
    }

    result = db.transactions.insert_one(transaction)
    transaction['_id'] = result.inserted_id

    # Update investment based on transaction type
    if data['type'] == 'Purchase':
        # Add units to balance and update average cost
        current_units = investment.get('unit_balance', 0)
        current_avg = investment.get('avg_cost', 0)

        new_units = current_units + units
        if new_units > 0:
            # Calculate new average cost: ((old_units * old_avg) + (new_units * price)) / total_units
            new_avg = ((current_units * current_avg) + transaction_cost) / new_units
        else:
            new_avg = 0

        db.investments.update_one(
            {'_id': ObjectId(investment_id)},
            {'$set': {
                'unit_balance': new_units,
                'avg_cost': new_avg
            }}
        )

    elif data['type'] == 'Sale':
        # Subtract units from balance
        current_units = investment.get('unit_balance', 0)
        new_units = max(0, current_units - units)

        db.investments.update_one(
            {'_id': ObjectId(investment_id)},
            {'$set': {'unit_balance': new_units}}
        )

    return jsonify(serialize_doc(transaction)), 201


# ============================================================================
# SNAPSHOTS API
# ============================================================================

@app.route('/api/accounts/<account_id>/snapshots', methods=['GET'])
def list_snapshots(account_id):
    """
    List all snapshots for an account.

    Args:
        account_id: The account's ObjectId

    Returns:
        JSON list of snapshots
    """
    db = get_db()
    snapshots = list(db.snapshots.find({'account_id': account_id}).sort('date', -1))
    return jsonify(serialize_doc(snapshots))


# ============================================================================
# OVERVIEW API
# ============================================================================

@app.route('/api/overview', methods=['GET'])
def get_overview():
    """
    Get overview data for asset allocation.
    Combines all accounts and sums investments by asset class.

    Returns:
        JSON with account list and asset allocation by asset class
    """
    db = get_db()

    # Get all active accounts
    accounts = list(db.accounts.find({'active': True}))
    accounts_data = []

    # Calculate totals by asset class
    asset_class_totals = {}

    for account in accounts:
        account_data = serialize_doc(account)
        account_id = str(account['_id'])

        # Get investments for this account
        investments = list(db.investments.find({'account_id': account_id}))

        account_total = 0
        for inv in investments:
            book_value = inv.get('unit_balance', 0) * inv.get('avg_cost', 0)
            account_total += book_value

            # Accumulate by asset class
            asset_class = inv.get('asset_class', 'Unknown')
            if asset_class not in asset_class_totals:
                asset_class_totals[asset_class] = 0
            asset_class_totals[asset_class] += book_value

        account_data['total_book_value'] = account_total
        accounts_data.append(account_data)

    return jsonify({
        'accounts': accounts_data,
        'asset_allocation': asset_class_totals
    })


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        db = get_db()
        db.command('ping')
        return jsonify({'status': 'healthy', 'database': 'connected'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

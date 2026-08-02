import pytest
import json
from bson import ObjectId

def test_add_investment(client, mock_db):
    """Test adding an investment to an account."""
    account_id = mock_db.accounts.insert_one({
        "number": "1", "holding_institution": "H", "type": "Bank", "tax_status": "Taxable", "active": True
    }).inserted_id
    acc_id_str = str(account_id)

    payload = {
        "symbol": "AAPL",
        "asset_class": "Stock",
        "unit_balance": 10.0,
        "avg_cost": 150.0
    }
    response = client.post(f'/api/accounts/{acc_id_str}/investments', json=payload)

    assert response.status_code == 201
    data = response.get_json()
    assert data['symbol'] == "AAPL"
    assert data['account_id'] == acc_id_str

def test_add_investment_account_not_found(client, mock_db):
    """Test adding investment to non-existent account."""
    payload = {
        "symbol": "AAPL",
        "asset_class": "Stock",
        "unit_balance": 10.0,
        "avg_cost": 150.0
    }
    response = client.post(f'/api/accounts/{str(ObjectId())}/investments', json=payload)
    assert response.status_code == 404

def test_remove_investment(client, mock_db):
    """Test removing an investment."""
    inv_id = mock_db.investments.insert_one({
        "symbol": "MSFT", "account_id": "some_acc", "unit_balance": 5.0, "avg_cost": 200.0
    }).inserted_id

    response = client.delete(f'/api/investments/{str(inv_id)}')
    assert response.status_code == 200

    # Verify it's gone
    inv = mock_db.investments.find_one({'_id': inv_id})
    assert inv is None

def test_transfer_investment(client, mock_db):
    """Test transferring investment between accounts."""
    acc1_id = mock_db.accounts.insert_one({"number": "1"}).inserted_id
    acc2_id = mock_db.accounts.insert_one({"number": "2"}).inserted_id

    inv_id = mock_db.investments.insert_one({
        "symbol": "GOOGL", "account_id": str(acc1_id)
    }).inserted_id

    payload = {"to_account_id": str(acc2_id)}
    response = client.post(f'/api/investments/{str(inv_id)}/transfer', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['account_id'] == str(acc2_id)

    # Verify in DB
    inv = mock_db.investments.find_one({'_id': inv_id})
    assert inv['account_id'] == str(acc2_id)

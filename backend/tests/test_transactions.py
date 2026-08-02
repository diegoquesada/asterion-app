import pytest
import json
from bson import ObjectId

def test_list_transactions(client, mock_db):
    """Test listing transactions for an investment."""
    inv_id = str(ObjectId())
    mock_db.transactions.insert_many([
        {"investment_id": inv_id, "type": "Purchase", "units": 1.0, "unit_price": 10.0},
        {"investment_id": inv_id, "type": "Purchase", "units": 2.0, "unit_price": 20.0},
    ])

    response = client.get(f'/api/investments/{inv_id}/transactions')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2

def test_add_transaction_purchase(client, mock_db):
    """Test that a Purchase updates investment balance and cost."""
    inv_id = mock_db.investments.insert_one({
        "symbol": "AAPL", "unit_balance": 10.0, "avg_cost": 100.0, "account_id": "acc1"
    }).inserted_id
    inv_id_str = str(inv_id)

    payload = {
        "date": "2026-01-01T00:00:00Z",
        "type": "Purchase",
        "units": 10.0,
        "unit_price": 150.0
    }
    # Cost = 10 * 150 = 1500
    # Old Value = 10 * 100 = 1000
    # New Total Cost = 1000 + 1500 = 2500
    # New Total Units = 10 + 10 = 20
    # New Avg Cost = 2500 / 20 = 125.0

    response = client.post(f'/api/investments/{inv_id_str}/transactions', json=payload)
    assert response.status_code == 201

    # Verify investment updated
    inv = mock_db.investments.find_one({'_id': inv_id})
    assert inv['unit_balance'] == 20.0
    assert inv['avg_cost'] == 125.0

def test_add_transaction_sale(client, mock_db):
    """Test that a Sale updates investment balance."""
    inv_id = mock_db.investments.insert_one({
        "symbol": "AAPL", "unit_balance": 20.0, "avg_cost": 125.0, "account_id": "acc1"
    }).inserted_id
    inv_id_str = str(inv_id)

    payload = {
        "date": "2026-01-02T00:00:00Z",
        "type": "Sale",
        "units": 5.0,
        "unit_price": 200.0
    }

    response = client.post(f'/api/investments/{inv_id_str}/transactions', json=payload)
    assert response.status_code == 201

    # Verify investment updated
    inv = mock_db.investments.find_one({'_id': inv_id})
    assert inv['unit_balance'] == 15.0

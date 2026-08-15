import pytest
import json
from bson import ObjectId

def test_produce_snapshot(client, mock_db):
    """Test producing an account snapshot."""
    acc_id = mock_db.accounts.insert_one({"number": "1"}).inserted_id
    acc_id_str = str(acc_id)

    mock_db.investments.insert_one({
        "symbol": "AAPL", "unit_balance": 10.0, "avg_cost": 100.0, "account_id": acc_id_str, "asset_class": "Equity", "investment_vehicle": "Stock"
    })
    mock_db.investments.insert_one({
        "symbol": "MSFT", "unit_balance": 5.0, "avg_cost": 200.0, "account_id": acc_id_str, "asset_class": "Equity", "investment_vehicle": "Stock"
    })

    payload = {
        "date": "2026-01-01T00:00:00Z",
        "unit_values": {
            "AAPL": 110.0,
            "MSFT": 210.0
        }
    }
    # AAPL: 10 * 110 = 1100
    # MSFT: 5 * 210 = 1050
    # Total: 2150

    response = client.post(f'/api/accounts/{acc_id_str}/snapshot', json=payload)
    assert response.status_code == 201
    data = response.get_json()

    assert len(data['investments']) == 2
    # Check a specific investment in snapshot
    aapl = next(i for i in data['investments'] if i['symbol'] == "AAPL")
    assert aapl['total_value'] == 1100.0
    assert aapl['asset_class'] == "Equity"
    assert aapl['investment_vehicle'] == "Stock"

def test_list_snapshots(client, mock_db):
    """Test listing snapshots for an account."""
    acc_id = str(ObjectId())
    mock_db.snapshots.insert_many([
        {"account_id": acc_id, "date": "2026-01-01T00:00:00Z", "investments": []},
        {"account_id": acc_id, "date": "2026-02-01T00:00:00Z", "investments": []},
    ])

    response = client.get(f'/api/accounts/{acc_id}/snapshots')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2

import pytest
import json

def test_get_overview(client, mock_db):
    """Test the overview endpoint asset allocation."""
    # Account 1
    acc1_id = mock_db.accounts.insert_one({"number": "1", "active": True}).inserted_id
    acc1_id_str = str(acc1_id)
    mock_db.investments.insert_one({
        "symbol": "AAPL", "investment_vehicle": "Stock", "unit_balance": 10.0, "avg_cost": 100.0, "account_id": acc1_id_str
    }) # Value: 1000

    # Account 2
    acc2_id = mock_db.accounts.insert_one({"number": "2", "active": True}).inserted_id
    acc2_id_str = str(acc2_id)
    mock_db.investments.insert_one({
        "symbol": "Vanguard", "investment_vehicle": "ETF", "unit_balance": 5.0, "avg_cost": 200.0, "account_id": acc2_id_str
    }) # Value: 1000

    response = client.get('/api/overview')
    assert response.status_code == 200
    data = response.get_json()

    assert len(data['accounts']) == 2
    assert data['asset_allocation']['Stock'] == 1000.0
    assert data['asset_allocation']['ETF'] == 1000.0

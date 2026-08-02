import pytest
import json
from bson import ObjectId

def test_create_account(client, mock_db):
    """Test adding a new account."""
    payload = {
        "number": "12345",
        "holding_institution": "Bank of Test",
        "type": "Bank",
        "tax_status": "Taxable"
    }
    response = client.post('/api/accounts', json=payload)

    assert response.status_code == 201
    data = response.get_json()
    assert data['number'] == payload['number']
    assert data['holding_institution'] == payload['holding_institution']
    assert '_id' in data

    # Verify in DB
    account = mock_db.accounts.find_one({'number': '12345'})
    assert account is not None
    assert account['number'] == '12345'

def test_list_accounts(client, mock_db):
    """Test listing accounts."""
    # Seed data
    mock_db.accounts.insert_one({
        "number": "1", "holding_institution": "H1", "type": "Bank", "tax_status": "Taxable", "active": True
    })
    mock_db.accounts.insert_one({
        "number": "2", "holding_institution": "H2", "type": "Brokerage", "tax_status": "TFSA", "active": True
    })

    response = client.get('/api/accounts')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2

def test_update_account(client, mock_db):
    """Test updating an account."""
    account_id = mock_db.accounts.insert_one({
        "number": "100", "holding_institution": "Old", "type": "Bank", "tax_status": "Taxable", "active": True
    }).inserted_id

    payload = {"holding_institution": "New Bank"}
    response = client.patch(f'/api/accounts/{str(account_id)}', json=payload)

    assert response.status_code == 200
    data = response.get_json()
    assert data['holding_institution'] == "New Bank"

    # Verify in DB
    account = mock_db.accounts.find_one({'_id': account_id})
    assert account['holding_institution'] == "New Bank"

def test_remove_account(client, mock_db):
    """Test marking an account as inactive."""
    account_id = mock_db.accounts.insert_one({
        "number": "200", "holding_institution": "H", "type": "Bank", "tax_status": "Taxable", "active": True
    }).inserted_id

    response = client.delete(f'/api/accounts/{str(account_id)}')
    assert response.status_code == 200

    # Verify in DB
    account = mock_db.accounts.find_one({'_id': account_id})
    assert account['active'] is False

def test_remove_account_not_found(client, mock_db):
    """Test deleting a non-existent account."""
    fake_id = str(ObjectId())

    response = client.delete(f'/api/accounts/{fake_id}')
    assert response.status_code == 404

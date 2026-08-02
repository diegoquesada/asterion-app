import pytest

def test_health_check_healthy(client, mock_db):
    """Test health check when DB is connected."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['database'] == 'connected'

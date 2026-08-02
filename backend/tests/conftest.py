import pytest
from app import app as flask_app
import mongomock
from unittest.mock import patch

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app

@pytest.fixture
def client(app):
    """A test client for the Flask application."""
    return app.test_client()

@pytest.fixture
def mock_db():
    """
    Create a mocked MongoDB database.
    We patch 'app.get_db' to return the mocked database.
    """
    # Create a mongomock client
    client = mongomock.MongoClient()
    db = client['asterion']

    with patch('app.get_db', return_value=db):
        yield db

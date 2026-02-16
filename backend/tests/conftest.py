"""
Pytest configuration and shared fixtures
"""
import pytest
import sys
import os

# Add backend to Python path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)


def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )


@pytest.fixture(scope="session")
def backend_dir():
    """Get backend directory path"""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

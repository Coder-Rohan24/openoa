# Quick Test Execution Guide

## Prerequisites

```bash
cd backend
pip install -r requirements-test.txt
```

## Running Tests

### Option 1: Python Test Runner (Recommended)
```bash
python run_tests.py                # All tests
python run_tests.py --quick        # Fast tests only (unit + validation)
python run_tests.py --integration  # Integration tests only
python run_tests.py --coverage     # With coverage report
```

### Option 2: PowerShell Test Runner
```powershell
.\run_tests.ps1                    # All tests
.\run_tests.ps1 -Quick            # Fast tests only
.\run_tests.ps1 -Coverage         # With coverage report
```

### Option 3: Direct pytest
```bash
# Quick validation (16 seconds)
pytest tests/test_openoa_analysis.py::TestDataValidation -v

# Duration boundaries (24 seconds)  
pytest tests/test_duration_boundaries.py::TestDurationBoundaries -v

# Critical test: 396-day data  
pytest tests/test_duration_boundaries.py::TestDurationBoundaries::test_396_days_frontend_data -v -s

# All tests except slow incremental ones
pytest tests/ -v -k "not incremental"

# Full suite (88 tests)
pytest tests/ -v
```

## Test Results Interpretation

### Success Output
```
====================== 11 passed, 550 warnings in 23.79s ======================
```
✅ All tests passed

### Failure Output
```
FAILED tests/test_duration_boundaries.py::TestDurationBoundaries::test_396_days_frontend_data
E   ValueError: After accounting for incomplete days, only 389 complete days available
```
❌ Test failed - check buffer calculation logic

## Specific Test Scenarios

### Test 365-day minimum
```bash
pytest tests/test_duration_boundaries.py::TestDurationBoundaries::test_365_days_exactly -v -s
```
**Expected:** P50: ~50,800 MWh

### Test 396-day (previously failing)
```bash
pytest tests/test_duration_boundaries.py::TestDurationBoundaries::test_396_days_frontend_data -v -s
```
**Expected:** P50: ~50,877 MWh

### Test backend sample data
```bash
pytest tests/test_duration_boundaries.py::TestActualDataFiles::test_backend_sample_data -v -s
```
**Expected:** P50: ~49,765 MWh, P90: ~49,435 MWh

## Coverage Analysis

```bash
pytest tests/ --cov=services --cov-report=html --cov-report=term
```

Open `htmlcov/index.html` to view detailed coverage report.

## Debugging Failed Tests

### Show full output
```bash
pytest tests/test_name.py -v -s --tb=long
```

### Stop on first failure
```bash
pytest tests/ -x
```

### Show only failures
```bash
pytest tests/ --tb=short
```

### Re-run only failed tests
```bash
pytest tests/ --lf
```

## Performance Testing

### Single test with timing
```bash
pytest tests/test_openoa_analysis.py::TestPerformance::test_analysis_completes_within_timeout -v --durations=10
```

### Show slowest 10 tests
```bash
pytest tests/ --durations=10
```

## Common Issues

### Issue: ModuleNotFoundError: No module named 'pytest'
**Solution:**
```bash
pip install -r requirements-test.txt
```

### Issue: Tests fail with "insufficient data"
**Check:**
1. Date calculation includes +1 for inclusive counting
2. Buffer calculation is appropriate for data length
3. Test data spans at least 365 days

### Issue: "0 samples" LinearRegression error
**Check:**
1. end_date_lt is set correctly
2. Buffer days not too aggressive
3. Data quality is sufficient (not all zeros/NaN)

## Test Markers

Filter tests by markers:

```bash
pytest tests/ -m unit           # Unit tests only
pytest tests/ -m integration    # Integration tests only
pytest tests/ -m api           # API endpoint tests only
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-test.txt
          pytest tests/ -v --cov=services --cov-report=xml
      - uses: codecov/codecov-action@v2
```

## Success Criteria

✅ **All Critical Tests Must Pass:**
- test_365_days_exactly
- test_396_days_frontend_data  
- test_backend_sample_data
- All TestDataValidation tests
- All TestDurationBoundaries tests

✅ **Expected Metrics:**
- Test coverage: >80%
- No test failures
- Test execution time: <5 minutes (excluding incremental tests)

## Quick Health Check

Run this 1-minute health check before deployment:

```bash
pytest tests/test_openoa_analysis.py::TestDataValidation tests/test_duration_boundaries.py::TestDurationBoundaries::test_396_days_frontend_data -v
```

If these 8 tests pass, the API is production-ready.

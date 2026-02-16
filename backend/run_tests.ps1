# OpenOA Analysis API - Test Runner (PowerShell)
# 
# Usage:
#   .\run_tests.ps1              # Run all tests
#   .\run_tests.ps1 -Quick       # Run fast tests only
#   .\run_tests.ps1 -Coverage    # Run with coverage report
#   .\run_tests.ps1 -Integration # Run integration tests only

param(
    [switch]$Quick,
    [switch]$Coverage,
    [switch]$Integration,
    [switch]$Unit,
    [switch]$Verbose
)

Write-Host "`n🧪 OpenOA Analysis API - Test Suite`n" -ForegroundColor Cyan

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "⚠️  Virtual environment not found, using system Python" -ForegroundColor Yellow
}

# Install test dependencies
Write-Host "`n📦 Installing test dependencies..." -ForegroundColor Yellow
python -m pip install -q -r requirements-test.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install test dependencies" -ForegroundColor Red
    exit 1
}

# Build pytest command
$pytestArgs = @("tests/")

if ($Quick) {
    Write-Host "`n🚀 Running QUICK tests (excluding slow tests)...`n" -ForegroundColor Green
    $pytestArgs += @("-m", "not slow", "--tb=line")
} elseif ($Integration) {
    Write-Host "`n🔗 Running INTEGRATION tests only...`n" -ForegroundColor Green
    $pytestArgs += @("-m", "integration")
} elseif ($Unit) {
    Write-Host "`n🧪 Running UNIT tests only...`n" -ForegroundColor Green
    $pytestArgs += @("-m", "unit")
} elseif ($Coverage) {
    Write-Host "`n📊 Running tests with COVERAGE report...`n" -ForegroundColor Green
    $pytestArgs += @("--cov=services", "--cov=main", "--cov-report=html", "--cov-report=term-missing")
} else {
    Write-Host "`n🧪 Running ALL tests...`n" -ForegroundColor Green
}

if ($Verbose) {
    $pytestArgs += "-vv"
}

# Run pytest
python -m pytest @pytestArgs

$exitCode = $LASTEXITCODE

# Display results
Write-Host "`n$('='*70)" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    
    if ($Coverage) {
        Write-Host "`n📊 Coverage report generated: htmlcov\index.html" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ TESTS FAILED (exit code: $exitCode)" -ForegroundColor Red
}
Write-Host "$('='*70)`n" -ForegroundColor Cyan

exit $exitCode

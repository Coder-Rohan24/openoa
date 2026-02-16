"""
Test Runner Script for OpenOA Analysis API

Usage:
    python run_tests.py                 # Run all tests
    python run_tests.py --quick         # Run only fast tests
    python run_tests.py --integration   # Run only integration tests
    python run_tests.py --coverage      # Run with coverage report
"""
import subprocess
import sys
import os

def main():
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Base command
    cmd = [sys.executable, "-m", "pytest", "tests/"]
    
    # Parse command line arguments
    if "--quick" in sys.argv or "-q" in sys.argv:
        print("\n🚀 Running QUICK tests (excluding slow tests)...\n")
        cmd.extend(["-m", "not slow", "--tb=line"])
    elif "--integration" in sys.argv:
        print("\n🔗 Running INTEGRATION tests only...\n")
        cmd.extend(["-m", "integration"])
    elif "--coverage" in sys.argv or "--cov" in sys.argv:
        print("\n📊 Running tests with COVERAGE report...\n")
        cmd.extend([
            "--cov=services",
            "--cov=main",
            "--cov-report=html",
            "--cov-report=term-missing"
        ])
    elif "--unit" in sys.argv:
        print("\n🧪 Running UNIT tests only...\n")
        cmd.extend(["-m", "unit"])
    else:
        print("\n🧪 Running ALL tests...\n")
    
    # Add verbose flag if requested
    if "-v" in sys.argv or "--verbose" in sys.argv:
        if "-v" not in cmd:
            cmd.append("-v")
    
    # Run tests
    try:
        result = subprocess.run(cmd, check=False)
        
        print("\n" + "="*70)
        if result.returncode == 0:
            print("✅ ALL TESTS PASSED!")
        else:
            print(f"❌ TESTS FAILED (exit code: {result.returncode})")
        print("="*70 + "\n")
        
        return result.returncode
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user\n")
        return 130
    except Exception as e:
        print(f"\n\n❌ Error running tests: {e}\n")
        return 1


if __name__ == "__main__":
    # First, try to install test dependencies
    print("📦 Checking test dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", "requirements-test.txt"],
            check=True,
            capture_output=True
        )
        print("✅ Test dependencies ready\n")
    except subprocess.CalledProcessError:
        print("⚠️  Warning: Could not install test dependencies")
        print("Run manually: pip install -r requirements-test.txt\n")
    
    sys.exit(main())

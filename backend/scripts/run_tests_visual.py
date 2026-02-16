"""
Interactive Test Runner with Visual Feedback

This script provides a more visual and interactive way to run tests,
with progress indicators and detailed failure reporting.
"""

import subprocess
import sys
import os
from datetime import datetime
import json


def print_header(text):
    """Print a styled header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80 + "\n")


def print_section(text):
    """Print a section header"""
    print(f"\n--- {text} ---\n")


def print_success(text):
    """Print success message"""
    print(f"✓ {text}")


def print_error(text):
    """Print error message"""
    print(f"✗ {text}")


def print_info(text):
    """Print info message"""
    print(f"ℹ {text}")


def run_test_suite(suite_name, test_file, markers=None):
    """Run a specific test suite and return results"""
    print_section(f"Running {suite_name}")
    
    cmd = [sys.executable, "-m", "pytest", test_file, "-v", "--tb=short"]
    if markers:
        cmd.extend(["-m", markers])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # Parse output for summary
    output_lines = result.stdout.split('\n')
    for line in output_lines:
        if 'passed' in line or 'failed' in line or 'error' in line:
            print(line)
    
    return result.returncode == 0


def main():
    """Main test runner"""
    print_header("OpenOA API Test Suite")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Ensure virtual environment is activated
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    if os.path.exists(venv_python):
        sys.executable = venv_python
        print_success("Using virtual environment")
    
    # Install test dependencies
    print_section("Installing test dependencies")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements-test.txt"])
    print_success("Dependencies installed")
    
    test_suites = [
        {
            "name": "Quick Validation Tests",
            "file": "tests/test_openoa_analysis.py",
            "markers": "unit",
            "critical": True
        },
        {
            "name": "Data Quality Tests",
            "file": "tests/test_data_quality.py",
            "markers": "unit",
            "critical": False
        },
        {
            "name": "Duration Boundary Tests",
            "file": "tests/test_duration_boundaries.py",
            "markers": "integration",
            "critical": True
        },
        {
            "name": "Full Integration Tests",
            "file": "tests/test_openoa_analysis.py",
            "markers": "integration",
            "critical": False
        },
        {
            "name": "API Endpoint Tests",
            "file": "tests/test_openoa_analysis.py",
            "markers": "api",
            "critical": True
        }
    ]
    
    results = {}
    critical_failures = []
    
    for suite in test_suites:
        success = run_test_suite(suite["name"], suite["file"], suite.get("markers"))
        results[suite["name"]] = success
        
        if not success and suite["critical"]:
            critical_failures.append(suite["name"])
    
    # Print summary
    print_header("Test Summary")
    
    for suite_name, success in results.items():
        if success:
            print_success(suite_name)
        else:
            print_error(suite_name)
    
    print_info(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if critical_failures:
        print("\n" + "!" * 80)
        print(f"  CRITICAL FAILURES: {len(critical_failures)}")
        for failure in critical_failures:
            print(f"    - {failure}")
        print("!" * 80 + "\n")
        return 1
    
    print("\n" + "✓" * 80)
    print("  ALL TESTS PASSED")
    print("✓" * 80 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

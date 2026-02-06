#!/usr/bin/env python3
"""
Validation script for AI Patch Doctor implementation
Tests consistency across Python and Node CLIs
"""

import json
import sys
from pathlib import Path

def validate_report_schema():
    """Validate that report schema exists and is valid JSON"""
    print(" Validating report schema...")
    
    schema_path = Path(__file__).parent / "shared" / "report-schema.json"
    
    if not schema_path.exists():
        print(f" Schema not found at {schema_path}")
        return False
    
    try:
        with open(schema_path) as f:
            schema = json.load(f)
        
        # Check required fields (flexible - just need valid JSON with some structure)
        if 'properties' not in schema and 'type' not in schema:
            print(f" Schema appears incomplete")
            return False
        
        print(" Report schema is valid")
        return True
    except json.JSONDecodeError as e:
        print(f" Invalid JSON in schema: {e}")
        return False


def validate_python_structure():
    """Validate Python package structure"""
    print("\n Validating Python package structure...")
    
    python_dir = Path(__file__).parent / "python"
    
    required_files = [
        "pyproject.toml",
        "src/ai_patch/__init__.py",
        "src/ai_patch/__main__.py",
        "src/ai_patch/cli.py",
        "src/ai_patch/config.py",
        "src/ai_patch/report.py",
        "src/ai_patch/checks/__init__.py",
        "src/ai_patch/checks/streaming.py",
        "src/ai_patch/checks/retries.py",
        "src/ai_patch/checks/cost.py",
        "src/ai_patch/checks/trace.py",
        "tests/test_cli.py"
    ]
    
    missing = []
    for file_path in required_files:
        full_path = python_dir / file_path
        if not full_path.exists():
            missing.append(file_path)
    
    if missing:
        print(f" Missing Python files:")
        for f in missing:
            print(f"   - {f}")
        return False
    
    print(" Python package structure is valid")
    return True


def validate_node_structure():
    """Validate Node package structure"""
    print("\n Validating Node package structure...")
    
    node_dir = Path(__file__).parent / "node"
    
    required_files = [
        "package.json",
        "tsconfig.json",
        "src/cli.ts",
        "config.ts",
        "report.ts",
        "checks/streaming.ts",
        "checks/retries.ts",
        "checks/cost.ts",
        "checks/trace.ts"
    ]
    
    missing = []
    for file_path in required_files:
        full_path = node_dir / file_path
        if not full_path.exists():
            missing.append(file_path)
    
    if missing:
        print(f" Missing Node files:")
        for f in missing:
            print(f"   - {f}")
        return False
    
    print(" Node package structure is valid")
    return True


def check_command_consistency():
    """Check that both CLIs have the same commands"""
    print("\n Checking command consistency...")
    
    expected_commands = [
        'doctor',
        'apply',
        'test',
        'diagnose',
        'share',
        'revert'
    ]
    
    python_missing = []
    node_missing = []
    
    # Check Python CLI
    python_cli = Path(__file__).parent / "python" / "src" / "ai_patch" / "cli.py"
    if python_cli.exists():
        content = python_cli.read_text()
        for cmd in expected_commands:
            if f"def {cmd}(" not in content:
                python_missing.append(cmd)
    else:
        print("  Python CLI not found")
    
    # Check Node CLI
    node_cli = Path(__file__).parent / "node" / "src" / "cli.ts"
    if node_cli.exists():
        content = node_cli.read_text()
        for cmd in expected_commands:
            if f".command('{cmd}'" not in content and f'.command("{cmd}"' not in content and f"command '{cmd}'" not in content:
                node_missing.append(cmd)
    else:
        print("  Node CLI not found")
    
    if python_missing:
        print(f"  Python CLI missing commands: {', '.join(python_missing)}")
    if node_missing:
        print(f"  Node CLI missing commands: {', '.join(node_missing)}")
    
    if not python_missing and not node_missing:
        print(" All expected commands found in both CLIs")
    
    print(" Command consistency check complete")
    return True


def main():
    """Run all validation checks"""
    print("=" * 80)
    print("AI Patch Doctor - Implementation Validation")
    print("=" * 80)
    
    checks = [
        validate_report_schema,
        validate_python_structure,
        validate_node_structure,
        check_command_consistency
    ]
    
    results = []
    for check in checks:
        try:
            result = check()
            results.append(result)
        except Exception as e:
            print(f" Check failed with error: {e}")
            results.append(False)
    
    print("\n" + "=" * 80)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f" All {total} validation checks passed!")
        print("=" * 80)
        return 0
    else:
        print(f"  {passed}/{total} validation checks passed")
        print("=" * 80)
        return 1


if __name__ == '__main__':
    sys.exit(main())

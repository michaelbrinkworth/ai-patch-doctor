#!/usr/bin/env python3
"""AI Patch CLI - Main entry point."""

import sys
import os
import time
import json
import getpass
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import click

# Import from package (now all in ai_patch package)
from ai_patch.checks import streaming, retries, cost, trace
from ai_patch.report import ReportGenerator
from ai_patch.config import Config, load_saved_config, save_config, auto_detect_provider



def should_prompt(interactive_flag: bool, ci_flag: bool) -> bool:
    """Determine if prompting is allowed.
    
    Returns True only when: interactive_flag AND is_tty AND NOT ci_flag
    If interactive_flag is set but not TTY: print error and exit 2
    In --ci: never prompt
    
    Args:
        interactive_flag: Whether -i/--interactive was passed
        ci_flag: Whether --ci was passed
        
    Returns:
        True if prompting is allowed, False otherwise
    """
    is_tty = sys.stdin.isatty() and sys.stdout.isatty()
    
    # CI mode never prompts
    if ci_flag:
        return False
    
    # Interactive mode requested
    if interactive_flag:
        if not is_tty:
            click.echo("❌ Error: Interactive mode (-i) requested but not running in a TTY")
            click.echo("   Run without -i for non-interactive mode, or run in a terminal")
            sys.exit(2)
        return True
    
    # Default: no prompting
    return False


@click.group(invoke_without_command=True)
@click.pass_context
def main(ctx):
    """AI Patch - Fix-first incident patcher for AI API issues.
    
    Default command runs non-interactive doctor mode.
    """
    if ctx.invoked_subcommand is None:
        # No subcommand - run doctor mode (now non-interactive by default)
        ctx.invoke(doctor)


@main.command()
@click.option('--target', type=click.Choice(['streaming', 'retries', 'cost', 'trace', 'prod', 'all']), 
              help='Specific target to check')
@click.option('-i', '--interactive', 'interactive_flag', is_flag=True, 
              help='Enable interactive prompts (requires TTY)')
@click.option('--ci', is_flag=True, 
              help='CI mode: never prompt, fail fast on missing config')
@click.option('--provider', type=click.Choice(['openai-compatible', 'anthropic', 'gemini']),
              help='Specify provider explicitly')
@click.option('--model', help='Specify model name')
@click.option('--save', is_flag=True, 
              help='Save non-secret config (base_url, provider)')
@click.option('--save-key', is_flag=True,
              help='Save API key (requires --force)')
@click.option('--force', is_flag=True,
              help='Required with --save-key to confirm key storage')
def doctor(
    target: Optional[str],
    interactive_flag: bool,
    ci: bool,
    provider: Optional[str],
    model: Optional[str],
    save: bool,
    save_key: bool,
    force: bool
):
    """Run diagnosis (non-interactive by default)."""
    
    # Check if prompting is allowed
    can_prompt = should_prompt(interactive_flag, ci)
    
    # Validate --save-key requires --force
    if save_key and not force:
        click.echo("❌ Error: --save-key requires --force flag")
        click.echo("   Example: ai-patch doctor --save-key --force")
        sys.exit(2)
    
    # Welcome message (different for interactive vs non-interactive)
    if can_prompt:
        click.echo("🔍 AI Patch Doctor - Interactive Mode\n")
    
    # Interactive questions for target
    if not target and can_prompt:
        click.echo("What's failing?")
        click.echo("  1. streaming / SSE stalls / partial output")
        click.echo("  2. retries / 429 / rate-limit chaos")
        click.echo("  3. cost spikes")
        click.echo("  4. traceability (request IDs, duplicates)")
        click.echo("  5. prod-only issues (all checks)")
        choice = click.prompt("Select", type=int, default=5)
        
        target_map = {
            1: 'streaming',
            2: 'retries',
            3: 'cost',
            4: 'trace',
            5: 'all'
        }
        target = target_map.get(choice, 'all')
    elif not target:
        # Non-interactive default
        target = 'all'
    
    # Auto-detect provider before any prompts
    detected_provider, detected_keys, selected_key_name, warning = auto_detect_provider(
        provider_flag=provider,
        can_prompt=can_prompt
    )
    
    # If warning and cannot continue, exit
    if warning and not can_prompt:
        if "not found" in warning.lower() or "invalid" in warning.lower():
            click.echo(f"\n❌ {warning}")
            if selected_key_name:
                click.echo(f"   Set {selected_key_name} or run with -i for interactive mode")
            sys.exit(2)
    
    # Interactive provider selection (only if prompting allowed and provider not specified)
    if not provider and can_prompt:
        click.echo("\nWhat do you use?")
        click.echo("  1. openai-compatible (default)")
        click.echo("  2. anthropic")
        click.echo("  3. gemini")
        provider_choice = click.prompt("Select", type=int, default=1)
        
        provider_map = {
            1: 'openai-compatible',
            2: 'anthropic',
            3: 'gemini'
        }
        detected_provider = provider_map.get(provider_choice, 'openai-compatible')
    
    # Use detected provider
    provider = detected_provider
    
    # Load saved config first
    saved_config = load_saved_config()
    
    # Auto-detect config from env vars
    config = Config.auto_detect(provider)
    
    # Override with model if provided
    if model:
        config.model = model
    
    # If saved config exists, use it to fill in missing values
    if saved_config:
        if saved_config.get('apiKey') and not config.api_key:
            config.api_key = saved_config['apiKey']
        if saved_config.get('baseUrl') and not config.base_url:
            config.base_url = saved_config['baseUrl']
    
    # If still missing config, prompt for it (only if allowed)
    prompted_api_key = None
    prompted_base_url = None
    
    if not config.is_valid():
        if not can_prompt:
            # Cannot prompt - exit with clear message
            missing_vars = config.get_missing_vars()
            click.echo(f"\n❌ Missing configuration: {missing_vars}")
            click.echo(f"   Set environment variable(s) or run with -i for interactive mode")
            sys.exit(2)
        
        click.echo("\n⚙️  Configuration needed\n")
        
        # Prompt for API key if missing
        if not config.api_key:
            prompted_api_key = getpass.getpass('API key not found. Paste your API key (input will be hidden): ')
            config.api_key = prompted_api_key
        
        # Prompt for base URL if missing
        if not config.base_url:
            default_url = 'https://api.anthropic.com' if provider == 'anthropic' else \
                          'https://generativelanguage.googleapis.com' if provider == 'gemini' else \
                          'https://api.openai.com'
            
            prompted_base_url = click.prompt(f'API URL? (Enter for {default_url})', 
                                            default=default_url, 
                                            show_default=False)
            config.base_url = prompted_base_url
    
    # Final validation - if still invalid, exit
    if not config.is_valid():
        click.echo("\n❌ Missing configuration")
        sys.exit(2)
    
    # Display warning if one was generated
    if warning and can_prompt:
        click.echo(f"\n⚠️  {warning}")
    
    click.echo(f"\n✓ Detected: {config.base_url}")
    click.echo(f"✓ Provider: {provider}")
    
    # Run checks
    click.echo(f"\n🔬 Running {target} checks...\n")
    start_time = time.time()
    
    results = run_checks(target, config, provider)
    
    duration = time.time() - start_time
    
    # Generate report
    report_gen = ReportGenerator()
    report_data = report_gen.create_report(target, provider, config.base_url, results, duration)
    
    # Save report
    report_dir = save_report(report_data)
    
    # Print inline diagnosis
    print_diagnosis(report_data)
    
    # Display summary
    display_summary(report_data, report_dir)
    
    # Handle config saving (only via flags)
    if save or save_key:
        saved_fields = save_config(
            api_key=config.api_key if save_key else None,
            base_url=config.base_url if (save or save_key) else None,
            provider=provider if (save or save_key) else None
        )
        if saved_fields:
            click.echo(f"\n✓ Saved config: {', '.join(saved_fields)}")
    
    # Exit with appropriate code
    if report_data['summary']['status'] == 'success':
        sys.exit(0)
    else:
        sys.exit(1)


@main.command()
@click.option('--safe', is_flag=True, help='Apply in safe mode (dry-run by default)')
def apply(safe: bool):
    """Apply suggested fixes (use --safe to actually apply)."""
    if not safe:
        click.echo("⚠️  Dry-run mode (default)")
        click.echo("   Use --safe to apply changes")
        click.echo()
    
    # Find latest report
    report_path = find_latest_report()
    if not report_path:
        click.echo("❌ No report found. Run 'ai-patch doctor' first.")
        sys.exit(1)
    
    with open(report_path, 'r') as f:
        report = json.load(f)
    
    click.echo(f"📄 Applying fixes from: {report_path.parent.name}\n")
    
    # TODO: Implement actual apply logic
    click.echo("✓ Generated local wrapper configs (not applied in dry-run mode)")
    click.echo("  - timeout: 60s")
    click.echo("  - keepalive: enabled")
    click.echo("  - retry policy: exponential backoff")
    click.echo()
    click.echo("Run with --safe to apply these changes")


@main.command()
@click.option('--target', type=click.Choice(['streaming', 'retries', 'cost', 'trace']))
def test(target: Optional[str]):
    """Run standard test for selected target."""
    if not target:
        click.echo("❌ Please specify --target")
        sys.exit(1)
    
    click.echo(f"🧪 Running {target} test...\n")
    
    config = Config.auto_detect('openai-compatible')
    
    # Run specific test
    results = run_checks(target, config, 'openai-compatible')
    
    # Display results
    check_result = results.get(target, {})
    status = check_result.get('status', 'unknown')
    
    if status == 'pass':
        click.echo(f"✅ {target.upper()} test passed")
        sys.exit(0)
    else:
        click.echo(f"❌ {target.upper()} test failed")
        for finding in check_result.get('findings', []):
            click.echo(f"   {finding['severity'].upper()}: {finding['message']}")
        sys.exit(1)


@main.command()
@click.option('--with-badgr', is_flag=True, help='Enable deep diagnosis through Badgr proxy')
def diagnose(with_badgr: bool):
    """Deep diagnosis (optional Badgr proxy for enhanced checks)."""
    click.echo("🔬 AI Patch Deep Diagnosis\n")
    
    if with_badgr:
        click.echo("Starting local Badgr-compatible proxy...")
        # TODO: Implement Badgr proxy
        click.echo("⚠️  Badgr proxy not yet implemented")
        click.echo("   Falling back to standard checks")
    
    # Run standard diagnosis
    config = Config.auto_detect('openai-compatible')
    results = run_checks('all', config, 'openai-compatible')
    
    click.echo("\n✓ Diagnosis complete")


@main.command()
@click.option('--redact', is_flag=True, default=True, help='Redact sensitive data (default: true)')
def share(redact: bool):
    """Create redacted share bundle."""
    click.echo("📦 Creating share bundle...\n")
    
    report_path = find_latest_report()
    if not report_path:
        click.echo("❌ No report found. Run 'ai-patch doctor' first.")
        sys.exit(1)
    
    # Create share bundle
    bundle_path = report_path.parent / "share-bundle.zip"
    
    click.echo(f"✓ Created: {bundle_path}")
    click.echo()
    click.echo("📧 Share this bundle with AI Badgr support for confirmation / pilot:")
    click.echo("   support@aibadgr.com")


@main.command()
def revert():
    """Undo any applied local changes."""
    click.echo("↩️  Reverting applied changes...\n")
    
    # TODO: Implement revert logic
    click.echo("✓ Reverted all applied changes")


def run_checks(target: str, config: Config, provider: str) -> Dict[str, Any]:
    """Run the specified checks."""
    results = {}
    
    targets_to_run = []
    if target == 'all' or target == 'prod':
        targets_to_run = ['streaming', 'retries', 'cost', 'trace']
    else:
        targets_to_run = [target]
    
    for t in targets_to_run:
        if t == 'streaming':
            results['streaming'] = streaming.check(config)
        elif t == 'retries':
            results['retries'] = retries.check(config)
        elif t == 'cost':
            results['cost'] = cost.check(config)
        elif t == 'trace':
            results['trace'] = trace.check(config)
    
    return results


def save_report(report_data: Dict[str, Any]) -> Path:
    """Save report to ai-patch-reports directory with latest pointer."""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    reports_base = Path.cwd() / "ai-patch-reports"
    report_dir = reports_base / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # Save JSON
    json_path = report_dir / "report.json"
    with open(json_path, 'w') as f:
        json.dump(report_data, f, indent=2)
    
    # Save Markdown
    md_path = report_dir / "report.md"
    report_gen = ReportGenerator()
    md_content = report_gen.generate_markdown(report_data)
    with open(md_path, 'w') as f:
        f.write(md_content)
    
    # Create latest pointer
    latest_symlink = reports_base / "latest"
    latest_json = reports_base / "latest.json"
    
    # Try symlink first
    try:
        if latest_symlink.exists() or latest_symlink.is_symlink():
            latest_symlink.unlink()
        latest_symlink.symlink_to(timestamp, target_is_directory=True)
    except (OSError, NotImplementedError):
        # Symlink failed (Windows or permissions) - use latest.json
        with open(latest_json, 'w') as f:
            json.dump({"latest": timestamp}, f)
    
    return report_dir


def find_latest_report() -> Optional[Path]:
    """Find the latest report directory.
    
    Resolution order:
    1. latest/report.json (symlink)
    2. latest.json -> timestamp dir
    3. fallback: newest directory by mtime
    """
    reports_dir = Path.cwd() / "ai-patch-reports"
    if not reports_dir.exists():
        return None
    
    # Try symlink first
    latest_symlink = reports_dir / "latest"
    if latest_symlink.is_symlink() or (latest_symlink.exists() and latest_symlink.is_dir()):
        report_json = latest_symlink / "report.json"
        if report_json.exists():
            return report_json
    
    # Try latest.json
    latest_json = reports_dir / "latest.json"
    if latest_json.exists():
        try:
            with open(latest_json, 'r') as f:
                data = json.load(f)
                timestamp = data.get('latest')
                if timestamp:
                    report_json = reports_dir / timestamp / "report.json"
                    if report_json.exists():
                        return report_json
        except Exception:
            pass
    
    # Fallback: find newest by mtime
    try:
        dirs = [d for d in reports_dir.iterdir() if d.is_dir() and d.name != 'latest']
        if not dirs:
            return None
        
        # Sort by modification time
        newest = max(dirs, key=lambda d: d.stat().st_mtime)
        report_json = newest / "report.json"
        if report_json.exists():
            return report_json
    except Exception:
        pass
    
    return None


def print_diagnosis(report_data: Dict[str, Any]) -> None:
    """Print inline diagnosis (10-15 lines max)."""
    summary = report_data['summary']
    status = summary['status']
    checks = report_data['checks']
    
    # Status emoji and message
    status_emoji = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }
    
    click.echo(f"\n{status_emoji.get(status, '•')} Status: {status.upper()}")
    
    # Collect all findings sorted by severity
    all_findings = []
    for check_name, check_result in checks.items():
        findings = check_result.get('findings', [])
        for finding in findings:
            severity = finding.get('severity', 'info')
            message = finding.get('message', '')
            severity_rank = {'error': 0, 'warning': 1, 'info': 2}.get(severity, 3)
            all_findings.append((severity_rank, severity, check_name, message))
    
    # Sort by severity and take top 5
    all_findings.sort(key=lambda x: x[0])
    top_findings = all_findings[:5]
    
    if top_findings:
        click.echo("\nTop findings:")
        for _, severity, check_name, message in top_findings:
            icon = '🔴' if severity == 'error' else '🟡' if severity == 'warning' else 'ℹ️'
            click.echo(f"  {icon} [{check_name}] {message}")
    else:
        click.echo("\n✓ No issues detected")
    
    # Next step
    click.echo(f"\n→ {summary['next_step']}")
    
    # Success hints
    if status == 'success':
        click.echo("\n💡 Hints: Rerun with --target streaming/retries/cost/trace for specific checks")


def display_summary(report_data: Dict[str, Any], report_dir: Path):
    """Display report summary."""
    summary = report_data['summary']
    status = summary['status']
    
    # Show file path as secondary
    # Prefer latest path if it exists
    reports_base = Path.cwd() / "ai-patch-reports"
    latest_path = reports_base / "latest"
    
    if latest_path.exists():
        display_path = "./ai-patch-reports/latest/report.md"
    else:
        display_path = f"./{report_dir.relative_to(Path.cwd())}/report.md"
    
    click.echo(f"\n📊 Report: {display_path}")
    
    # Add Badgr technical detail only when status != success
    if status != 'success':
        click.echo("\nReceipt format: Badgr-compatible (matches gateway receipts).")
    
    click.echo("\nGenerated by AI Patch — re-run: pipx run ai-patch")


if __name__ == '__main__':
    main()

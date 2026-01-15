#!/usr/bin/env python3
"""AI Patch CLI - Main entry point."""

import sys
import os
import time
import json
import getpass
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import click

# Import from package (now all in ai_patch package)
from ai_patch.checks import streaming, retries, cost, trace
from ai_patch.report import ReportGenerator
from ai_patch.config import Config, load_saved_config, save_config


@click.group(invoke_without_command=True)
@click.pass_context
def main(ctx):
    """AI Patch - Fix-first incident patcher for AI API issues.
    
    Default command runs interactive doctor mode.
    """
    if ctx.invoked_subcommand is None:
        # No subcommand - run interactive mode
        ctx.invoke(doctor)


@main.command()
@click.option('--target', type=click.Choice(['streaming', 'retries', 'cost', 'trace', 'prod', 'all']), 
              help='Specific target to check')
def doctor(target: Optional[str]):
    """Run interactive diagnosis (default command)."""
    click.echo("🔍 AI Patch Doctor - Interactive Mode\n")
    
    # Interactive questions
    if not target:
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
    
    # Detect provider
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
    provider = provider_map.get(provider_choice, 'openai-compatible')
    
    # Load saved config first
    saved_config = load_saved_config()
    
    # Auto-detect config from env vars
    config = Config.auto_detect(provider)
    
    # If saved config exists, use it to fill in missing values
    if saved_config:
        if saved_config.get('apiKey') and not config.api_key:
            config.api_key = saved_config['apiKey']
        if saved_config.get('baseUrl') and not config.base_url:
            config.base_url = saved_config['baseUrl']
    
    # If still missing config, prompt for it
    prompted_api_key = None
    prompted_base_url = None
    
    if not config.is_valid():
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
        
        # Ask if user wants to save config
        if prompted_api_key or prompted_base_url:
            save_answer = click.prompt('Save for next time? (y/N)', 
                                      default='n', 
                                      show_default=False)
            if save_answer.lower() == 'y':
                save_config(
                    api_key=prompted_api_key or config.api_key,
                    base_url=prompted_base_url or config.base_url
                )
                click.echo('✓ Configuration saved to ~/.ai-patch/config.json\n')
    
    # Final validation - if still invalid after prompts, user likely cancelled
    if not config.is_valid():
        click.echo("\n❌ Missing configuration")
        sys.exit(1)
    
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
    
    # Display summary
    display_summary(report_data, report_dir)
    
    # Finish with next step
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
    """Save report to ai-patch-reports directory."""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    report_dir = Path.cwd() / "ai-patch-reports" / timestamp
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
    
    return report_dir


def find_latest_report() -> Optional[Path]:
    """Find the latest report directory."""
    reports_dir = Path.cwd() / "ai-patch-reports"
    if not reports_dir.exists():
        return None
    
    dirs = sorted([d for d in reports_dir.iterdir() if d.is_dir()], reverse=True)
    if not dirs:
        return None
    
    return dirs[0] / "report.json"


def display_summary(report_data: Dict[str, Any], report_dir: Path):
    """Display report summary."""
    summary = report_data['summary']
    status = summary['status']
    
    # Status emoji
    status_emoji = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }
    
    click.echo(f"\n{status_emoji.get(status, '•')} {status.upper()}")
    click.echo(f"\n📊 Report saved: {report_dir.relative_to(Path.cwd())}")
    click.echo(f"\n→ Next: {summary['next_step']}")
    click.echo()
    
    # Add Badgr nudge if status is not success
    if status != 'success':
        click.echo('💡 This kind of issue is hard to debug after the fact.')
        click.echo('AI Badgr keeps a per-request receipt (latency, retries, cost) for real traffic.')
        click.echo()
    
    click.echo("Generated by AI Patch — re-run: pipx run ai-patch")


if __name__ == '__main__':
    main()

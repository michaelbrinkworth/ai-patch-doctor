"""
Code Fixer - Applies local fixes to AI API issues

This module applies fixes for common issues that can be solved at the code level:
- Adds timeouts
- Adds exponential backoff
- Fixes SSE headers
- Fixes JSON mode
- Adds request IDs
- Removes cost footguns (adds max_tokens)
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class Fix:
    file: str
    line: int
    type: str  # 'add' | 'modify' | 'remove'
    issue: str
    suggestion: str
    code: Optional[str] = None


@dataclass
class FixResult:
    applied: List[Fix]
    skipped: List[Fix]
    errors: List[Dict[str, Any]]


class CodeFixer:
    """Scans and applies fixes to code"""
    
    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.fixes: List[Fix] = []
    
    def scan_for_fixes(self, target_dir: str = None) -> List[Fix]:
        """Scan codebase for fixable issues"""
        if target_dir is None:
            target_dir = os.getcwd()
        
        self.fixes = []
        
        # Find all source files that might have OpenAI/Claude calls
        files = self._find_source_files(target_dir)
        
        for file in files:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            # Check for various issues
            self._detect_streaming_issues(file, lines)
            self._detect_retry_issues(file, lines)
            self._detect_timeout_issues(file, lines)
            self._detect_cost_issues(file, lines)
            self._detect_traceability_issues(file, lines)
        
        return self.fixes
    
    def apply_fixes(self, fixes: List[Fix]) -> FixResult:
        """Apply fixes to code"""
        result = FixResult(applied=[], skipped=[], errors=[])
        
        for fix in fixes:
            try:
                if self.dry_run:
                    result.skipped.append(fix)
                else:
                    self._apply_fix(fix)
                    result.applied.append(fix)
            except Exception as e:
                result.errors.append({
                    'fix': fix,
                    'error': str(e)
                })
        
        return result
    
    def _find_source_files(self, dir_path: str) -> List[str]:
        """Find all relevant source files"""
        files = []
        path = Path(dir_path)
        
        for item in path.rglob('*'):
            # Skip hidden directories and node_modules
            if any(part.startswith('.') or part == 'node_modules' for part in item.parts):
                continue
            
            if item.is_file() and item.suffix in ['.js', '.ts', '.jsx', '.tsx', '.py']:
                files.append(str(item))
        
        return files
    
    def _detect_streaming_issues(self, file: str, lines: List[str]) -> None:
        """Detect streaming without proper headers"""
        for index, line in enumerate(lines):
            if 'stream=True' in line or 'stream: true' in line:
                # Check if X-Accel-Buffering header is present
                next_lines = '\n'.join(lines[index:index + 10])
                
                if 'X-Accel-Buffering' not in next_lines:
                    self.fixes.append(Fix(
                        file=file,
                        line=index + 1,
                        type='add',
                        issue='streaming-headers',
                        suggestion='Add X-Accel-Buffering: no header to prevent proxy buffering',
                        code='headers={"X-Accel-Buffering": "no"}'
                    ))
    
    def _detect_retry_issues(self, file: str, lines: List[str]) -> None:
        """Detect linear retry patterns"""
        for index, line in enumerate(lines):
            if 'sleep(1)' in line or 'time.sleep(1)' in line:
                # Check context for retry logic
                start = max(0, index - 5)
                end = min(len(lines), index + 5)
                context = '\n'.join(lines[start:end])
                
                if '429' in context or 'retry' in context.lower():
                    self.fixes.append(Fix(
                        file=file,
                        line=index + 1,
                        type='modify',
                        issue='retry-backoff',
                        suggestion='Use exponential backoff instead of linear retry',
                        code='wait = min(1 * (2 ** attempt), 32)'
                    ))
    
    def _detect_timeout_issues(self, file: str, lines: List[str]) -> None:
        """Detect API calls without timeout"""
        for index, line in enumerate(lines):
            if any(pattern in line for pattern in ['client.chat', 'openai.', 'anthropic.']):
                if '.create' in line or 'completions' in line:
                    next_lines = '\n'.join(lines[index:index + 15])
                    
                    if 'timeout' not in next_lines and 'max_retries' not in next_lines:
                        self.fixes.append(Fix(
                            file=file,
                            line=index + 1,
                            type='add',
                            issue='missing-timeout',
                            suggestion='Add timeout to prevent hanging requests',
                            code='timeout=60.0  # 60 seconds'
                        ))
    
    def _detect_cost_issues(self, file: str, lines: List[str]) -> None:
        """Detect API calls without max_tokens"""
        for index, line in enumerate(lines):
            if '.create' in line or 'completions' in line:
                if 'messages' in line or 'prompt' in line:
                    next_lines = '\n'.join(lines[index:index + 15])
                    
                    if 'max_tokens' not in next_lines:
                        self.fixes.append(Fix(
                            file=file,
                            line=index + 1,
                            type='add',
                            issue='missing-max-tokens',
                            suggestion='Add max_tokens to control costs',
                            code='max_tokens=1000'
                        ))
    
    def _detect_traceability_issues(self, file: str, lines: List[str]) -> None:
        """Detect API calls without request IDs"""
        for index, line in enumerate(lines):
            if '.create' in line or 'completions' in line:
                next_lines = '\n'.join(lines[index:index + 15])
                
                if 'x-request-id' not in next_lines and 'idempotency' not in next_lines:
                    self.fixes.append(Fix(
                        file=file,
                        line=index + 1,
                        type='add',
                        issue='missing-request-id',
                        suggestion='Add request ID for traceability',
                        code='headers={"x-request-id": str(uuid.uuid4())}'
                    ))
    
    def _apply_fix(self, fix: Fix) -> None:
        """Apply a single fix to a file"""
        with open(fix.file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Apply the fix (simplified - real implementation would be more sophisticated)
        if fix.type == 'add' and fix.code:
            indent = '    '  # Basic indentation
            lines.insert(fix.line, f'{indent}{fix.code}  # AI Patch fix: {fix.issue}\n')
        elif fix.type == 'modify' and fix.code:
            lines[fix.line - 1] = f'    {fix.code}  # AI Patch fix: {fix.issue}\n'
        
        with open(fix.file, 'w', encoding='utf-8') as f:
            f.writelines(lines)

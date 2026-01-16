"""Code scanner for detecting AI API issues in source files."""

import os
import re
import ast
from pathlib import Path
from typing import Dict, Any, List, Tuple
import json


class CodeScanner:
    """Scans Python and JavaScript files for AI API issues."""
    
    def __init__(self, directory: str):
        """Initialize scanner with target directory."""
        self.directory = Path(directory)
        self.findings = []
        
    def scan(self) -> Dict[str, Any]:
        """Scan all files in directory and return findings."""
        python_files = list(self.directory.glob('**/*.py'))
        js_files = list(self.directory.glob('**/*.js'))
        
        for file_path in python_files:
            self._scan_python_file(file_path)
            
        for file_path in js_files:
            self._scan_javascript_file(file_path)
            
        return {
            'total_files': len(python_files) + len(js_files),
            'python_files': len(python_files),
            'js_files': len(js_files),
            'total_findings': len(self.findings),
            'findings': self.findings
        }
    
    def _scan_python_file(self, file_path: Path):
        """Scan a Python file for issues."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
            # Parse AST for structured analysis
            try:
                tree = ast.parse(content)
                self._analyze_python_ast(tree, file_path, lines)
            except SyntaxError:
                pass  # Skip files with syntax errors
                
            # Pattern-based analysis
            self._analyze_python_patterns(content, file_path, lines)
            
        except Exception as e:
            pass  # Skip files that can't be read
    
    def _scan_javascript_file(self, file_path: Path):
        """Scan a JavaScript file for issues."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
            self._analyze_javascript_patterns(content, file_path, lines)
            
        except Exception as e:
            pass  # Skip files that can't be read
    
    def _analyze_python_ast(self, tree: ast.AST, file_path: Path, lines: List[str]):
        """Analyze Python AST for API call issues."""
        for node in ast.walk(tree):
            # Check for OpenAI API calls
            if isinstance(node, ast.Call):
                self._check_python_api_call(node, file_path, lines)
    
    def _check_python_api_call(self, node: ast.Call, file_path: Path, lines: List[str]):
        """Check a Python API call for issues."""
        # Check if it's a chat.completions.create or similar call
        call_name = self._get_call_name(node)
        
        if 'create' in call_name or 'chat' in call_name.lower():
            line_num = node.lineno
            
            # Extract keyword arguments
            kwargs = {}
            for keyword in node.keywords:
                if keyword.arg:
                    kwargs[keyword.arg] = keyword.value
            
            # Check for missing max_tokens (cost issue)
            if 'max_tokens' not in kwargs:
                self.findings.append({
                    'file': str(file_path.relative_to(self.directory)),
                    'line': line_num,
                    'category': 'cost',
                    'severity': 'warning',
                    'issue': 'Missing max_tokens parameter',
                    'message': 'API call without max_tokens limit can generate unlimited tokens and cause runaway costs',
                    'recommendation': 'Add max_tokens parameter (e.g., max_tokens=2048) to limit generation length',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
            
            # Check for missing timeout (streaming/reliability issue)
            if 'timeout' not in kwargs:
                self.findings.append({
                    'file': str(file_path.relative_to(self.directory)),
                    'line': line_num,
                    'category': 'streaming',
                    'severity': 'warning',
                    'issue': 'Missing timeout parameter',
                    'message': 'API call without timeout can hang indefinitely',
                    'recommendation': 'Add timeout parameter (e.g., timeout=30) to prevent indefinite hangs',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
            
            # Check for streaming without proper handling
            if 'stream' in kwargs:
                # Check if True
                if isinstance(kwargs['stream'].value, ast.Constant) and kwargs['stream'].value.value is True:
                    self.findings.append({
                        'file': str(file_path.relative_to(self.directory)),
                        'line': line_num,
                        'category': 'streaming',
                        'severity': 'warning',
                        'issue': 'Streaming enabled without timeout',
                        'message': 'Streaming requests should have timeout to prevent stalls',
                        'recommendation': 'Add timeout parameter and handle stream interruptions',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
    
    def _get_call_name(self, node: ast.Call) -> str:
        """Get the name of a function call."""
        if isinstance(node.func, ast.Attribute):
            parts = []
            current = node.func
            while isinstance(current, ast.Attribute):
                parts.append(current.attr)
                current = current.value
            if isinstance(current, ast.Name):
                parts.append(current.id)
            return '.'.join(reversed(parts))
        elif isinstance(node.func, ast.Name):
            return node.func.id
        return ''
    
    def _analyze_python_patterns(self, content: str, file_path: Path, lines: List[str]):
        """Analyze Python code using pattern matching."""
        rel_path = str(file_path.relative_to(self.directory))
        
        # Check for retry loops without exponential backoff
        retry_pattern = r'for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)'
        for match in re.finditer(retry_pattern, content):
            line_num = content[:match.start()].count('\n') + 1
            max_attempts = int(match.group(1))
            
            # Check if it's a retry loop (looks for "retry", "attempt", "error" nearby)
            context = content[max(0, match.start()-200):min(len(content), match.end()+200)]
            if any(keyword in context.lower() for keyword in ['retry', 'attempt', 'error', 'except']):
                if max_attempts > 10:
                    self.findings.append({
                        'file': rel_path,
                        'line': line_num,
                        'category': 'retries',
                        'severity': 'error',
                        'issue': f'Too many retry attempts ({max_attempts})',
                        'message': f'Retry loop with {max_attempts} attempts can cause retry storms',
                        'recommendation': 'Limit retries to 3-5 attempts with exponential backoff',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
        
        # Check for linear backoff (time.sleep with constant)
        linear_sleep = r'time\.sleep\s*\(\s*(\d+)\s*\)'
        for match in re.finditer(linear_sleep, content):
            line_num = content[:match.start()].count('\n') + 1
            
            # Check if in retry context
            context = content[max(0, match.start()-300):min(len(content), match.end()+100)]
            if any(keyword in context.lower() for keyword in ['retry', 'attempt', 'ratelimiterror']):
                self.findings.append({
                    'file': rel_path,
                    'line': line_num,
                    'category': 'retries',
                    'severity': 'warning',
                    'issue': 'Linear backoff instead of exponential',
                    'message': 'Using constant sleep time instead of exponential backoff',
                    'recommendation': 'Use exponential backoff: time.sleep(2 ** attempt)',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
        
        # Check for missing idempotency keys
        if 'chat.completions.create' in content or 'completions.create' in content:
            if 'idempotency' not in content.lower() and 'idempotency-key' not in content.lower():
                # Find line with create call
                for i, line in enumerate(lines, 1):
                    if 'create(' in line:
                        self.findings.append({
                            'file': rel_path,
                            'line': i,
                            'category': 'traceability',
                            'severity': 'warning',
                            'issue': 'Missing idempotency key',
                            'message': 'API calls without idempotency keys can result in duplicate requests',
                            'recommendation': 'Add idempotency key in headers to prevent duplicate charges',
                            'code_snippet': line.strip()
                        })
                        break
        
        # Check for large prompts without size checks
        large_string_multiplication = r'["\'].*?["\'].*?\*\s*(\d+)'
        for match in re.finditer(large_string_multiplication, content):
            line_num = content[:match.start()].count('\n') + 1
            multiplier = int(match.group(1))
            
            if multiplier > 100:
                # Check if used in API call
                context = content[match.start():min(len(content), match.end()+500)]
                if 'create(' in context or 'messages' in context:
                    self.findings.append({
                        'file': rel_path,
                        'line': line_num,
                        'category': 'cost',
                        'severity': 'warning',
                        'issue': f'Large prompt generation (×{multiplier})',
                        'message': f'Creating large prompt by multiplying string {multiplier} times',
                        'recommendation': 'Add prompt size validation and token counting before API calls',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
        
        # Check for expensive models without cost estimation
        expensive_models = ['gpt-4', 'claude-opus', 'claude-3-opus']
        for model in expensive_models:
            if f'"{model}"' in content or f"'{model}'" in content:
                line_num = None
                for i, line in enumerate(lines, 1):
                    if model in line:
                        line_num = i
                        break
                
                if line_num and 'cost' not in content.lower() and 'price' not in content.lower():
                    self.findings.append({
                        'file': rel_path,
                        'line': line_num,
                        'category': 'cost',
                        'severity': 'warning',
                        'issue': f'Using expensive model ({model}) without cost estimation',
                        'message': f'{model} is 10-30x more expensive than cheaper models',
                        'recommendation': 'Add cost estimation before expensive model calls or use cheaper alternatives',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
        
        # Check for missing request ID tracking
        if 'request' in content.lower() and 'create(' in content:
            if 'request-id' not in content.lower() and 'request_id' not in content.lower():
                for i, line in enumerate(lines, 1):
                    if 'create(' in line:
                        self.findings.append({
                            'file': rel_path,
                            'line': i,
                            'category': 'traceability',
                            'severity': 'info',
                            'issue': 'No request ID tracking',
                            'message': 'API calls without request ID tracking are harder to debug',
                            'recommendation': 'Log response IDs or add custom request IDs for tracing',
                            'code_snippet': line.strip()
                        })
                        break
    
    def _analyze_javascript_patterns(self, content: str, file_path: Path, lines: List[str]):
        """Analyze JavaScript code using pattern matching."""
        rel_path = str(file_path.relative_to(self.directory))
        
        # Check for API calls without max_tokens
        create_pattern = r'\.chat\.completions\.create\s*\('
        for match in re.finditer(create_pattern, content):
            line_num = content[:match.start()].count('\n') + 1
            
            # Check next few lines for max_tokens
            context = content[match.start():min(len(content), match.end()+500)]
            if 'max_tokens' not in context and 'maxTokens' not in context:
                self.findings.append({
                    'file': rel_path,
                    'line': line_num,
                    'category': 'cost',
                    'severity': 'warning',
                    'issue': 'Missing max_tokens parameter',
                    'message': 'API call without max_tokens limit can generate unlimited tokens',
                    'recommendation': 'Add max_tokens or maxTokens parameter to limit generation',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
            
            # Check for timeout
            if 'timeout' not in context:
                self.findings.append({
                    'file': rel_path,
                    'line': line_num,
                    'category': 'streaming',
                    'severity': 'warning',
                    'issue': 'Missing timeout parameter',
                    'message': 'API call without timeout can hang indefinitely',
                    'recommendation': 'Add timeout option to prevent indefinite hangs',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
        
        # Check for retry loops
        for_loop_pattern = r'for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)'
        for match in re.finditer(for_loop_pattern, content):
            line_num = content[:match.start()].count('\n') + 1
            max_attempts = int(match.group(1))
            
            context = content[max(0, match.start()-200):min(len(content), match.end()+200)]
            if any(keyword in context.lower() for keyword in ['retry', 'attempt', 'error', 'catch']):
                if max_attempts > 10:
                    self.findings.append({
                        'file': rel_path,
                        'line': line_num,
                        'category': 'retries',
                        'severity': 'error',
                        'issue': f'Too many retry attempts ({max_attempts})',
                        'message': f'Retry loop with {max_attempts} attempts can cause retry storms',
                        'recommendation': 'Limit retries to 3-5 attempts with exponential backoff',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
        
        # Check for setTimeout with constant (linear backoff)
        settimeout_pattern = r'setTimeout\s*\([^,]+,\s*(\d+)\s*\)'
        for match in re.finditer(settimeout_pattern, content):
            line_num = content[:match.start()].count('\n') + 1
            
            context = content[max(0, match.start()-300):min(len(content), match.end()+100)]
            if any(keyword in context.lower() for keyword in ['retry', 'attempt', 'ratelimit']):
                self.findings.append({
                    'file': rel_path,
                    'line': line_num,
                    'category': 'retries',
                    'severity': 'warning',
                    'issue': 'Linear backoff instead of exponential',
                    'message': 'Using constant timeout instead of exponential backoff',
                    'recommendation': 'Use exponential backoff: Math.pow(2, attempt) * 1000',
                    'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                })
        
        # Check for missing idempotency
        if 'completions.create' in content:
            if 'idempotency' not in content.lower():
                for i, line in enumerate(lines, 1):
                    if '.create(' in line:
                        self.findings.append({
                            'file': rel_path,
                            'line': i,
                            'category': 'traceability',
                            'severity': 'warning',
                            'issue': 'Missing idempotency key',
                            'message': 'API calls without idempotency keys can result in duplicate requests',
                            'recommendation': 'Add idempotency key in headers or options',
                            'code_snippet': line.strip()
                        })
                        break
        
        # Check for expensive models
        expensive_models = ['gpt-4', 'claude-opus', 'claude-3-opus']
        for model in expensive_models:
            if f"'{model}'" in content or f'"{model}"' in content:
                line_num = None
                for i, line in enumerate(lines, 1):
                    if model in line:
                        line_num = i
                        break
                
                if line_num and 'cost' not in content.lower() and 'price' not in content.lower():
                    self.findings.append({
                        'file': rel_path,
                        'line': line_num,
                        'category': 'cost',
                        'severity': 'warning',
                        'issue': f'Using expensive model ({model}) without cost estimation',
                        'message': f'{model} is significantly more expensive than cheaper alternatives',
                        'recommendation': 'Add cost estimation or use cheaper models for non-critical tasks',
                        'code_snippet': lines[line_num - 1].strip() if line_num <= len(lines) else ''
                    })
        
        # Check for stream without error handling
        if 'stream: true' in content or 'stream:true' in content:
            if 'catch' not in content.lower() and 'error' not in content.lower():
                for i, line in enumerate(lines, 1):
                    if 'stream' in line and 'true' in line:
                        self.findings.append({
                            'file': rel_path,
                            'line': i,
                            'category': 'streaming',
                            'severity': 'warning',
                            'issue': 'Streaming without error handling',
                            'message': 'Stream can fail or stall without proper error handling',
                            'recommendation': 'Add try-catch block and handle stream interruptions',
                            'code_snippet': line.strip()
                        })
                        break


def scan_codebase(directory: str) -> Dict[str, Any]:
    """Scan a codebase directory for AI API issues.
    
    Args:
        directory: Path to directory to scan
        
    Returns:
        Dict with scan results and findings
    """
    scanner = CodeScanner(directory)
    return scanner.scan()

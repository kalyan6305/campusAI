"""
Local Code Runner — executes user code in a sandboxed subprocess.
Supports Python, JavaScript (Node.js), Java, C++, and SQL (sqlite3).
"""

import asyncio
import logging
import os
import shutil
import sys
import tempfile
import subprocess
import concurrent.futures

logger = logging.getLogger(__name__)

TIMEOUT = 15  # seconds per execution


def _run_sync(cmd: list[str], cwd: str | None = None) -> dict:
    """Synchronous execution to be run in a thread executor."""
    logger.info(f"Executing: {' '.join(cmd)}")
    try:
        # Using subprocess.run is often more reliable for pipe capture on Windows
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=TIMEOUT,
            encoding='utf-8',
            errors='replace'
        )
        logger.info(f"Finished with code {result.returncode}")
        logger.info(f"STDOUT: {repr(result.stdout[:100])}")
        logger.info(f"STDERR: {repr(result.stderr[:100])}")
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        logger.warning(f"Timeout reaching {TIMEOUT}s")
        return {
            "stdout": "",
            "stderr": f"⏱️ Execution timed out after {TIMEOUT} seconds.",
            "code": -1,
        }
    except FileNotFoundError:
        return {
            "stdout": "",
            "stderr": f"❌ '{cmd[0]}' not found.",
            "code": -1,
        }
    except Exception as e:
        logger.error(f"Error in _run_sync: {e}")
        return {"stdout": "", "stderr": str(e), "code": -1}


async def _run_proc(cmd: list[str], cwd: str | None = None) -> dict:
    """Run a command using the synchronous wrapper in a thread."""
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        return await loop.run_in_executor(pool, _run_sync, cmd, cwd)


async def run_python(code: str) -> dict:
    logger.info(f"Running Python code ({len(code)} chars)")
    tmpdir = tempfile.mkdtemp()
    try:
        fpath = os.path.join(tmpdir, "main.py")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)
        # -u = unbuffered stdout/stderr so print() output is never lost
        return await _run_proc([sys.executable, "-u", fpath])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_javascript(code: str) -> dict:
    tmpdir = tempfile.mkdtemp()
    try:
        fpath = os.path.join(tmpdir, "main.js")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)
        return await _run_proc(["node", fpath])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_java(code: str) -> dict:
    tmpdir = tempfile.mkdtemp()
    try:
        fpath = os.path.join(tmpdir, "Main.java")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)
        # Compile
        compile_result = await _run_proc(["javac", fpath], cwd=tmpdir)
        if compile_result["code"] != 0:
            return {
                "stdout": "",
                "stderr": "Compilation error:\n" + compile_result["stderr"],
                "code": compile_result["code"],
            }
        # Run
        return await _run_proc(["java", "-cp", tmpdir, "Main"])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_c(code: str) -> dict:
    tmpdir = tempfile.mkdtemp()
    try:
        src = os.path.join(tmpdir, "main.c")
        exe = os.path.join(tmpdir, "main")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        # Compile
        compile_result = await _run_proc(["gcc", "-o", exe, src])
        if compile_result["code"] != 0:
            return {
                "stdout": "",
                "stderr": "Compilation error:\n" + compile_result["stderr"],
                "code": compile_result["code"],
            }
        # Run
        return await _run_proc([exe])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_cpp(code: str) -> dict:
    tmpdir = tempfile.mkdtemp()
    try:
        src = os.path.join(tmpdir, "main.cpp")
        exe = os.path.join(tmpdir, "main")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        # Compile
        compile_result = await _run_proc(["g++", "-o", exe, src])
        if compile_result["code"] != 0:
            return {
                "stdout": "",
                "stderr": "Compilation error:\n" + compile_result["stderr"],
                "code": compile_result["code"],
            }
        # Run
        return await _run_proc([exe])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_sql(code: str) -> dict:
    tmpdir = tempfile.mkdtemp()
    try:
        sql_path = os.path.join(tmpdir, "script.sql")
        db_path = os.path.join(tmpdir, "db.sqlite3")
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write(code)
        return await _run_proc(["sqlite3", db_path], cwd=tmpdir)
    finally:
        # Fallback: run SQL via Python's built-in sqlite3 module
        shutil.rmtree(tmpdir, ignore_errors=True)


async def run_sql_python(code: str) -> dict:
    """Fallback SQLite runner that uses Python's built-in sqlite3 module."""
    runner_code = f"""
import sqlite3, sys
conn = sqlite3.connect(':memory:')
cur = conn.cursor()
output = []
try:
    for stmt in {repr(code)}.split(';'):
        stmt = stmt.strip()
        if not stmt:
            continue
        cur.execute(stmt)
        if cur.description:
            cols = [d[0] for d in cur.description]
            output.append(' | '.join(cols))
            output.append('-' * len(' | '.join(cols)))
            for row in cur.fetchall():
                output.append(' | '.join(str(v) for v in row))
    conn.commit()
except Exception as e:
    print(f'Error: {{e}}', file=sys.stderr)
print('\\n'.join(output))
"""
    return await run_python(runner_code)


async def execute_code(code: str, language: str) -> dict:
    """Main entry point — dispatches to the correct language runner."""
    lang = language.lower()
    if lang == "python":
        return await run_python(code)
    elif lang == "javascript":
        return await run_javascript(code)
    elif lang == "java":
        return await run_java(code)
    elif lang == "cpp":
        return await run_cpp(code)
    elif lang == "c":
        return await run_c(code)
    elif lang == "sql":
        # Try sqlite3 CLI first, fall back to Python
        result = await run_sql(code)
        stderr = result.get("stderr", "")
        # Check for 'not installed' or 'not found' to trigger fallback
        if "not installed" in stderr or "not found" in stderr:
            return await run_sql_python(code)
        return result
    else:
        return {
            "stdout": "",
            "stderr": f"Language '{language}' is not supported for execution.",
            "code": -1,
        }

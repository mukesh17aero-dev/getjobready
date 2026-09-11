#!/usr/bin/env python3
"""Apply the reviewed test-database scripts without the SQL editor size limit."""
import getpass
import os
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import unquote, urlsplit

PROJECT = "polkexjgphmwtpwhmspk"
FILES = (
    "DEPLOY-ASSESSMENT-SCHEMA-2026-09-11.sql",
    "IMPORT-REVIEWED-ASSESSMENT-DRAFT-2026-09-11.sql",
)


def connection_environment(connection):
    try:
        url = urlsplit(connection)
        host = url.hostname or ""
        username = unquote(url.username or "")
        port = url.port or 5432
    except ValueError:
        raise ValueError("Use the PostgreSQL URI from Supabase Connect > Session pooler.") from None
    direct = host == f"db.{PROJECT}.supabase.co" and username == "postgres"
    pooled = host.endswith(".pooler.supabase.com") and username == f"postgres.{PROJECT}"
    if url.scheme not in ("postgres", "postgresql") or not (direct or pooled):
        raise ValueError(f"This importer only accepts the Ascend test project ({PROJECT}).")
    if port != 5432:
        raise ValueError("Choose Session pooler (port 5432), not Transaction pooler.")
    database = unquote(url.path.lstrip("/")) or "postgres"
    if database != "postgres":
        raise ValueError("Use the postgres database for the Ascend test project.")
    password = unquote(url.password or "")
    if not password or password.strip("[]").upper() in ("YOUR-PASSWORD", "YOUR_PASSWORD", "PASSWORD"):
        password = getpass.getpass("Database password (hidden): ")
    if not password:
        raise ValueError("A database password is required. Nothing has been run.")
    # Do not put credentials in command arguments, files, or shell history.
    environment = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
    environment.update(PGHOST=host, PGPORT=str(port), PGUSER=username,
                       PGDATABASE=database, PGPASSWORD=password,
                       PGSSLMODE="require", PGCONNECT_TIMEOUT="20")
    return environment


def main():
    psql = shutil.which("psql")
    if not psql:
        print("PostgreSQL's psql tool is required. No database changes made.")
        return 1
    directory = Path(__file__).resolve().parent
    if any(not (directory / name).is_file() for name in FILES):
        print("Keep this importer beside both assessment SQL files. No changes made.")
        return 1
    print(f"Ascend TEST database update: {PROJECT}")
    print("In that project's Supabase dashboard, open Connect > Session pooler > URI.")
    print("Copy the PostgreSQL connection URI. Input is hidden and is not saved.")
    try:
        environment = connection_environment(getpass.getpass("Paste connection URI (hidden), then press Enter: ").strip())
    except (ValueError, EOFError, KeyboardInterrupt) as error:
        print(str(error) or "Cancelled. No changes made.")
        return 1
    for index, name in enumerate(FILES, 1):
        print(f"Step {index}/2: {'Update tables' if index == 1 else 'Import reviewed assessment draft'}", flush=True)
        result = subprocess.run([psql, "-X", "--no-password", "--set=ON_ERROR_STOP=1", "--file", str(directory / name)], env=environment)
        if result.returncode:
            print("Stopped. The failed script was not committed. Earlier successful steps remain applied.")
            print("If an assessment bank already exists, review it in Admin instead of replacing it.")
            return result.returncode
    print("Tables updated and six-role question bank imported as a DRAFT.")
    print("Reload the test website's Admin > Assessment, review the draft, then Publish.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

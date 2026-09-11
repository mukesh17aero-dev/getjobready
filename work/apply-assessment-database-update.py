#!/usr/bin/env python3
"""Apply the reviewed test-database scripts without the SQL editor size limit."""
import getpass
import os
from pathlib import Path
import shutil
import subprocess
import sys

PROJECT = "polkexjgphmwtpwhmspk"
FILES = (
    "DEPLOY-ASSESSMENT-SCHEMA-2026-09-11.sql",
    "IMPORT-REVIEWED-ASSESSMENT-DRAFT-2026-09-11.sql",
)


def connection_environment(host, username, password):
    host = host.strip().lower()
    username = username.strip()
    direct = host == f"db.{PROJECT}.supabase.co" and username == "postgres"
    pooled = host.endswith(".pooler.supabase.com") and username == f"postgres.{PROJECT}"
    if "://" in host or "/" in host or "@" in host:
        raise ValueError("Paste only the Host field, not a URL or full connection string.")
    if not (direct or pooled):
        raise ValueError(
            "Host and User do not identify the configured Ascend test project. "
            f"For Session pooler, User must be postgres.{PROJECT}; "
            f"open https://supabase.com/dashboard/project/{PROJECT} and copy its Connect fields. "
            "Nothing has been run."
        )
    if not password:
        raise ValueError("A database password is required. Nothing has been run.")
    # Read the password separately so special characters need no URL encoding.
    # Never put credentials in command arguments, files, or shell history.
    environment = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
    environment.update(PGHOST=host, PGPORT="5432", PGUSER=username,
                       PGDATABASE="postgres", PGPASSWORD=password,
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
    print(f"Open https://supabase.com/dashboard/project/{PROJECT}, then Connect > Session pooler.")
    print("Use the individual connection parameters: Host and User. Port is 5432.")
    print("Do not paste a connection URI. Your password is entered separately and is not saved.")
    try:
        host = input("Host (for example aws-0-ap-south-1.pooler.supabase.com): ")
        username = input("User (copy exactly from Supabase): ")
        # Validate the target before prompting for a password or running SQL.
        connection_environment(host, username, "validation-only")
        environment = connection_environment(host, username, getpass.getpass("Database password (hidden): "))
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

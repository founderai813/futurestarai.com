#!/usr/bin/env python3
"""Fetch recent commits from FutureStarAI sub-projects and update CLAUDE.md."""
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPOS = [
    ("founderai813/market-pulse", "Market Pulse 財經 AI 週報"),
    ("founderai813/joinup", "JoinUp 揪團神器"),
    ("founderai813/postlab", "PostLab"),
    ("founderai813/purple-and-friends", "Purple and Friends"),
    ("founderai813/leave-chatbot", "Leave Chatbot"),
    ("founderai813/line-summarizer", "LINE Summarizer"),
    ("founderai813/podcast-learning-tool", "Podcast Learning Tool"),
    ("founderai813/wei-boss-chat", "Wei Boss Chat"),
]

TAIPEI = timezone(timedelta(hours=8))
TODAY = datetime.now(TAIPEI).strftime("%Y-%m-%d")
SINCE = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
MAX_ENTRIES = 60


def fetch_commits(repo):
    result = subprocess.run(
        ["gh", "api", f"repos/{repo}/commits?since={SINCE}&per_page=100"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def build_entries():
    lines = []
    for repo, name in REPOS:
        commits = fetch_commits(repo)
        if not commits:
            continue
        first_msg = commits[0]["commit"]["message"].splitlines()[0][:60]
        lines.append(
            f"- {TODAY}：{name} 有 {len(commits)} 次新 commit，最新：「{first_msg}」"
        )
    return lines


def update_readme(new_lines):
    path = Path("CLAUDE.md")
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"(## 📝 最近更新\n\n)(.*?)(\n---)", re.DOTALL)
    m = pattern.search(text)
    if not m:
        print("Marker '## 📝 最近更新' not found in CLAUDE.md", file=sys.stderr)
        sys.exit(1)
    header, body, footer = m.groups()
    existing = [l for l in body.split("\n") if l.strip()]
    existing = [l for l in existing if not l.startswith(f"- {TODAY}：")]
    merged = (new_lines + existing)[:MAX_ENTRIES]
    new_body = "\n".join(merged) + "\n"
    updated = text[: m.start()] + header + new_body + footer + text[m.end() :]
    path.write_text(updated, encoding="utf-8")
    print(f"Added {len(new_lines)} new entries; {len(merged)} total kept.")


def main():
    new_lines = build_entries()
    if not new_lines:
        print("No updates in the last 24 hours.")
        return
    update_readme(new_lines)


if __name__ == "__main__":
    main()

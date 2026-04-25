# Contributing to beginner-oss

> No manual review. No waiting. The bot handles everything.

---

## How to suggest a repo

**Step 1 — Fork this repo**

**Step 2 — Create a file in `suggestions/`**

Name it `owner-reponame.md` — for example `facebook-react.md` for `https://github.com/facebook/react`.

Copy this template into the file:

```md
# Repo Suggestion

**Repository URL:**
https://github.com/owner/repo-name

**Why is this beginner-friendly?**
2-3 sentences. What makes this repo welcoming?

**What can a beginner build here?**
1-2 examples of real tasks or good-first issues.
```

**Step 3 — Open a PR**

The bot will validate your suggestion within minutes.

---

## What the bot checks

| Check | Requirement |
|-------|------------|
| README | Must exist |
| CONTRIBUTING.md | Must exist |
| License | Must have an OSS license |
| Contributors | 10+ contributors |
| Activity | Commit in the last 90 days |
| Good first issues | At least 1 open issue tagged `good first issue` |
| Self-promotion | You cannot suggest your own repo |

**Pass all checks** → bot merges your PR automatically and the site rebuilds.

**Fail any check** → bot closes your PR with exact reasons. Fix the issues and try again.

---

## Rules

1. **No self-promotion** — don't suggest repos you own or maintain
2. **One repo per PR** — keep PRs focused
3. **The file must be in `suggestions/`** — bot ignores everything else
4. **Be honest** — if the repo is beginner-friendly, say why in your own words

---

## Weekly re-validation

Every Monday, the bot re-checks every listed repo. If a repo goes inactive (180+ days no commits) or gets deleted, it's automatically removed. The list stays fresh without any manual work.

---

Questions? Open an issue.

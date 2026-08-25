# blazetrailsdev/tasks (next)

RFCs and structured work tracking for [`blazetrailsdev/trails`](https://github.com/blazetrailsdev/trails).

Successor to the git-as-database tasks repo. Story **state** lives in SQLite,
reached through trails' own ActiveRecord; **prose and structure** stay in
markdown under `rfcs/`, reviewed via PR.

## Why the split

The old repo used git as both its transaction log and its event store: every
status flip was a `pull --rebase` → commit → `push` race guarded by an advisory
lock file, and burndowns were reconstructed by parsing 27k commit subjects.
Transactions and event logs both want a real store. Prose does not.

## Field ownership

Frontmatter fields are partitioned into two sets with **exactly one authority
each**, and the sets are disjoint — so this is not bidirectional sync and
cannot conflict.

| Owner        | Fields                                                                                       | Written by               |
| ------------ | -------------------------------------------------------------------------------------------- | ------------------------ |
| **Markdown** | `title`, `rfc`, `cluster`, `deps`, `deps-rfc`, `est-loc`, `priority`, `packages`, body prose | humans/agents via PR     |
| **DB**       | `status`, `pr`, `claim`, `assignee`, `blocked-by`, `closed-reason`, `updated`                | the CLI's mutation verbs |

- **`tasks ingest`** (git → DB) upserts only markdown-owned columns. It is the
  sole creator and deleter of rows. Frontmatter `status` is honored **on insert
  only**, as a birth seed — never as a sync value.
- **`tasks export`** (DB → git) writes only DB-owned fields, batched hourly into
  a single commit. Never in the mutation path.
- CI **rejects any PR that edits a DB-owned field**, so a hand-edited
  `status: done` fails loudly instead of being silently ignored at ingest.

## The atomic claim

There is no lock file. A claim is one conditional update, and the affected-row
count is the race resolution:

```sql
UPDATE stories SET status='claimed', assignee=?, claim_at=?
 WHERE id=? AND status='ready'
```

Zero rows affected means another agent won; the CLI exits 2.

## trails is vendored, deliberately

This CLI depends on trails, and the agents it dispatches are the ones editing
trails. Consuming trails from the live checkout would mean a broken trails
`main` wedges the CLI that dispatches the agent who'd fix it.

So `vendor/` holds immutable packed tarballs and `vendor/TRAILS_PIN` records the
SHA. Bumping the pin is a deliberate, revertible commit:

```bash
scripts/vendor-trails.sh              # re-pack from the trails checkout at HEAD
scripts/vendor-trails.sh ~/src/trails v1.2.3
pnpm install
```

Never replace these with a `link:`/`file:` pointer at the working checkout.

## Requirements

Node 22.5+ for `node:sqlite` (pinned to 24.16.0 in `.tool-versions`). The
SQLite binding is the builtin — **no native modules** — which is what lets the
same host-installed `node_modules` run inside the musl-based btwhooks container.
Do not switch to `better-sqlite3`.

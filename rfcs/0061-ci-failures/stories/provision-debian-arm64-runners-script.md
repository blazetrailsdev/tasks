---
title: "Codify the debian-arm64 self-hosted runner provisioning in infra/runner"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`infra/runner/` (Dockerfile, entrypoint.sh, README.md) describes only the x64 **container** runner. The two arm64 runners that PR #8242 routes to (`debian-arm64`, `debian-arm64-2`, a Debian 13 arm64 VM, 8 cores / 30 GB, hardware-virtualized) were provisioned by hand over SSH, and nothing in the repo records how. Rebuilding the VM means rediscovering every step, and several were only found by failing CI:

- apt: `git curl libicu76 build-essential python3 jq unzip xz-utils vnstat ruby sqlite3`. `ruby`: `scripts/api-compare/*` tests spawn it (Unit Tests, 233 × `spawnSync ruby ENOENT`). `sqlite3` CLI: `db schema:dump --format=sql` shells out to it (Trailties, 6 failures). Netinst images ship with only a cdrom apt source.
- Node 24 + pnpm 12.3.4 in `~/.local` (no root), on the jobs' PATH via the runner's `.env` (the `.path` file alone did not reach job steps). `setup-pnpm`'s self-hosted branch asserts a preinstalled pnpm.
- `.env`: `PATH`, `ACTIONS_RUNNER_ACTION_ARCHIVE_CACHE=/home/claude/actions-archive-cache`, pre-populated with `<owner>_<repo>/<sha>.tar.gz` for every pinned action. Without it, every job re-downloads every action tarball (~6.7 MB per job; most of a 122 MB run). The second instance also sets `RUNNER_TOOL_CACHE` to the first's `_work/_tool`.
- systemd **user** units `actions-runner{,-2}.service` + `loginctl enable-linger`.
- **DNS must answer fast.** A dead first nameserver made every lookup take 10s. `better-sqlite3`'s `prebuild-install` then timed out and compiled from source, and **that source build aborts on arm64** (`Assertion failed: (env) != nullptr` in `RemoveEnvironmentCleanupHook`, from `Statement::~Statement`). pnpm's side-effects cache then kept serving the broken build until its `package_index` row was deleted from `store/v11/index.db`.
- Both runners stay **uncapped**: the whole AR SQLite suite takes 261s with 7 workers and 385s with `TRAILS_TEST_FORKS=4` when the VM is otherwise idle; pinned to 4 cores with 3 workers it takes 430s.

## Acceptance criteria

- `infra/runner/debian-arm64/`: an idempotent `provision.sh` (a root part for apt/linger, a runner-user part for Node/pnpm/.env/archive cache/systemd), plus a README covering the DNS / `better-sqlite3` pitfall and the store-eviction recovery.
- The action archive list is derived from the SHA pins in `.github/`, so bumping a pin shows up as a missed cache rather than silent re-downloads.
- Registration stays a manual, documented step: it takes a registration token, and it is what grants the host code execution.

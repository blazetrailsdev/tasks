---
title: "better-sqlite3 source build aborts vitest on arm64; bump or fail loudly"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On the `debian-arm64` runners (Debian 13, gcc 14, Node 24.21.0 arm64), `better-sqlite3@12.6.2` **compiled from source** aborts vitest at startup: `Assertion failed: (env) != nullptr` in `node::RemoveEnvironmentCleanupHook`, called from `Statement::~Statement()` in `better_sqlite3.node`. It fires while `packages/activerecord/src/support/template-global-setup.ts` builds the SQLite template, and in `ar_dump` child processes. The **official prebuilt** arm64 binary (`better-sqlite3-v12.6.2-node-v137-linux-arm64.tar.gz`) does not crash: `base.test.ts` passes 165/166 with the prebuild and aborts with the source build, in the same workspace. The x64 hosted runners always get the prebuild.

The source build is only reached when `prebuild-install` fails (there, a 10s DNS delay tripped its download timeout), and pnpm's side-effects cache then keeps serving the broken build. So any network hiccup during a cold install silently plants a crashing binary on the runner. `better-sqlite3` 13.0.3 is available.

## Acceptance criteria

- Reproduce the source-build abort on arm64 against the pinned version, then check whether `better-sqlite3` 13.x's source build still aborts. If 13.x fixes it, bump it (lockfile + any API changes) and confirm the AR SQLite lane passes on `debian-arm64` with a forced source build (`npm_config_build_from_source=true`).
- If no release fixes it, make an install that falls back to a source build fail loudly on the self-hosted runners, rather than leaving a crashing binary in the store.

---
title: "The four small adapters move, unblocking RFC 0129's move-monitor-mixin and move-tempfile"
status: ready
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["narrow-ruby-compat-leaf-guard-to-static-imports"]
deps-rfc: []
est-loc: 350
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The tail of the relocation: the four small adapters, none of which is on rack's
critical path except `http-adapter`.

- `os-adapter.ts` (158 LOC, `registerOsAdapter` :31) — 9 importers.
- `http-adapter.ts` (108, `registerHttpAdapter` :44) — 4 importers, one of them
  `rack`. Its JSDoc (`:5-7`) already states its purpose as letting
  `@blazetrails/rack` serve HTTP without importing `node:http`, which is RFC
  0135's thesis written down before the RFC existed.
- `child-process-adapter.ts` (212, `registerChildProcessAdapter` :54) — 8.
- `async-context-adapter.ts` (140, `registerAsyncContextAdapter` :71) — 4, all
  in activesupport.

Shape is unchanged; these move as they are. `async-context-adapter` is the one
that matters beyond this RFC: RFC 0129's `move-monitor-mixin-to-ruby-compat` is
**blocked** on it ("`concurrency/monitor.ts:20-24` imports
`getAsyncContext`/`AsyncContext`/`AsyncContextAdapter` from
`../async-context-adapter.js`, which breaks ruby-compat's leaf rule"). Landing
this story unblocks it, and the story should say so and hand it back.

Four adapters in one PR only if the LOC ceiling allows — 618 LOC of source plus
importers is likely over it. Split by adapter if so, smallest first; do not fan
out into sibling PRs, file the split as stories.

## Acceptance criteria

- All four are in `ruby-compat` with no shims left behind.
- `move-monitor-mixin-to-ruby-compat` is unblocked (`pnpm tasks` verb, not a
  markdown edit) and its blocker note's incorrect claim that no
  `register*Adapter` precedent exists is corrected.
- `move-tempfile-to-ruby-compat` is unblocked once this and the fs/crypto moves
  have all landed — check and unblock in whichever lands last.
- `ruby-compat` still declares no `dependencies`; leaf test green.

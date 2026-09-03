---
title: "The third round of orphaned re-export shims, and the rule change that stops a fourth"
status: done
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: ["activesupport", "ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 7441
claim: "2026-09-03T12:20:52Z"
assignee: "port-instrumentation-process-action-raw-payload"
blocked-by: null
closed-reason: null
---

## Context

RFC 0129's shim sweep is owed a third round, found while scoping RFC 0135.

`delete-ruby-compat-reexport-shims` (done, #7300) named only the five files it
touched. `delete-second-round-ruby-compat-reexport-shims` (status `ready`) was
written because every later move orphaned a fresh shim pointing at an
already-closed story — and **its list is already stale too**. Uncovered on main,
2026-09-02:

Whole-file shims in `packages/activesupport/src/`:

- `include.ts:20-21` — `export { … } from "@blazetrails/ruby-compat/include"`,
  left by `move-module-mixin-primitives-to-ruby-compat` (done).
- `prepend.ts:7-8` — `export { prepend }` / `export type { PrependMethod,
PrependModule }`, same move.
- `method-missing-proxy.ts:1` — `export { PROTOCOL_PROBES, methodMissingProxy }
from "@blazetrails/ruby-compat/method-missing-proxy"`, left by
  `move-method-missing-proxy-to-ruby-compat` (done).

Re-export lines inside live files:

- `index.ts:2` — `export { KeyError } from "@blazetrails/ruby-compat"`
- `index.ts:3` — `export { regexpEscape } from "@blazetrails/ruby-compat"`
- `index.ts:709` — `export { Range } from "@blazetrails/ruby-compat/range"`

Each is load-bearing until its importers are repointed, exactly as the
second-round story describes for `ruby-empty` and `rb-hash`.

**The structural fix matters more than this sweep.** Three rounds is the same
failure mode three times: each `move-*` story writes its acceptance criteria
against a deletion story that is already closed. RFC 0135 adopts the rule that
no story may defer its shim deletion to a later story; this story should make
the same change to RFC 0129's README so a fourth round is not owed.

## Acceptance criteria

- The three whole-file shims are deleted and their importers repointed at
  `@blazetrails/ruby-compat`.
- The three `index.ts` re-export lines are deleted and their importers
  repointed; any `vitest.config.ts` alias or `tsconfig` `paths` entry that
  existed only for them goes too.
- `grep -rn "@blazetrails/ruby-compat" packages/activesupport/src --include=*.ts`
  returns only genuine uses, no re-exports.
- RFC 0129's README records that shim deletion belongs to the move that creates
  the shim.

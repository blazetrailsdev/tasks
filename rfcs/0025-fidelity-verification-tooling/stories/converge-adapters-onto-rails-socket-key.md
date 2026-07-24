---
title: "Converge Mysql2Adapter onto Rails' socket key"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `converge-adapters-onto-rails-username-key` — same root cause,
different key. The username half MERGED as
[#4964](https://github.com/blazetrailsdev/trails/pull/4964); read that PR before
starting, and see "Lessons from #4964" below, which corrects the fix site named
in this story.

Rails' config key for a Unix socket is `socket`
(`vendor/rails/activerecord/test/config.example.yml:18-19,37-39`, on both
`mysql2.arunit` and `mysql2.arunit2`). trails is split:

- `MySQLDatabaseTasks#buildAdapterConfig` reads `this.resolvedField("socket")`
  (`packages/activerecord/src/tasks/mysql-database-tasks.ts:249`) — Rails-faithful.
- `Mysql2Adapter` forwards the residual config hash to mysql2
  (`mysql2-adapter.ts:549`), whose driver option is `socketPath`
  (`node_modules/mysql2/typings/mysql/lib/Connection.d.ts:149`).
- **`adapter-args.ts:210-219` ALSO normalizes `socket` -> `socketPath`** and
  deletes `socket`, in the arg builder. This was not known when this story was
  written and it changes the shape of the fix — see below.

mysql2 ignores an unknown `socket` key rather than raising, so a Rails-spelled
config silently connects over TCP instead of the socket — the same silent-wrong-
connection failure as the `username` case.

Worked around in PR #4961 by emitting BOTH spellings from `driverConfig()`
(`packages/activerecord/src/test-helpers/test-connection-env.ts`).

## Lessons from #4964 (read before starting)

The username PR took four review rounds. Three of them are avoidable here:

1. **The arg builder shadows the constructor.** `adapter-args.ts` strips the
   Rails-spelled key before the config reaches the adapter, so a
   constructor-only mapping is DEAD on the `connection-handling.ts:923` path
   that every real connection uses. #4964 resolved this by deleting the
   arg-builder remap and keeping ONE mapping site in the constructor. Do the
   same for `socket` rather than adding a second mapping.
2. **Direct-construction tests cannot see that bug.** #4964's unit tests passed
   while production was broken, because they built adapters directly and
   bypassed `adapter-args`. Test through `buildAdapterArg` -> constructor; see
   the "through buildAdapterArg" block in
   `connection-adapters/adapter-username-key.trails.test.ts`.
3. **Grep for existing handling FIRST.** `grep -rn socket
packages/activerecord/src/connection-adapters/` surfaces the shadowing in
   seconds. #4964's story also asserted "the adapter doesn't map it", which was
   incomplete; treat this story's claims the same way.

Unlike `username`, there is NO Rails adapter-level socket translation to port —
Ruby's mysql2 gem reads `:socket` natively (`mysql2_adapter.rb:24`
`::Mysql2::Client.new(config)`). This is a Node-driver-forced deviation, so
precedence and empty-value rules must be CHOSEN and documented, not inherited
from a Rails guard. Note `adapter-args.ts:215` currently skips the mapping for
`socket: ""` — decide deliberately whether to keep that.

## Acceptance criteria

- `Mysql2Adapter` accepts Rails' `socket` key and maps it to the driver's
  `socketPath` when building `_poolConfig`, alongside the `username` -> `user`
  mapping added by #4964.
- The `socket` normalization is REMOVED from `adapter-args.ts:210-219`, leaving
  one mapping site. Verify the `host`/`socketPath` defaulting at :221 still
  behaves once `socket` is no longer rewritten there.
- The duplicated `socket` + `socketPath` emission in `driverConfig()` collapses
  to Rails' `socket` alone, and the straddle comment
  (`test-connection-env.ts:195-198`) is removed.
- Precedence vs an explicit `socketPath`, and the `""` case, are tested and
  documented as deliberate choices.
- Tests route through `buildAdapterArg` -> constructor, not direct construction.
- Test proves a `socket`-only config reaches the socket (a bogus path must fail
  ENOENT, not silently succeed over TCP — that is the assertion that catches a
  regression here).
- `template-global-setup.ts` opens a mysql2 connection on the driver DIRECTLY
  (bypassing the adapter), so it needs the driver-native spelling at that call
  site — #4964 hit exactly this for the credential.

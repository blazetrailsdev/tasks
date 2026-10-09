---
title: "activerecord: Migration::Compatibility.find stringifies the version in one call"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8682
claim: "2026-10-08T15:05:12Z"
assignee: "migration-compatibility-find-stringifies-the-version-in-one-call"
blocked-by: 'Hits the story''s own third criterion. Rails'' find is version.to_s over a Float OR a String (compatibility.rb:6-8), and review on trails#8682 requires find("8.0") to stay "8.0" at run time. A JS number cannot carry Float-ness (8.0 === 8), so the generic to_s port (rbObjAsString) renders 8 as "8", and ruby-compat''s flo_to_s (numeric.c:1059, tried on #8682 as an exported floToS) renders 8 as "8.0" but turns the String "8.0" into "Infinity". Any single call that does both dispatches on typeof inside, which is the same arm relocated. Needs an owner decision on how a Float literal reaches Migration.get / Schema.get (boxed seat, number-only API, or keep the receipted arm).'
closed-reason: null
---

## Context

`ActiveRecord::Migration::Compatibility.find`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/compatibility.rb:6-14`) opens with
`version = version.to_s`. A migration is declared `ActiveRecord::Migration[8.0]`
(`migration.rb:629-631`), a Float, and `8.0.to_s` is `"8.0"`.

`packages/activerecord/src/migration/compatibility.ts:24-28` cannot make that one call: `Migration[8.0]`
reaches it as the JS number `8`, whose string is `"8"`, so the body has an extra arm,
a ternary that appends `.0` to an integral number before stringifying. It
carries `@inventedArm if`, tagged `PERMANENT` by trails#8547. No CLAUDE.md section ratifies a JS
number standing in for a Ruby Float; the audit in
`activerecord-audit-permanent-receipts-subsystems-part-2` re-tagged it
`CONVERGEABLE migration-compatibility-find-stringifies-the-version-in-one-call`.

## Acceptance criteria

- [ ] `find` opens with one call that is the port of `Float#to_s` for its argument (a ruby-compat
      `Float#to_s`, `vendor/ruby/v3.3.11/numeric.c` `flo_to_s`, which renders an integral Float with
      its `.0`), and the ternary and the `@inventedArm if` receipt are gone.
- [ ] The decision on how a Ruby Float literal reaches a trails API (`Migration[8.0]` /
      `Migration.get(8.0)`) is recorded in the PR body with the call sites it covers
      (`migration.ts:949`, `schema.rb:72`'s `ActiveRecord::Schema[…]`).
- [ ] If no single call can render `8` as `"8.0"` without the same arm inside it, the story is
      blocked with that blocker rather than closed by a justification.
- [ ] `migration/compatibility.test.ts` and `migration.test.ts` stay green.

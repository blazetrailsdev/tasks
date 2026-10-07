---
title: "activerecord: Migration::Compatibility.find stringifies the version in one call"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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

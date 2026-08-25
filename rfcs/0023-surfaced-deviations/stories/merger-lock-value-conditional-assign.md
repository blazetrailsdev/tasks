---
title: "merger-lock-value-conditional-assign"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: relation/merger.ts:228 is now 'if (this.other.lockValue) rel.lockValue ||= this.other.lockValue', matching merger.rb:169's 'relation.lock_value ||= other.lock_value if other.lock_value'."
---

## Context

`Merger#merge_single_values` merges the other relation's `lock_value` with
Ruby's conditional-assign, so an existing lock on the receiver WINS:

Rails (`vendor/rails/activerecord/lib/active_record/relation/merger.rb:169`):

```ruby
relation.lock_value ||= other.lock_value if other.lock_value
```

trails unconditionally overwrites
(`packages/activerecord/src/relation/merger.ts:265`):

```ts
if (this.other.lockValue) rel.lockValue = this.other.lockValue;
```

`||=` only assigns when the left side is nil/false, so
`Post.lock("FOR UPDATE").merge(Post.lock("FOR SHARE"))` keeps `FOR UPDATE` in
Rails and takes `FOR SHARE` in trails. The outer `if other.lock_value` guard is
already ported; only the `||=` half is missing.

Pre-existing — not introduced by PR #6600, which only renamed `_lockValue` to
the Rails-named `lockValue` accessor on this line. Surfaced in review of #6600
as a non-blocking note.

## Acceptance criteria

- `mergeSingleValues` ports `relation.lock_value ||= other.lock_value if
other.lock_value` faithfully: the other's lock is adopted ONLY when the
  receiver's `lockValue` is itself unset (Ruby `||=`, so nil/false — see
  CLAUDE.md "Ruby idioms" on truthiness, and note `lock_value` can be a String,
  `true`, or nil).
- A test covers the receiver-wins case (merging two relations that each carry a
  different lock) — check `vendor/rails/activerecord/test/cases/relation/
merging_test.rb` for an existing Rails test to mirror by name before writing
  a trails-only one.
- No other behavior change; `pnpm vitest run packages/activerecord/src/relation`
  passes.
- `pnpm parity:api:calls` / `:args` clean; deltas non-negative.

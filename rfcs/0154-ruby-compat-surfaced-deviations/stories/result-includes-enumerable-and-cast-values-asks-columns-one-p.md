---
title: "activerecord: Result's iterator comes from ruby-compat Enumerable, and cast_values asks columns.one?"
status: blocked
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: ["errors-symbol-iterator-comes-from-ruby-compat-enumerable"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: "parked by owner 2026-10-08: clears a receipt with no behaviour change; resume on an owner decision"
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

Two receipts in `packages/activerecord/src/result.ts`:

- `Result#[Symbol.iterator]` (`@noRailsEquivalent`). `ActiveRecord::Result` is `include Enumerable`
  over `each` (`vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb:37,128-134`). trails ports
  `each` and hand-writes the iterator beside it. No CLAUDE.md section names `[Symbol.iterator]`: it is
  the JS spelling of what `for x in enum` / `*enum` get from `each`, so it belongs on ruby-compat's
  `Enumerable`, derived once from the includer's `each`. That is the shape
  `errors-symbol-iterator-comes-from-ruby-compat-enumerable` (RFC 0173) builds, and this story depends
  on it, as `association-symbol-iterators-come-from-ruby-compat-enumerable` does.
- `Result#castValues` (`@missingRailsCall one?`). Rails opens with `if columns.one?` (`result.rb:166`);
  trails writes `this.columns.length === 1`. The blockless `Array#one?`
  (`vendor/ruby/v3.3.11/array.c` `rb_ary_one_p`) has no ruby-compat export, and
  `scripts/api-compare/enumerable-idioms.ts` credits `one?` only through a `filter`, the block form.
  The `first` half of the same receipt converged in the audit PR (`first(typeOverrides)`,
  `first(this.columns)`, `result.rb:170,172`).

## Acceptance criteria

- [ ] `include(Result, Enumerable)` mirrors `result.rb:37`; `Result`'s own `[Symbol.iterator]` and its receipt are deleted, and `for…of` / spread over a `Result` still iterate `hash_rows`.
- [ ] ruby-compat exports the blockless `one?` at its MRI name, receipted and listed in the package README with this call site; `castValues` calls it and the `@missingRailsCall one?` receipt is deleted.
- [ ] `pnpm parity:api:calls`, `:extra:gate` and `:receipts:gate` green; `packages/activerecord/src/result.test.ts` stays green.

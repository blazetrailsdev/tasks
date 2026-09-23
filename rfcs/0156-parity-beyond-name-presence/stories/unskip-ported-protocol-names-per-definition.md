---
title: "Score inspect, the dup family, encode_with/init_with and the explicit conversions where a Ruby file defines them"
status: claimed
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps:
  - "report-own-row-denominator-ratio"
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-09-23T18:28:03Z"
assignee: "unskip-ported-protocol-names-per-definition"
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[0]` (`scripts/parity/conventions.ts:455-498`) drops about 40 names everywhere, under one reason: "Ruby core object / value-protocol methods with no meaningful public TypeScript surface". `rubyMethodToTs` returns `null` for them (`conventions.ts:1484`) and `dedupeRubyMethodInto` drops a null-mapped method (`compare.ts:2920`).

For one subset that reason is false. These translate directly, and trails already ports them widely. Rails definitions against existing TS members, across arel, activemodel, activerecord and activesupport, from `rails-api.json` and `ts-api.json` on `4e7c35e36b`:

| Ruby name         | Rails defs | TS members today |
| ----------------- | ---------- | ---------------- |
| `inspect`         | 35         | 62               |
| `initialize_dup`  | 16         | 19               |
| `initialize_copy` | 21         | 2                |
| `dup`             | 2          | 20               |
| `encode_with`     | 15         | 12               |
| `init_with`       | 12         | 10               |
| `to_a`            | 9          | 18               |
| `to_h`            | 8          | 13               |
| `to_hash`         | 12         | 12               |
| `pretty_print`    | 6          | 16               |

Skipping them hides real misses behind a false reason. `ActiveModel::Errors#initialize_dup` (`vendor/rails/activemodel/lib/active_model/errors.rb:122-125`) is unported and `errors.rb` scores 33/33, which is 0155's `activemodel-errors-has-no-dup`. Every `inspect` Rails defines is outside the denominator, which is where 0155's 17 rendering stories live.

**Scope is this list only.** The rest of the group stays skipped and is not this story's business: names with no JS hook (`object_id`, `instance_variable_get`, `tap`, `send`, `public_send`, `nil?`, `equal?`, `to_ary`, and `then`, which would make an object a thenable that `await` calls), and names whose JS form is a different mechanism (`is_a?`, `hash`, `eql?`, `method_missing`, `respond_to?`), which `decide-protocol-names-with-a-different-js-mechanism` owns.

The TS spellings already exist: `rubyMethodToTsIgnoringSkip` (`conventions.ts:1509`) produces them for extra-surface.

## Acceptance criteria

- The ten names above move out of `SKIP_GROUPS[0]` into the scored population, expected in the TS file mirroring each Ruby file that defines them.
- `SKIP_GROUPS[0]`'s `reason` is rewritten to describe only what remains in it.
- `Errors#initialize_dup` is reported missing.
- A Ruby `initialize_copy` / `initialize_dup` is satisfied by either TS spelling or by an own `dup` / `clone` in that file, with a test, so the two Ruby hooks do not double-count one TS method.
- The PR body lists every newly missing row per package. If they exceed one PR's burndown, the mechanism lands behind an only-grow per-package enrollment list and the PR files one burndown story per unenrolled package. New rows are never baselined away.

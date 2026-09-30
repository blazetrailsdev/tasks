---
title: "activerecord: port the 15 missing cases across has_many, base, eager, associations, array, quoting, mixin tests"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Missing Rails cases in model/association test files (`pnpm parity:test --package activerecord --missing`):

- `associations/has_many_associations_test.rb` → `associations/has-many-associations.test.ts`: "delete all on association clears scope"; "select with block"; "delete all"; "to a should dup target"
- `base_test.rb` → `base.test.ts`: "table exists"; "dup"; "last"; "attribute names"
- `associations/eager_test.rb` → `associations/eager.test.ts`: "loading with one association"
- `associations_test.rb` → `associations.test.ts`: "using query constraints warns about changing behavior"
- `adapters/postgresql/array_test.rb` → `adapters/postgresql/array.test.ts`: "contains nils"
- `quoting_test.rb` → `quoting.test.ts`: "quoted time dst utc"; "quoted time dst local"
- `mixin_test.rb` → `mixin.test.ts`: "update"; "create"

## Acceptance criteria

- [ ] Each case ported under Rails' name onto canonical models/fixtures; divergences converged.
- [ ] Every file above reads 0 missing.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```

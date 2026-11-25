---
title: "activesupport: reach 100% on parity"
status: done
rfc: "0259-near-complete-packages-to-100"
cluster: rails-core
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#10740
claim: "2026-11-25T13:42:42Z"
assignee: "actionview-reaches-100-remainder"
blocked-by: null
closed-reason: null
updated: 2026-11-25
---

## Context

Measured 2026-11-24 at trails `4330f807e1`: `activesupport` is 29 tests short of
100%. 14 of those are skips without a `PERMANENT-SKIP:` line (list them with
`pnpm parity:test -- --package activesupport` and grep the TS files for
`it.skip`). The rest are missing. Paths are under `vendor/rails/v8.0.5.2/`:

- `activesupport/test/inflector_test.rb` (activesupport):
  - overlapping acronyms
  - safe constantize treats load error constant name as literal
- `activesupport/test/core_ext/time_with_zone_test.rb` (activesupport):
  - xmlschema with datetime local time
- `activesupport/test/core_ext/module_test.rb` (activesupport):
  - delegate to missing raises delegation error on basic object
  - delegate raises delegation error on basic object
- `activesupport/test/core_ext/range_ext_test.rb` (activesupport):
  - sole
- `activesupport/test/logger_test.rb` (activesupport):
  - logger freeze
- `activesupport/test/current_attributes_test.rb` (activesupport):
  - instance delegators are eagerly defined
  - attribute delegators have precise signature
- `activesupport/test/file_update_checker_test.rb` (activesupport):
  - should not reload files that appear in the future due to time travel
- `activesupport/test/core_ext/class/attribute_test.rb` (activesupport):
  - when defined in a class's singleton class
- `activesupport/test/isolated_execution_state_test.rb` (activesupport):
  - #share_with copies state from another thread
  - #share_with restores original state after block
  - #share_with with except parameter accepts single key or array
- `activesupport/test/parallelization_test.rb` (activesupport):
  - shutdown handles dead workers gracefully

API: 20 members short of 100% on trailmap. List them with `pnpm parity:api --missing --package activesupport`.

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `activesupport`.
- [ ] `methodsMissing` is 0 for `activesupport` in `package-summary.json` (`pnpm parity:packages`).
- [ ] Every remaining `it.skip` in the package sits under a `PERMANENT-SKIP:`
      line citing a CLAUDE.md section or a dated operator ruling.
- [ ] Items needing a ruling are listed in the PR body with their Rails
      `file:line`, and are not receipted until the operator rules.
- [ ] Work past the LOC ceiling is filed as new stories in this RFC, each
      with a `deps` edge from this one.

## Verification

```sh
pnpm parity:test -- --package activesupport
pnpm parity:api --missing --package activesupport
pnpm parity:packages
```

---
title: "activemodel: register the four String-identity tests in the unported register"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8530
claim: "2026-10-05T13:48:51Z"
assignee: "activemodel-register-string-identity-tests-as-unported"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` counts activemodel at 1036/1041 with 5 skipped. Four of the five are the
String-identity tests CLAUDE.md § "Ruby Strings are JS string primitives" rules permanently
unportable, parked as `it.skip` under `PERMANENT-SKIP:`:

- `vendor/rails/v8.0.2/activemodel/test/cases/attribute_test.rb:134-138` "duping dups the value",
  `:271-277` "an attribute is changed if it has been mutated", `:325-330` "with_type preserves mutations"
  (`packages/activemodel/src/attribute.test.ts`)
- `vendor/rails/v8.0.2/activemodel/test/cases/type/string_test.rb:23-33` "cast strings are mutable"
  (`packages/activemodel/src/type/string.test.ts`)

Every assertion in each body turns on String identity, frozenness or in-place `<<`, so none of
them has a portable remainder. Rails tests ruled unportable by a ratified language shortcoming
belong in the unported register (`scripts/parity/unported-files/`), as `LoadAsyncTest`'s
thread-safety row and the access-control rows from trails#8317 do. Registering them takes the
four out of the compared population, so the last activemodel skip is the Marshal test owned by
`attributes-marshal-round-trip-needs-usrmarshal-arm`.

## Acceptance criteria

- [ ] Per-test rows in `scripts/parity/unported-files/unscoped.ts` for the four tests, scoped by
      `className` (`AttributeTest`, `StringTest`) so activerecord's `StringTypeTest` and the other
      `*attribute_test.rb` files stay counted.
- [ ] The `it.skip` stubs and their `PERMANENT-SKIP:` lines stay.
- [ ] `pnpm parity:test`: activemodel 1036/1037, one skip; overall denominator drops by exactly 4;
      no other package moves.
- [ ] `scripts/parity/unported-files.test.ts` and `scripts/parity/unported-overmatch.test.ts` green.

## Verification

```bash
pnpm parity:test && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-overmatch.test.ts
```

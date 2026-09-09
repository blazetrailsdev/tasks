---
title: "PG OID::Date's BC arm parses wire format, swallows errors, and is mis-tagged PERMANENT"
status: closed
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
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
closed-reason: "Delivered by PR #7637 (commit 1562cfeab9, 'feat(ruby-compat): port Kernel#format and converge four open-coded call sites'). On origin/main postgresql/oid/date.ts's BC arm is now Rails' three lines: `value.replace(/^\\d+/, (year) => format(\"%04d\", -Number(year) + 1))` then `super.castValue(rewritten.replace(/ BC$/, \"\"))`. `git grep -n 'PERMANENT|parsePostgresDate' origin/main -- packages/activerecord/src/connection-adapters/postgresql/oid/date.ts` returns nothing: the try/catch, the parsePostgresDate call and the '@missingRailsCall format — PERMANENT' receipt are all gone. Nothing left to converge."
---

## Context

Surfaced by PR #7627's call-parity gate, which reported PG `OID::Date`'s
`@missingRailsCall format` receipt as STALE once the sibling `OID::DateTime`
arm was converged. The sibling story `pg-oid-datetime-bc-arm-bypasses-super`
(done) fixed `DateTime`; `Date` has the same divergence and was out of its scope.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/date.rb:8-18`):

```ruby
def cast_value(value)
  case value
  when "infinity" then ::Float::INFINITY
  when "-infinity" then -::Float::INFINITY
  when / BC$/
    value = value.sub(/^\d+/) { |year| format("%04d", -year.to_i + 1) }
    super(value.delete_suffix!(" BC"))
  else
    super
  end
end
```

trails (`packages/activerecord/src/connection-adapters/postgresql/oid/date.ts:12-28`):

```ts
/** @missingRailsCall format — PERMANENT */
override castValue(value: unknown) {
  ...
  if (/ BC$/.test(value)) {
    try {
      return parsePostgresDate(value);
    } catch {
      return null;
    }
  }
  ...
}
```

Three divergences in that one arm:

1. It parses the wire format via `parsePostgresDate` instead of rewriting the
   year and calling `super` — the same shape the DateTime story converged.
2. It swallows every parse failure and returns `null`, where Rails has no rescue
   here at all, so a malformed value is silently a NULL date rather than raising.
3. The receipt is tagged `PERMANENT`, which is wrong: nothing about this arm is a
   TypeScript language shortcoming. It is `CONVERGEABLE` and should point at a
   story — this one — once `Kernel#format` exists.

## Converged shape

The three Rails lines, as `date-time.ts` will carry them: rewrite the leading
year with `format("%04d", -year + 1)`, delete the `" BC"` suffix, call `super`.
Reassign Rails' `value` local rather than introducing a new name. Delete the
receipt.

Depends on `kernel-format-is-not-ported` for the `format` call; until that lands,
the receipt should at minimum be corrected from `PERMANENT` to
`CONVERGEABLE kernel-format-is-not-ported`, which is a one-line change that does
not wait on it.

## Acceptance criteria

- [ ] `OID::Date#cast_value`'s BC arm is Rails' three lines over `super`, with no
      `parsePostgresDate` call and no `try`/`catch`.
- [ ] The `@missingRailsCall format — PERMANENT` receipt is gone (or corrected to
      `CONVERGEABLE` in the interim).
- [ ] A test pins a BC date round-tripping through `super`, and pins that a
      malformed BC value raises rather than returning `null`.
- [ ] `pnpm parity:api:calls` green; PostgreSQL lane green.

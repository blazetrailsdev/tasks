---
title: "Port Time#rfc3339 (conversions.rb's xmlschema alias) past its collision with Time.rfc3339"
status: done
updated: 2026-08-20
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6751
claim: "2026-08-19T23:31:49Z"
assignee: "converge-join-dependency-aliasing-through-alias-tracker"
blocked-by: null
closed-reason: null
---

## Context

Left over from `split-time-ext-by-receiver-onto-the-rails-layout` (PR #6740),
which moved `Time#to_fs` / `#to_formatted_s` / `#formatted_offset` onto
`packages/activesupport/src/core-ext/time/conversions.ts`. That file now scores
3/4 against its Rails counterpart; the one missing member is `Time#rfc3339`:

```ruby
# vendor/rails/activesupport/lib/active_support/core_ext/time/conversions.rb:74
alias_method :rfc3339, :xmlschema
```

`Time#xmlschema` is ruby/time's own, so `conversions.rb` contributes only the
alias — but the alias IS the member `parity:api` counts, and nothing in
`core-ext/time/conversions.ts` answers it.

The reason it was not written in #6740 is a name collision the barrel cannot
express. `time-ext.ts` already exports `rfc3339`, and that one is a DIFFERENT
Ruby method — `Time.rfc3339(str)`, the class-side parser at
`core_ext/time/calculations.rb:69-83` (`Date._rfc3339` + `Time.new(...)`),
which is credited against `calculations.rb` (38/38). Two Ruby methods, one TS
spelling: `export * from` both modules in `index.ts` and ESM silently drops the
ambiguous name, taking `Time.rfc3339` down with it.

`time-ext.ts`'s generic `xmlschema(date: Date)` is the instance-side body the
alias would point at; it currently credits nothing, since `conversions.rb`
declares no `xmlschema` of its own.

## Converged shape

- `Time#xmlschema` moves to `core-ext/time/conversions.ts` next to the members
  that already landed there, and `rfc3339` is its alias
  (`export { xmlschema as rfc3339 }`), mirroring `conversions.rb:74`.
- The class-side `Time.rfc3339` parser keeps its own name at its own path; the
  two are disambiguated in `index.ts` rather than by renaming either — the
  existing precedent is the explicit-name-list comment at `index.ts:644-660`,
  which already documents this exact class of flat-ESM-namespace collision for
  `core-ext/range`'s and `core-ext/date`'s conversions.
- Callers of `xmlschema` in `core-ext/*.test.ts` and `time-ext.test.ts` follow
  the definition.

## Acceptance criteria

- [ ] `pnpm parity:api` activesupport `core_ext/time/conversions.rb` reaches
      4/4; AR-closure rollup rises by 1 (baseline 8931/8943, measured
      2026-08-19).
- [ ] Both `Time#rfc3339` (instance, the alias) and `Time.rfc3339` (class, the
      parser) are reachable from `@blazetrails/activesupport`; a plain-node
      import of the built `dist/index.js` shows both, so neither was silently
      dropped by an ambiguous star export.
- [ ] No new baseline row and no new `SKIP_GROUPS` entry.

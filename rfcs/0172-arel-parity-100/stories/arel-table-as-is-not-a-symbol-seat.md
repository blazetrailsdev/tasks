---
title: "arel: Table#initialize reads as.to_s with no Symbol arm; as is not a Symbol-discriminating seat"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8419
claim: "2026-10-02T20:01:56Z"
assignee: "arel-table-as-is-not-a-symbol-seat"
blocked-by: null
closed-reason: null
---

## Context

Replaces `arel-table-initialize-as-to-s-through-rb-obj-as-string`, which was blocked on a decision.
`pnpm parity:api:arms:report --package=arel` lists `table.ts#constructor` at `+if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/table.rb:24-26`):

```ruby
if as.to_s == @name
  as = nil
end
```

`packages/arel/src/table.ts:52` spells the `to_s` as a conditional,
`(isSymbol(as) ? symbolToS(as) : as) === this.name`, so that a colon-carrying `as: ":users"` is
dropped. `packages/arel/src/table.trails.test.ts:45` ("drops a Symbol alias naming the table itself")
pins that.

The replaced story's fix was to make ruby-compat's `rbObjAsString(":users")` answer `"users"`. That is
unsafe: a String and a Symbol share one JS type, and `rbObjAsString` is the general `to_s` for 33 call
sites that pass real Strings which may begin with `:` (`packages/activemodel/src/bcrypt.ts`,
`packages/activerecord/src/sanitization.ts`, ruby-compat `kernel-format.ts` and `string/sub.ts`,
activesupport `tagged-logging.ts` and `backtrace-cleaner.ts`). `rbObjAsString` is not changed here.

## Decision (operator, 2026-10-02)

`Table`'s `as` is not a Symbol-discriminating seat. `table.rb:24` does not turn on `Symbol === as`, so
by CLAUDE.md ("A Ruby Symbol is a JS string") `as: :users` ports as `"users"`, with no colon. The
conditional and the test that pins it both go.

## Converged shape

```ts
if (rbObjAsString(as) === this.name) {
  as = null;
}
```

`rbObjAsString(null)` answers `""`, so `Table.new("", as: nil)` compares `"" == ""` as Rails does.

## Acceptance criteria

- [ ] `Table`'s constructor reads `if (rbObjAsString(as) === this.name)` with no `isSymbol` arm on `as`.
- [ ] The test at `packages/arel/src/table.trails.test.ts:45` is deleted, not rewritten to a colon-less
      alias the Rails suite already covers.
- [ ] `rbObjAsString` and its other callers are untouched.
- [ ] No caller in `packages/*/src` passes a colon-carrying `as` to `Table` (none on `main` at
      `1890b5103a`; re-check).
- [ ] `pnpm parity:api:arms:report --package=arel` no longer lists `table.ts#constructor`.

## Verification

```bash
pnpm vitest run packages/arel && pnpm parity:api:calls && pnpm parity:api:arms:report --package=arel
```

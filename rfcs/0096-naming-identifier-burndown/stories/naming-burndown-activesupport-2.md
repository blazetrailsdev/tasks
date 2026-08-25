---
title: "Burn down the residual 35 activesupport naming call-argument rows"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6360
claim: "2026-08-11T14:06:07Z"
assignee: "naming-burndown-activesupport-2"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `naming-burndown-activesupport` (PR #6355), which took the
`packages/activesupport/src/` `naming` call-argument row count from **85 to
35**. The 35 that remain were left per that story's acceptance criterion 4 —
they are not plain identifier renames. Two clusters are already filed
separately (`port-inflections-uncountables-collection`,
`converge-number-helper-percentage-currency-converters`), and
`cache/file-store.ts#delete_entry` is covered by
`filestore-normalize-key-returns-path`. This story is the rest.

List them with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:calls:args:report
```

filtered to `class === "naming"` and `package === "activesupport"`.

**Convergeable with real work:**

- `deprecation.ts:118` — `arity_coerce(behavior)` (`behaviors.rb:124-139`) uses
  the bare `behavior` local at every `behavior.call` / `arity_of_callable`
  site. trails introduces `const fn = behavior as (...args: unknown[]) => void`
  purely to get a callable type out of `unknown` after the
  `typeof behavior !== "function"` guard, because TS narrows `unknown` to
  `Function`, which is not assignable to
  `arityOfCallable(callable: (...args: unknown[]) => void)`. Converged shape:
  type the guard so `behavior` itself is callable (a type predicate helper, or
  declaring the parameter as `unknown` and giving `arityOfCallable` a `Function`
  parameter matching Ruby's duck-typed `respond_to?(:call)`), and drop `fn`.
- `notifications/fanout.ts` — `publish_event` calls
  `iterate_guarding_exceptions(listeners_for(name), ...)`
  (`notifications/fanout.rb`); trails spells the helper `allListenersFor`. The
  method name, not just the argument, is the divergence.
- `messages/metadata.ts` — `serialize_with_metadata` passes `data`
  (`messages/metadata.rb`); trails passes a `wrapped` local built inline.
- `message-pack/extensions.ts` — `write_datetime` passes `sec_fraction` then
  `offset` to `write_rational` (`message_pack/extensions.rb`); trails computes
  one `rational` local and passes it at both sites.

**Not convergeable in TypeScript — verify, then leave the row rather than
inventing a name:**

- `cache/entry.ts` (5 rows): Rails reads the ivar `@value` while `value` is the
  public reader (`cache/entry.rb:33-34, 61-70, 76-90, 106-114`). TS cannot have
  a field and a getter of the same name, so the field is `_value`.
- `string-inquirer.ts` (`new(self)`), `notifications/fanout.rb`'s
  `build_handle` (`new(self, ...)`), `values/time-zone.ts` (`Time.utc(...)`),
  `xml-mini.ts` (`key.to_s`), `cache/coder.ts` (`string`),
  `hash-with-indifferent-access.ts` (`constructor`),
  `number-to-phone-converter.ts` (`strip`): the Rails side is `self` or a
  method-call result, not a local a TS body can spell identically.

## Acceptance criteria

1. Each convergeable row above passes what Rails passes, at the Rails
   identifier, cited to its `gem/path.rb:LINE`.
2. Rows in the second group are confirmed language-forced and left; do NOT
   rename to something that is neither the Rails name nor the current one.
3. The `activesupport` `naming` count in `pnpm parity:api:calls:args:report`
   drops by the rows converged; report before/after in the PR body.
4. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no
   new rows; `pnpm parity:api:extra --package activesupport` unchanged.

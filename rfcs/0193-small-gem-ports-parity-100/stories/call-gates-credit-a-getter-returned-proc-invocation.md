---
title: "Call gates credit a getter-returned Proc invocation (Ruby's reader.call collapses in JS)"
status: draft
updated: 2026-10-21
rfc: "0193-small-gem-ports-parity-100"
cluster: comparer
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed against the comparer, per RFC 0193 § Design ("Gaps that turn out to be
comparer false positives are filed against the script, not the package").

Ruby reads an attribute and then invokes the Proc it returns, as two call
nodes:

```ruby
# vendor/i18n/v1.14.8/lib/i18n/interpolate/ruby.rb:43
config.missing_interpolation_argument_handler.call(key, values, string)
```

JS has no `Proc#call`: invoking the function a getter returns is spelled by
calling the getter's result, so the read and the invocation collapse into one
site:

```ts
// packages/i18n/src/interpolate/ruby.ts:46
config().missingInterpolationArgumentHandler(key, values, string);
```

The comparer sees this twice, once per gate, and both are wrong in the same
way:

- **The call SET** pairs Ruby's zero-argument _read_ with the TS call, and
  reports the ported call missing. That row is baselined at
  `scripts/api-compare/call-mismatches-exclude/i18n/interpolate/ruby.json`
  with an accurate hand-written reason — the last exclude shard any RFC 0193
  package still carries.
- **The call ARGUMENT stream** reports `missing_interpolation_argument_handler`
  with `rubyArgs: []` against `tsArgs: ["ref:key", "ref:values", "ref:string"]`
  — the one remaining `shape` row in the whole RFC
  (`pnpm parity:api:calls:args`).

So one language shortcoming is charged twice to the package, and neither row
can be converged by changing the port: `handler.call(a, b, c)` is not a JS
spelling. `value.call(values)` in the same file (`ruby.rb:45`) already carries
a `@missingRailsCall call` tag for the identical reason, which is the shape the
file settled on before the args gate existed.

## Converged shape

`extract-ts-api.ts` credits a call on the _result_ of a reader as both the
reader and the `call` the Ruby body makes, so that a Ruby
`x.reader.call(a, b, c)` pairs with a TS `x.reader()(a, b, c)` or
`x.reader(a, b, c)`: the reader's own site compares with no arguments, and the
invocation's arguments compare against the `.call` site's. With that in place
both i18n rows disappear, the exclude shard is deleted (not reseeded), and the
`@missingRailsCall call` tag in the file goes stale and is removed.

The same pattern is worth a repo-wide count before implementing: any Rails body
that reads a configured handler/proc and calls it (`config.*_handler.call`,
`*.formatter.call`, a `lambda` read from a class attribute) hits it.

## Acceptance criteria

- [ ] A repo-wide count of Ruby `<reader>.call(...)` sites whose TS collapses
      the read and the invocation, recorded in the PR body.
- [ ] The comparer credits the collapsed form on both the call-set and
      call-argument streams.
- [ ] `call-mismatches-exclude/i18n/interpolate/ruby.json` is deleted by hand
      and the stale high-water mark tightened with
      `pnpm parity:api:calls:tighten i18n/interpolate/ruby.json` — no reseed.
- [ ] i18n reports 0 rows on `parity:api:calls` and 0 `shape` rows on
      `parity:api:calls:args`, and no other package gains a row.

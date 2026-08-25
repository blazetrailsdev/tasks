---
title: "Port core_ext/object/instance_variables.rb so Object#as_json stops spreading inline"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6209
claim: "2026-08-08T00:01:22Z"
assignee: "abstract-adapter-role-shard-cast-hides-ruby-nomethoderr"
blocked-by: null
closed-reason: null
---

## Context

`Object#as_json` is `respond_to?(:to_hash) ? to_hash.as_json(options) :
instance_values.as_json(options)`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:58-66`).

PR #6205 ported it into
`packages/activesupport/src/core-ext/object/json.ts` (`class Object`), but
`instance_values` itself
(`vendor/rails/activesupport/lib/active_support/core_ext/object/instance_variables.rb:14-18`)
is unported, so the body spreads the receiver's own enumerable properties
inline — `Hash.asJson({ ...value }, options)` — with a JSDoc noting the stand-in.

`core-ext/object/instance-variables.test.ts` exists but has no
`core-ext/object/instance-variables.ts` next to it, so the whole Ruby file
(`instance_values`, `instance_variable_names`) is missing, not just this one
method. `pnpm parity:api --package activesupport` reads
`core_ext/object/instance_variables.rb` at 0.

## Converged shape

Port `core_ext/object/instance_variables.rb` to
`packages/activesupport/src/core-ext/object/instance-variables.ts` — the
trails convention for a reopened core class is a class of the Ruby name with
`static` methods taking the receiver, as `core-ext/object/blank.ts` and the new
`core-ext/object/json.ts` both do. Then `Object.asJson` calls
`Object.instanceValues(value)` where it now spreads, and the JSDoc stand-in
note comes out.

Ruby's `instance_values` keys are the ivar names with the leading `@` stripped;
JS has no ivars, so own enumerable properties are the analogue and that
equivalence belongs in the new file's JSDoc, not repeated at each call site.

## Acceptance criteria

- [ ] `packages/activesupport/src/core-ext/object/instance-variables.ts` exists
      with `instanceValues` and `instanceVariableNames` bodied from
      `instance_variables.rb:14-18` and `:24-26`.
- [ ] `core-ext/object/json.ts`'s `Object.asJson` calls it instead of spreading,
      and its stand-in JSDoc note is deleted.
- [ ] `pnpm parity:api --package activesupport` shows
      `core_ext/object/instance_variables.rb` above 0 and is non-negative
      overall; `pnpm parity:api:extra --package activesupport` clean.
- [ ] `core-ext/object/instance-variables.test.ts` and
      `json/encoding.test.ts` green; no test renamed.

---
title: "Converge Migration#formatArguments on Ruby's format_arguments inspect semantics"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5772
claim: "2026-07-31T23:50:40Z"
assignee: "migration-format-arguments-ruby-inspect-fidelity"
blocked-by: null
closed-reason: null
---

## Context

PR #5769 wired `Migration#methodMissing`
(`packages/activerecord/src/migration.ts:1577`) through `sayWithTime` with
Rails' `"#{method}(#{formatArguments(arguments)})"` label
(`vendor/rails/activerecord/lib/active_record/migration.rb:1045`). That makes
`formatArguments` output user-visible on the method-missing path for the first
time, and it diverges from Ruby's `format_arguments`
(`migration.rb:1154-1164`) in three ways, all pre-existing and out of scope
for #5769:

- Rails maps every argument through `inspect`; trails uses `JSON.stringify`.
  A Hash renders as `{id: false}` in Rails but `{"id":false}` in trails, and a
  string renders `"widgets"` in both only by coincidence of JSON quoting.
- With no arguments, Ruby's `arguments.last` is `nil`, so `arg_list` gets
  `"nil"` and the label reads `create_table(nil)`. trails skips an `undefined`
  last argument, producing `createTable()`.
- Rails branches on `last_arg.is_a?(Hash)`; trails' check is
  `typeof last === "object" && !Array.isArray(last)`, so a non-plain object
  (a model class instance, a Temporal value) takes the options-filtering
  branch instead of the `inspect` branch. `isPlainObject` from
  `@blazetrails/activesupport` is the closer analogue and is already imported
  in `migration.ts`.

## Acceptance criteria

- [ ] `formatArguments` renders values Ruby-`inspect`-style rather than as JSON
      (at minimum: Hash keys unquoted with colon-space separators).
- [ ] A no-argument call produces Rails' `method(nil)` label.
- [ ] The Hash branch is gated on a plain-object check, not any `object`.
- [ ] Tests cover each of the three shapes through the `methodMissing`
      announce path.

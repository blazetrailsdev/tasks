---
title: "DebugHelper#debug renders inspect for a record: Marshal.dump refuses it where Rails dumps it"
status: draft
updated: 2026-10-05
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8520. `DebugHelper#debug`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/debug_helper.rb:28-35`)
calls `Marshal.dump(object)` as a probe and renders `object.to_yaml` in
`<pre class="debug_dump">` when it succeeds. Rails' own test passes a record:
`debug(Company.new(name: "firebase"))` and asserts `name: name`,
`value_before_type_cast: firebase` and `active_record_yaml_version: 2`
(`vendor/rails/v8.0.2/actionview/test/activerecord/debug_helper_test.rb:7-13`).

Since #8520 trails' `debug` (`packages/actionview/src/helpers/debug-helper.ts`)
makes the probe call. `Marshal.dump` (`packages/ruby-compat/src/marshal.ts`)
refuses any instance whose class has no registered Ruby path (`class2path`) and
any value with no dump arm, so `debug(record)` takes the `rescue` arm and
renders `inspect` in `<code>` where Rails renders YAML. trails' `test_debug` in
`debug-helper.test.ts` passes a plain object, not a record, so nothing covers
it. `ActiveRecord::Marshalling` is `activerecord-port-marshalling-module`.

## Acceptance criteria

- [ ] `Marshal.dump(Company.new(name: "firebase"))` succeeds for a canonical
      test model, with every class its dump reaches registered under its Ruby
      path and every member value on a ported dump arm.
- [ ] `debug-helper.test.ts`'s `test_debug` is Rails' test: a `Company` record,
      the three Rails assertions, rendered in `<pre class="debug_dump">`.

## Verification

`pnpm vitest run packages/actionview/src/helpers/debug-helper.test.ts`.

---
title: "date-time-selector-generated-readers-credited"
status: done
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9055
claim: "2026-10-19T12:07:14Z"
assignee: "cache-helper-write-fragment-for-awaits-async-block"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview --missing` reports six
`helpers/date_helper.rb` rows as `[declaration-only]`: `sec`, `min`, `hour`,
`day`, `month`, `year`. Rails generates them on `DateTimeSelector` with
`%w( sec min hour day month year ).each do |method| define_method(method) ...`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:869-877`).
trails declares them in the `interface DateTimeSelector` merge in
`packages/actionview/src/helpers/date-helper.ts` and defines the bodies some
other way, so the extractor does not credit them.

## Acceptance criteria

- The six readers are defined where `parity:api` credits them, with Rails'
  body (`@datetime.kind_of?(Integer) ? @datetime : @datetime.public_send(method) if @datetime`).
- `helpers/date_helper.rb` shows 0 missing in `pnpm parity:api --package actionview`.

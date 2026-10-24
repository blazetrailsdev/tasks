---
title: "date-datetime-new-spelling-converges-with-time-new"
status: draft
updated: 2026-10-24
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Chronic.construct` (`vendor/chronic/v0.10.2/lib/chronic.rb:136-144`) branches on `Chronic.time_class.respond_to?(:new)` and then calls `Chronic.time_class.new(year, month, day, hour, minute, second, offset)` for `::Time` and `::DateTime` alike. In `@blazetrails/date`, Ruby `Time.new` is a static `Time.new()` (`packages/date/src/time.ts:465`), but Ruby `DateTime.new` is only the JS constructor (`packages/date/src/date.ts:5871`, no static `new`). So `rbObjRespondTo(DateTime, "new")` answers false, and no single call spells Ruby `new` for both classes.

`packages/chronic/src/chronic.ts` `construct` carries an invented `if` that calls `new timeClass(...)` when the class has no static `new`, receipted `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- [ ] `@blazetrails/date` spells Ruby `new` the same way for `Time`, `Date` and `DateTime`, so `Chronic.time_class.new(...)` is one call.
- [ ] `construct`'s invented arm and its `@inventedArm` receipt are removed, and `chronic.test.ts` "datetime" still passes.

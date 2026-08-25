---
title: "Port the five hollow Rails-named has_many replace tests onto canonical models"
status: done
updated: 2026-07-27
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 5449
claim: "2026-07-27T20:05:50Z"
assignee: "port-hollow-has-many-replace-tests"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5294 (collection-proxy-replace-multiset-diff-fidelity).

Five Rails-named `replace` tests in `has-many-associations.test.ts` carry the
Rails test name but never call `replace` — they are bespoke-table stand-ins
(`HmAuthor`/`HmPost` on `authors`/`posts`, driven through `loadHasMany`), so
they passed unchanged while #5294 rewrote `CollectionProxy#replace` end to
end. They provide no regression signal for the method they are named after,
and they violate the canonical-models rule.

- `replace returns target` (`:5184`) — asserts an FK setter returns its value.
  Rails (`has_many_associations_test.rb:2688`) asserts
  `car.bulbs.replace([bulb3, bulb1])` RETURNS `[bulb1, bulb3]` and leaves the
  target in that order. #5294 made `CollectionProxy#replace` return the target
  precisely so this is now portable.
- `replace` (`:6341`) — Rails `:2677` builds a Car, `car.bulbs.replace([bulb2])`,
  and asserts both the in-memory and the reloaded target.
- `replace with same content` (`:6369`) — Rails `:2087` asserts the second
  `firm.clients = []` runs NO queries (`assert_no_queries`) and returns `[]`.
  #5294's `sameRecordList` short-circuit is the code that implements this and
  is currently untested.
- `replace with less` (`:6353`) / `replace with less and dependent nullify`
  — Rails `:2048`/`:2056` assign a shorter array and assert the count.
- `transactions when replacing on persisted` (`:3658`) /
  `transactions when replacing on new record` (`:3695`) — Rails `:2099`/`:2113`
  use `Client#raise_on_save` and `assert_queries_count(0)`; the canonical
  `Client` already has `raiseOnSave` (`models/company.ts:444`).

Canonical models exist for all of these: `Car`/`Bulb`, `Firm`/`Client`.

## Acceptance criteria

- [ ] Each listed test is ported to its Rails body verbatim, on canonical
      models/fixtures, exercising `replace` (or the array setter) for real.
- [ ] No test renames — the names already match Rails.
- [ ] The bespoke `HmAuthor`/`HmPost`-style classes these tests introduced are
      removed if nothing else uses them.
- [ ] `replace with same content` asserts the no-query second assignment, and
      `replace returns target` asserts the returned array and its order.

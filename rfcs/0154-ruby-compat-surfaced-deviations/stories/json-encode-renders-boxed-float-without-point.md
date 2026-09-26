---
title: "ActiveSupport::JSON renders a whole-valued Float as 1, not 1.0"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8121 made `ActiveModel::Type::Float#cast_value` produce the boxed Float seat (`new Number(x)`) for whole values, and taught `Float.asJson` / `JSONGemEncoder#jsonify` to accept it (`packages/activesupport/src/core-ext/object/json.ts` `Float.asJson`, `packages/activesupport/src/json/encoding.ts` `jsonify`). `Float#as_json` returns `self` (`activesupport/lib/active_support/core_ext/object/json.rb:116-122`), and `JSONGemEncoder#stringify` hands it to `::JSON.generate` (`activesupport/lib/active_support/json/encoding.rb:108-111`), which renders a Float with its point: `{a: 1.0}.to_json == '{"a":1.0}'`.

trails' `stringify` is `JSON.stringify`, which unboxes a `Number` object and renders `1`, so a whole-valued Float attribute serializes as `{"a":1}`, as if it were an Integer.

## Converged shape

`ActiveSupport::JSON.encode` / `toJSON` render a boxed Float seat with its point (`1.0`) and Infinity/NaN still as `null`. Candidates are `JSON.rawJSON` (Node 21+, V8 11.4), or a replacer in `stringify` that emits the `flo_to_s` form (`rbObjAsString`) for a boxed Number. Plain JS numbers keep rendering as today.

## Acceptance criteria

- [ ] `ActiveSupport::JSON.encode({ a: new Number(1) })` is `{"a":1.0}`, matching `JSON.generate`.
- [ ] A record with a whole-valued float attribute serializes `to_json` with `.0`.
- [ ] Non-finite Floats still encode as `null` (`json.rb:119-121`).

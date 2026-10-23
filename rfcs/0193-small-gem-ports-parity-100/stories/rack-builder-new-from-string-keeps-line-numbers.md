---
title: "rack Builder.newFromString keeps the script's line numbers (eval path lineno)"
status: ready
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack's `new_from_string` runs `eval(builder_script, binding, path)` (`vendor/rack/v3.1.14/lib/rack/builder.rb:102-108`), so `__LINE__` inside a config file reports the file's own line number. trails' `Builder.newFromString` (`packages/rack/src/builder.ts`) prepends `"use strict";` to the script and evaluates it with `new Function`, so the reported line numbers are offset. As a result the `line.ru` fixture (`packages/rack/test/builder/line.ru`, for the spec test "sets **LINE** correctly" at `spec_builder.rb`) hardcodes `"3"` instead of computing its line.

## Acceptance criteria

- `newFromString` keeps the script's line numbers, with no prepended line, or by moving the directive onto the first line.
- `line.ru` derives its line number at run time, so the "sets **LINE** correctly" test checks real line tracking.

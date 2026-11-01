---
title: "AppName#valid_const? answers Ruby core constants"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Object.const_defined?(app_const_base)` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_name.rb:32`) is answered in `packages/trailties/src/generators/app-name.ts` by `constDefined(TopLevel, …) || … in globalThis`. Ruby-only core names with no seat (`Integer`, `Kernel`, `Comparable`) pass, and JS-only globals (`performance`) are refused.

## Acceptance criteria

- `isValidConst` refuses every Ruby core constant name and no JS-only global, as `const_defined?` does.

---
title: "Review and converge actiondispatch's last call-set baseline rows"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9053
claim: "2026-10-19T01:10:20Z"
assignee: "block-param-burndown-actiondispatch"
blocked-by: null
closed-reason: null
---

## Context

The call-set baseline (`scripts/api-compare/call-mismatches-exclude/actiondispatch/`) on trails `main` @ `87094a5097` still holds two actiondispatch rows:

- `middleware/ssl.json`: `flag_cookies_as_secure!` → `new`, with the seeded default reason "bucket (b) equivalent or (c) noise pending per-cluster burndown review". `call-mismatches-unreviewed/actiondispatch/middleware/ssl.json` holds `max: 1`, so this row has never been reviewed.
- `system-testing/driver.json`: `initialize` → `delete`, reviewed. Rails pops `@options.delete(:name)`, while trails uses JS `delete` on a spread copy. It could converge onto a ruby-compat hash delete that returns the value.

`call-mismatches-exclude/actiondispatch/http/param-builder.json` exists too. Check whether it is empty or stale.

## Acceptance criteria

- `flag_cookies_as_secure!` either makes Rails' `new` call (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/ssl.rb`) or gets a per-entry verified reason, and the unreviewed mark drops to 0.
- `driver.ts` converges onto Rails' `delete`, or the entry stays with its reason.
- Any baseline file left empty is deleted. `pnpm parity:api:calls` passes.

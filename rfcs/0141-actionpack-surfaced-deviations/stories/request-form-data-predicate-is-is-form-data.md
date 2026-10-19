---
title: "Request#form_data? ports as isFormData, not a formData getter"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionDispatch::Request#form_data?` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb`, the `form_data?` predicate checking `FORM_DATA_MEDIA_TYPES`) is ported as a `formData` getter in `packages/actionpack/src/action-dispatch/http/request.ts`. The root CLAUDE.md predicate rule says `foo?` is answered by `isFoo`. `dispatch/request.test.ts` (RequestFormData) calls it as `(r) => r.formData`.

## Acceptance criteria

- Rename to `isFormData`, keeping the `FORM_DATA_MEDIA_TYPES` logic and update every caller.
- `pnpm parity:api:predicates` does not rise, and tighten it if it drops.

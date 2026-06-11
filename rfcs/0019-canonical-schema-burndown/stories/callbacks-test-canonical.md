---
title: "callbacks.test.ts → canonical schema + Rails fixtures (split per-describe)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`. The
`associations/callbacks.test.ts` body-port landed (#2838) but the file stays on
the `require-canonical-schema` exclude list, and an `eslint-disable` shortcut was
rejected — it must genuinely ride canonical.

Why it isn't a mechanical swap:

- describes 1 & 2 use throwaway `Post`/`Comment` models that create posts with
  only `title`; canonical `posts`/`comments` declare `body` NOT NULL
  (test-schema.ts), so every `Post.create` needs a `body` and the models need a
  `body` attribute.
- describe 2 also declares `profiles`, `firms`, `clients` — none exist in Rails
  `schema.rb`, so they cannot be added to canonical (which mirrors Rails). The
  belongs_to/has_one callback variants built on those must be re-expressed on
  existing canonical associations.
- the third describe already uses canonical `Developer`/`Project` fixtures.

Care: do NOT mutate the shared canonical `Post`/`Comment` model classes'
association lists (other files in the worker reuse them). Use local model
classes whose `_tableName` points at the canonical tables so the canonical
tables are shared but association wiring stays test-local.

## Acceptance criteria

- [ ] `callbacks.test.ts` rides canonical tables (`posts`/`comments` + canonical
      models for the belongs_to/has_one variants) with no synthetic
      `profiles`/`firms`/`clients` tables and no `eslint-disable`.
- [ ] Test bodies match `associations/callbacks_test.rb` where it applies; test
      names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.

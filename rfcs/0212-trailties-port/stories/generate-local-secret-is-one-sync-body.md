---
title: "generate-local-secret-is-one-sync-body"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
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
closed-reason: "The story's check answers no: the async split is the JS-forced shape. trailties code is async-fs only (docs/trailties/trailties-plan.md:29) and website generators reach an in-memory fs only through the async adapter (docs/claude-md-decision-history.md:283). loadLocalSecret is @noRailsEquivalent PERMANENT, and the cited @missingRailsCall mkdir_p receipt is not on origin/main."
---

## Context

Rails' `generate_local_secret` is synchronous (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:634-644`). The port splits it: `loadLocalSecret` is async and awaited by `Application#initializeBang`, and `generateLocalSecret` reads the result (`packages/trailties/src/application/configuration.ts:589-609`). `File.isExist`, `FileUtils.mkdirP`, `IO.binwrite` and `IO.binread` are all sync in ruby-compat, so the split may be removable. Check first whether the repo's async-fs rule for shipped code allows it.

## Acceptance criteria

- `generateLocalSecret` is Rails' body line for line, and `loadLocalSecret` and its `Application#initializeBang` call are gone; or a named blocker is recorded here.
- The `@missingRailsCall mkdir_p` receipt on `generateLocalSecret` is removed.

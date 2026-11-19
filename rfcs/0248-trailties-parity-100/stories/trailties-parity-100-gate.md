---
title: "trailties: gate CI at 100% API and test parity"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps:
  [
    trailties-test-application-configuration-part-1,
    trailties-test-application-configuration-part-2,
    trailties-test-application-configuration-part-3,
    trailties-test-application-configuration-part-4,
    trailties-test-application-configuration-part-5,
    trailties-test-application-configuration-part-6,
    trailties-test-application-configuration-part-7,
    trailties-test-application-configuration-part-8,
    trailties-test-app-generator-part-1,
    trailties-test-app-generator-part-2,
    trailties-test-app-generator-part-3,
    trailties-test-application-test-runner-part-1,
    trailties-test-application-test-runner-part-2,
    trailties-test-rake-multi-dbs-part-1,
    trailties-test-rake-multi-dbs-part-2,
    trailties-test-rake-dbs,
    trailties-test-rake-migrations-and-tasks,
    trailties-test-plugin-generator,
    trailties-test-railties-engine,
    trailties-test-railtie-and-engine-small-files,
    trailties-test-generated-attribute,
    trailties-test-generator-actions,
    trailties-test-commands-middleware,
    trailties-test-application-routing,
    trailties-test-paths,
    trailties-test-server-and-rackup,
    trailties-test-credentials-and-encrypted,
    trailties-test-generators-lookup,
    trailties-test-devcontainer,
    trailties-test-zeitwerk-and-loading,
    trailties-test-runner,
    trailties-test-console-and-dbconsole,
    trailties-test-query-logs,
    trailties-test-middleware-exceptions-and-session,
    trailties-test-middleware-cache-cookies-static-logger,
    trailties-test-named-base-and-create-migration,
    trailties-test-multiple-applications,
    trailties-test-test-runner-plugin-and-parser,
    trailties-test-install-generators,
    trailties-test-commands-routes-and-help,
    trailties-test-commands-small-files,
    trailties-test-security-policies,
    trailties-test-application-singletons,
    trailties-test-asset-pipeline-permanence,
    trailties-test-move-misplaced-tests,
    trailties-test-wrong-describe-and-skip-receipts,
    trailties-api-commands-perform-surface,
    trailties-api-app-base-gemfile-entries,
    trailties-api-generators-residue,
    trailties-api-railtie-engine-residue,
    trailties-api-rdoc-task-permanence,
    trailties-api-structure-inheritance-arity,
    trailties-api-skip-receipts-audit,
    port-source-paths-for-not-namespaced-generators-test,
    port-plugin-helpers-with-new-plugin,
    scaffold-generator-engine-subprocess-tests,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Once every other story in RFC 0248 is done, add a CI check that fails if
trailties drops below 100% on `parity:api` (Miss 0, inheritance and arity 100%)
or `parity:test` (Miss/Desc/Move 0, no ✗ file, every Skip `PERMANENT-SKIP:`).
Follow the shape of `activesupport-parity-100-gate` (RFC 0246).

The three web-console tests (`app_generator_test.rb`'s `test_web_console` and
`test_skip_dev_gems`, `api_app_generator_test.rb:44`'s assertion) are owned by
the post-launch web-console RFC; the gate counts them as that RFC's, not as
trailties misses.

## Acceptance criteria

- [ ] The CI check exists, runs on PRs touching `packages/trailties`, and passes on main.

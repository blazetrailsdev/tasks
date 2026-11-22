---
title: "last mile: every in-scope package at 100% of portable"
status: ready
updated: 2026-11-21
rfc: "0123-blocked-convergence-holding"
cluster: measurement
packages: [scripts]
deps:
  [
    parity-reports-permanent-skips-apart-from-open-gaps,
    unported-files-package-scope-matches-compare-key,
    actionmailbox-unpark-non-utf8-ingress-tests,
    activestorage-empty-attachment-and-cloud-service-registers,
    rack-test-tempfile-finalizer-unlinks-on-gc,
    rake-thread-pool-tests-and-private-reader-credit,
    rack-proxy-port-examples-and-live-smoke-tests,
    vite-assets-ruby-config-and-to-env-tests,
    et-orbi-iso8601-titles-credited,
    actiontext-rich-textarea-credited-on-form-helper,
    actionview-dom-testing-assert-size-match-and-context,
    load-async-instrumentation-is-thread-safe,
    builder-handler-is-ported-unpark-builder-template-tests,
    actionpack-unpark-tests-whose-blocker-landed,
    action-controller-test-case-live-aliases-on-live,
    mail-parser-structs-credit-error-writer,
    mail-test-compare-residue-titles-and-describes,
    mail-latin1-encoding-tests-use-tagged-bytes,
    stub-any-instance-does-not-intercept-js-new,
    i18n-railtie-initializers-unported,
    rack-uploaded-file-delegates-keyword-arguments,
    ruby-compat-hash-answers-rack-headers-public-interface,
    activerecord-test-support-helper-stand-ins-and-harness,
    association-async-load-target-uses-async-executor,
    load-async-mixed-pool-scheduled-test-needs-a-synchronous-null-executor-load,
    postgresql-bulk-change-query-count-one-short,
    action-pack-assertions-port-render-file-tests-and-park-the-builder-three,
    cookie-jar-serializer-fallbacks-and-legacy-cbc-upgrade,
    debug-view-rescue-templates-are-never-shipped,
    inspector-routes-when-expanded-colocated-source-location,
    helper-name-error-has-no-did-you-mean,
    port-did-you-mean-correctable-onto-name-error,
    port-rails-meta-and-entity-stores,
  ]
deps-rfc: [0246-activesupport-parity-100, 0254-mysql2-gem-port, 0168-rack-cache-gem-port]
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Closes the RFC. Each in-scope package except activesupport (RFC 0246),
mysql2 (RFC 0254) and rack-cache (RFC 0168) reports 100% of portable on
`parity:test` and 0 missing on `parity:api`, with every remaining skip
permanent.

## Acceptance criteria

- [ ] `parity:packages` shows each in-scope package at 100% of portable.
- [ ] Each package's permanent count equals its `PERMANENT-SKIP` plus unported `tests:` rows.
- [ ] No `BLOCKED:` line cites a done or closed story; no `PERMANENT-SKIP:` lacks a CLAUDE.md or ruling citation.

## Definition of done

Widening a register, converting a portable skip to `PERMANENT-SKIP:` without a
ratified CLAUDE.md section or operator ruling, or renaming a test does not
close this story.

## Verification

```sh
pnpm parity:packages
```

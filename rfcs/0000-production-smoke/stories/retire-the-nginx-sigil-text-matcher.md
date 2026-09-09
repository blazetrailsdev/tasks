---
title: "Retire the nginx-sigil text matcher"
status: draft
updated: 2026-09-09
rfc: "0000-production-smoke"
cluster: null
packages: []
deps: ["run-the-smoke-suite-on-a-schedule"]
deps-rfc: []
est-loc: 100
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `nginx-sigil` CI job exists because the sso plugin re-injects Authelia's
directives using two text matchers that a comment can trip, and "both failures
are silent and both end with the dashboard served unauthenticated".

It string-matches a config file to infer whether auth is on. Tier 1 tests the
actual property with one request. The inference is only load-bearing because
the live check does not run continuously — and once it does, keeping a proxy
for it is keeping a second, weaker read model of the same fact.

## Acceptance criteria

- [ ] Tier 1's public-vhost assertion has been green continuously for a week,
      evidenced by rows, before anything is removed
- [ ] The `nginx-sigil` job and its self-test are deleted
- [ ] The reasoning that job's comment carries is preserved where tier 1's
      assertion is defined, not lost with the file
- [ ] Removing SSO on the box still turns something red within one cadence

## Definition of done

Deleting the job without demonstrating the live assertion catches the same
regression does not close this story.

## Verification

With `sso:protect` removed, tier 1 goes red within one cadence and the history
page names the assertion.

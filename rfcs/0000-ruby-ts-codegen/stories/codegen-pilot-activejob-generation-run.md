---
title: "Pilot generation run over activejob: the report and the codegen/activejob branch"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: ["scripts"]
deps: ["codegen-lowering-mixins-super-async"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The pilot's deliverable is a measured run, not merged code. RFC 0169 owns
every activejob port story; this run produces the starting point a still-
open 0169 story may choose to begin from, and the numbers that say whether
the generator earned its keep.

The run covers `vendor/rails/v8.0.2/activejob/lib/active_job/**` minus the
seven external queue adapters (Sidekiq, Resque, Delayed Job, Backburner,
Sneakers, Sucker Punch, queue_classic; RFC 0169 non-goals) and
`lib/rails/generators`, and skips any file whose trails twin already exists
in `packages/activejob/src` so the done 0169 stories (`namespace-and-base`,
the skeleton, and whatever has landed by then) are never overwritten. It
uses the sidecar `codegen-hint-pipeline` committed.

Expectations to check against, from the spike: `arguments.rb`,
`log_subscriber.rb`, `railtie.rb` and `test_helper.rb` decline most, which
is why RFC 0169 sizes them as hand ports; `core.rb`, `queue_name.rb`,
`queue_priority.rb`, `enqueuing.rb`, `execution.rb`, `callbacks.rb` and the
serializers should come out largely resolved.

**Precondition (every story in this RFC):** btwhooks' `PR_MAX_LOC` is set
to 2500 for spawns on this RFC (README "The LOC ceiling is lifted", Rollout
item 0). A worker whose prompt still says 700 stops and reports; it does not
split this story.

## Acceptance criteria

- [ ] The generated tree is pushed to a `codegen/activejob` branch of trails
      and never merged; the branch is deleted when RFC 0169's last story
      closes.
- [ ] An audit report (the `/audit-report` skill, slug `codegen-pilot-activejob`)
      records per-file resolution buckets and decline counts by reason, the
      ruby-compat wanted list, and the list of files skipped because their
      twin existed.
- [ ] No emitted path collides with a file already present in
      `packages/activejob/src` at run time, asserted by the driver; the
      report's per-file table accounts for every `lib/active_job` file as
      generated, skipped (twin exists) or excluded (external adapter), and
      the skipped set equals the set of existing twins.
- [ ] The RFC's Verification section is updated with the measured figures
      and a one-paragraph verdict: whether a 0169 story starting from the
      generated file is expected to be cheaper than a hand port, by area.

## Verification

`git show codegen/activejob --stat` lists only files under
`packages/activejob/src` with no counterpart on `main`, and the audit
report's per-file table sums to the 40 non-adapter `lib/active_job` files.

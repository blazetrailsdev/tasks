---
title: "Hint pipeline: sidecar format and validator, TracePoint recorder, model hint pass, and the activejob sidecar"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: []
deps: ["codegen-ir-and-prism-bridge"]
deps-rfc: []
est-loc: 1000
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby does not state the types of parameters, block parameters, instance
variables or `class_attribute` values, and the first spike showed those are
the dominant reason a call site cannot be resolved (174 untyped parameters
and 55 untyped block parameters in activestorage, with 301 further failures
cascading from them). The sidecar is where those types live. The second and
fourth spikes showed it can be generated:

- A `TracePoint` on `:call`, `:return` and `:b_call`, limited to the gem's
  files, records the class of every argument, return, block argument and
  instance variable, samples collection elements, generalizes classes defined
  under `test/` to their first non-test ancestor, and snapshots every
  `class_attribute` / `mattr_accessor` at exit. On activestorage it covered
  359 of 463 defs and took `blob.rb` from 18.3% to 8.2% unresolved.
- Raw traces carry rare-path noise (`Service::Registry#fetch` returned an
  `ActiveModel::Error` in 2 of 2,170 samples and poisoned every
  `service.x` call). A frequency threshold fixes that case and breaks others
  (it also dropped a legitimate `Symbol` argument). Rare members are
  therefore **flagged, never dropped**; the model pass or a reviewer decides.
- A model writing hints from the source alone covered every observed class
  on 228 of 232 comparable facts (98.3%), left the rare-path noise out
  unprompted, and on code the tests never ran resolved 6.2% unresolved
  against the trace's 18.6%.

The validator holds three gates, all exercised in the fourth spike: every
type name is in a closed vocabulary (gem classes, constants the resolver can
map, core types); every key names a def and parameter that exists; every
hint covers every class the trace observed. A hint that fails the third gate
goes to review with both answers shown. The checker catches an over-wide
hint downstream (`io` hinted as `IO | File | StringIO | Tempfile` failed on
`io.size`, correctly: Ruby's `IO` has none).

The migration-to-schema reader from the second spike (a Prism walk over
`create_table` blocks, about 25 lines) ships here too for later gems;
activejob has no schema.

The trace run needs a bundle. The spike built one in a scratch directory
from gems already on the host, with Rails taken by `path:` from a copy of the
vendored tree so nothing under `vendor/` is written to. This story uses the
same shape and writes it down in `scripts/codegen/trace/README.md`, since the
next gem's trace run repeats it.

## Acceptance criteria

- [ ] `scripts/codegen/hints/` defines the sidecar format (parameters,
      returns, block parameters by `file:line`, ivars, attributes, mixin
      hosts) with sample counts and a `flagged` field.
- [ ] The validator implements the three gates and a `codegen:hints:check`
      CLI that lists violations with both the hint and the observed types.
- [ ] `scripts/codegen/trace/recorder.rb` and the trace-to-sidecar converter
      exist, with the common-ancestor collapse for gem classes and the
      test-class generalization.
- [ ] The model pass is a prompt plus harness that writes sidecar entries
      from source and trace, run through the validator; its output is a
      proposal file, never applied without the validator passing.
- [ ] The activejob sidecar is produced from a trace run of
      `vendor/rails/v8.0.2/activejob/test` plus the model pass and committed
      under `scripts/codegen/hints/activejob/`, with the disagreement list in
      the PR body. Defs the tests never reached are listed.
- [ ] The migration-to-schema reader is present with a test over
      `activestorage/db/migrate`.

## Verification

`pnpm codegen:hints:check activejob` reports zero gate violations; the PR
body lists the flagged entries and how each was decided.

---
title: "Enroll vendor/ruby's in-tree ruby/spec suite as ruby-compat's behavioural measure"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["vendor-ruby-mri-source", "ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 240
priority: 19
pr: 7300
claim: "2026-08-31T15:43:38Z"
assignee: "ruby-spec-behavioural-enrollment"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` can never enrol ruby-compat — the surface is C, so
`extract-ruby-api.rb` extracts nothing, the finding RFC 0088 measured for the
`date` gem and `vendor/sources.ts:190-206` records. `parity:test` is different:
MRI mirrors the ruby/spec suite in-tree at `spec/ruby/`, so the source vendored
by `vendor-ruby-mri-source` already contains a behavioural suite covering exactly
the value-type primitives — `spec/ruby/core/rational`, `core/range`, `core/string`,
`core/hash`, `core/symbol`, `core/comparable`, `core/regexp`.

This is what RFC 0089 wanted from a separate `ruby/spec` clone and no longer
needs one for.

**Scope it to the value-type primitives.** Enrolling all of `spec/ruby` would
present thousands of unported test names and drown the compare output; the
enrollment is per-directory and grows with the package.

Two traps from prior enrollments:

- **`parity:test` enrollment is four registrations**, not one, and the
  assertion-mismatch mark reds CI with a fully green local compare. Work through
  all four before pushing.
- **The standing rule applies to the spec selection too.** A spec covering a
  member ruby-compat deliberately does not have is not a gap to fill by porting
  the member — it is a spec that is out of scope. Do not let the suite drive
  surface into the package; that inverts the rule the whole RFC rests on.

Note also that spec files are RSpec-shaped (`describe`/`it`), not minitest
`def test_`, so the `def_test` name mapping that gem suites use does not apply
here — check how the extractor handles a spec-shaped file before assuming.

## Acceptance criteria

- `compareTests` enabled for the `ruby` source with a `testPath` scoped to the
  value-type spec directories (and a comment saying the scoping is deliberate and
  grows with the package).
- All four `parity:test` enrollment registrations completed, including the
  assertion-mismatch mark.
- `pnpm parity:test` runs, reports ruby-compat, and its delta is non-negative.
- The spec-shaped (`describe`/`it`) vs minitest (`def test_`) name-mapping
  question is resolved and the answer recorded in a comment.
- A comment at the enrollment site stating that an unported spec for a member
  ruby-compat does not have is **not** a reason to port that member — the
  standing rule wins.
- `compareApi` stays `false`. This story does not change that and no later story
  may.

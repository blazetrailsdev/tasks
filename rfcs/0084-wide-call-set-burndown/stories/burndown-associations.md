---
title: "B3: converge the associations residual"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
pr: 6352
claim: "2026-08-11T12:24:26Z"
assignee: "naming-burndown-activerecord-relation"
blocked-by: null
closed-reason: null
---

## Context

`associations/association.ts`, `associations/collection-association.ts` and
`autosave-association.ts` carry wide-ratchet entries for `owner`, `reflection`,
`scope`, `klass`, `reset`, `loaded?` and friends.

**Most of these are expected to evaporate** when
`ts-extractor-record-this-property-access` lands in
`0083-wide-call-ratchet-noise-reduction`: Rails' `owner`/`reflection` are
methods, trails ports them as getters read via `this.owner`, and the extractor
does not currently record property accesses. Measured examples:
`association.ts` `find_target` flagged for `owner`, `reflection`, `scope`,
`klass`; `collection-association.ts` `concat_records` flagged for `loaded?`.

~70 rows projected as residual, but that number is the least reliable in the
RFC — audit before planning PRs.

## Acceptance criteria

- Re-measure AFTER the property-access story lands. Do not size PRs off the
  projection.
- Classify the residual into real divergence vs. remaining tooling artifact; if
  it is artifact, file it against `0083-wide-call-ratchet-noise-reduction`
  rather than working around it here.
- Converge the real ones, splitting into PR-sized slices registered as
  follow-up stories.
- Association behavior is verified against the Rails association tests in
  `vendor/rails/activerecord/test/cases/associations/`, not by the ratchet.
- Depends on: ts-extractor-record-this-property-access (other RFC).

- **Check for an existing owner before claiming any slice.** The 2026-07-30
  survey found that 42% of open fidelity stories already own a file the wide
  list flags. If an open story in another RFC owns the file, the wide row
  belongs there as an acceptance criterion — not in a second campaign against
  the same file.

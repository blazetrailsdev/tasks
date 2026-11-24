---
title: "Record spike: report the numbers, settle the open questions, and file or close the rest"
status: draft
updated: 2026-11-24
rfc: "0000-ruby-compat-free-record"
cluster: spike
packages: []
deps: ["record-spike-write-path-and-belongs-to"]
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

The RFC README's "Verification" states targets it marks as proposals, and
its "Open questions" 1, 4 and 7 wait on measurements. This story takes them,
and decides whether phases 2 to 6 of "Rollout" are filed.

## Acceptance criteria

- [ ] The README's "Verification" records, for the spike and for
      `@blazetrails/activerecord`: modules loaded and median import time from
      `scripts/boot-graph/measure.mts --entry`; load, `find`, insert and
      update ratios to the bare driver; and heap allocated per loaded record.
      Each proposed target is confirmed or replaced by a number the
      measurements support.
- [ ] Open question 1 (driver layer) and Open question 4 (lazy association
      reader) are answered in the README from those numbers.
- [ ] Open question 7 is answered by pointing one file of
      `packages/activerecord/test` at the spike through an import alias and
      recording what had to change.
- [ ] A spike model is type-checked by the existing virtualizer
      (`packages/activerecord-cli/lib/type-virtualization`) with the spike's
      base class passed as a base name, and the README records whether it
      works unchanged.
- [ ] The result is put to the operator with the remaining open questions
      (2, 3, 5 and 6). On a decision to go ahead, stories for phases 2 to 6
      are filed under this RFC, each at or under the est-loc ceiling. On a
      decision not to, the RFC is closed with the numbers as the reason.

## Definition of done

Filing phases 2 to 6 without the operator's decision does not close this
story, and neither does moving the RFC to `active` with an open question
unanswered.

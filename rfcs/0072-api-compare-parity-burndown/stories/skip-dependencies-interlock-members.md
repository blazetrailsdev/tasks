---
title: "Scope-skip dependencies/interlock.rb's 10 Zeitwerk members"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6418
claim: "2026-08-12T15:36:57Z"
assignee: "call-args-ar-connection-adapters-blocks"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `activesupport-closure-skip-groups-triage` (PR #6410), which
skipped `dependencies.rb` (18) and `dependencies/autoload.rb` (5) as Zeitwerk
autoload/reload machinery but deliberately left their sibling out of scope
because the story's Context enumerated only those two files.

`vendor/rails/activesupport/lib/active_support/dependencies/interlock.rb` is
the same machinery, one level down: an `ActiveSupport::Concurrency::ShareLock`
wrapper whose 10 members are `initialize`, `loading`, `unloading`,
`start_unloading`, `done_unloading`, `start_running`, `done_running`,
`running`, `permit_concurrent_loads`, `raw_state`. It exists to let one thread
autoload constants while others are blocked, and it is what
`Dependencies.interlock` (dependencies.rb:9, already skipped) returns. trails
has no TS file for it and no constant table to guard — the same reason already
written on the shipped dependencies group.

The audit this triage came from
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/activesupport-ar-gaps-20260810T143915Z.md`,
Gap 4 / Slot I) names "`dependencies.rb`/`autoload`/`interlock` (Zeitwerk)"
together, so the ~70-member figure it quotes includes these 10.

## Converged shape

Add `dependencies/interlock.rb` to the existing dependencies
`SCOPED_SKIP_GROUPS` entry in `scripts/parity/conventions.ts` — its reason
already covers the interlock verbatim — with the 10 names above, then
regenerate with `pnpm parity:api:conventions`.

Note `concurrency/share_lock.rb` (13 members) is NOT part of this: ShareLock is
a general reader/writer concurrency primitive, not autoload machinery, and
needs its own judgement.

## Acceptance criteria

- [ ] The 10 `dependencies/interlock.rb` members are scope-skipped against that
      file, sharing the dependencies group's reason.
- [ ] `docs/ruby-ts-conventions.md` regenerated, not hand-edited.
- [ ] `pnpm parity:api` delta non-negative with no matched method lost.
- [ ] `concurrency/share_lock.rb` untouched.

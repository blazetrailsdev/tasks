---
title: "Port globalid railtie to a Trailtie and drop its test exclusion"
status: draft
updated: 2026-07-24
rfc: "0069-globalid-trailtie-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

globalid wires itself via a `wire.ts` side-effect + explicit setters instead of
a `Trailtie`, so `vendor/globalid/test/cases/railtie_test.rb` has no TS port and
is excluded whole-file in `scripts/api-compare/unported-files.ts` (the globalid
`/railtie_test.rb`, `package: "globalid"` entry). Surfaced by PR #5220
(`unported-files-audit-substring-overmatch`), which corrected that entry's stale
"Trails has no Railtie analogue" reason — activesupport DOES ship
`BaseRailtie`/`registerRailtie`, and activemodel/trailties already use it.

Reference implementations:

- `packages/activemodel/src/trailtie.ts` — `Trailtie extends BaseRailtie`,
  `static { registerRailtie(this); this.initializer(...) }` pattern.
- `packages/activemodel/src/trailtie.test.ts` — `describe("RailtieTest")` that
  drives `Trailtie.initialize(...)` / `runInitializers()` directly, snapshotting
  `BaseRailtie.subclasses` / `Trailtie.config` in before/afterEach. NO full
  `Rails::Application` boot.
- Rails source: `vendor/globalid/lib/global_id/railtie.rb` — the
  `initializer 'global_id'` block (GlobalID.app defaulting from
  `app.railtie_name`, `config.global_id.app`/`expires_in` injection,
  `after_initialize` verifier derivation from `app.key_generator`,
  `on_load(:active_record)` inclusion of `GlobalID::Identification`).
- Rails test: `vendor/globalid/test/cases/railtie_test.rb`.

## Acceptance criteria

- [ ] Add `packages/globalid/src/trailtie.ts`: a `Trailtie extends BaseRailtie`
      registering initializers that set `GlobalID.app` and
      `SignedGlobalID.expiresIn` and derive the verifier, mirroring
      `global_id/railtie.rb` and the activemodel Trailtie shape.
- [ ] Port `railtie_test.rb` to `packages/globalid/src/trailtie.test.ts` with
      `describe("RailtieTest")` (name matches Rails verbatim), driving the
      Trailtie directly like activemodel's port — not a Rails::Application boot.
      Port only the cases that map; register anything genuinely boot-only as
      per-test `tests:` exclusions with justification.
- [ ] Remove the globalid `/railtie_test.rb` whole-file entry from
      `scripts/api-compare/unported-files.ts` (or narrow to per-test) so the
      file re-enters test:compare accounting. Confirm the railtie→trailtie path
      alias (added in PR #5220) maps it to `trailtie.test.ts`.
- [ ] Report the globalid test:compare delta.

## Non-goals

- Full `Rails::Application` / `ActiveSupport::Testing::Isolation` harness.
- Touching activemodel/trailties Trailties.

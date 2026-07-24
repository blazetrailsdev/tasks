---
rfc: "0069-globalid-trailtie-port"
title: "Port globalid railtie to a Trailtie"
status: draft
created: 2026-07-24
updated: 2026-07-24
owner: "@deanmarano"
packages:
  - "globalid"
clusters: []
---

## Summary

globalid is the only ported framework that has **not** adopted the trails
`Trailtie` initialization mechanism. activesupport ships `BaseRailtie`
(`Railtie` + `registerRailtie` + `initializer` / `runInitializers`), and
activemodel (`packages/activemodel/src/trailtie.ts`) and trailties
(`packages/trailties/src/trailtie.ts`) already mirror their Rails railties as
`Trailtie` subclasses. globalid instead wires itself through a `wire.ts`
side-effect import plus explicit `setApp` / verifier setters
(`packages/globalid/src/wire.ts`, `config.ts`, `verifier.ts`).

Because of that gap, globalid's `railtie_test.rb`
(`vendor/globalid/test/cases/railtie_test.rb`) has no TS counterpart and is
carried as a whole-file exclusion in `scripts/api-compare/unported-files.ts`.
The audit story `unported-files-audit-substring-overmatch` (PR #5220) corrected
that entry's stale reason and flagged this port as the proper fix.

## Goal

Port `global_id/railtie.rb`'s `initializer 'global_id'` block
(`vendor/globalid/lib/global_id/railtie.rb`) to a globalid `Trailtie` subclass
of activesupport's `BaseRailtie`, mirroring activemodel/trailties, and port
`railtie_test.rb` the way activemodel did — driving `Trailtie.runInitializers()`
and config directly rather than a full `Rails::Application` boot. On success,
drop the globalid `railtie_test.rb` exclusion so the file re-enters test:compare
accounting.

## Non-goals

- A general `Rails::Application` boot harness / `ActiveSupport::Testing::Isolation`
  analogue. activemodel's port shows the isolation-free pattern; follow it.
- Any change to the other packages' already-shipped Trailties.

## Packages

- globalid

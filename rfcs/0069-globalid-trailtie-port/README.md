---
rfc: "0069-globalid-trailtie-port"
title: "Port globalid railtie to a Trailtie"
status: closed
created: 2026-07-24
updated: 2026-08-31
owner: "@deanmarano"
packages:
  - "globalid"
clusters: []
priority: 1
---

## Closed 2026-08-31

**Goal delivered.** `packages/globalid/src/trailtie.ts` ports
`global_id/railtie.rb`'s `initializer 'global_id'` block as a `BaseRailtie`
subclass, `railtie_test.rb` is ported beside it, and the whole-file exclusion
this RFC existed to remove is gone — `GLOBALID_UNPORTED_FILES` is now an empty
array. `pnpm parity:test` reads globalid **138/138 (100%), 7/7 files**, up from
131/131 across 6 files before the excluded file re-entered accounting.

### Four stories moved out on closure — none of them were globalid

Half this RFC's backlog was adjacency capture. Porting globalid's Trailtie means
touching the shared `Railtie` / `Trailtie` / `Application` boot machinery, so
every defect surfaced there got filed here for want of another active RFC that
had ever mentioned a railtie — `paths-path-omits-the-skip-flag-half-of-the-rails-flag-triple`
says so in its own first line, having been surfaced by
`engine-all-autoload-paths-union-paths-registry`, itself drift. `pnpm validate`
had started failing on it: three "package not declared in README packages:
[globalid]" errors.

| story                                                                       | to     | it is about                                              |
| --------------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `trailtie-encrypt-fixtures-arm`                                             | `0113` | an unported arm of activerecord's `railtie.rb:357-362`   |
| `converge-encryption-configuration-onto-active-record-encryption-load-hook` | `0113` | activerecord fires no `active_record_encryption` hook    |
| `bridge-activesupport-railtie-registry-into-application-initialize`         | `0112` | two `Railtie` ports of one Ruby class, nothing bridging  |
| `paths-path-omits-the-skip-flag-half-of-the-rails-flag-triple`              | `0104` | trailties `Paths::Path` ports 2 of Rails' 3 flag methods |

Five more drift stories had already landed here and stay as history:
`activesupport-railtie-initializer-yields-no-app`,
`application-resolved-root-cwd-fallback-has-no-rails-counterpart`,
`engine-all-autoload-paths-union-paths-registry`,
`engine-root-returns-undefined-instead-of-raising`,
`trailtie-auto-filtered-parameters-arm`.

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
carried as a whole-file exclusion in `scripts/parity/unported-files.ts`.
The audit story `unported-files-audit-substring-overmatch` (PR #5220) corrected
that entry's stale reason and flagged this port as the proper fix.

## Goal

Port `global_id/railtie.rb`'s `initializer 'global_id'` block
(`vendor/globalid/lib/global_id/railtie.rb`) to a globalid `Trailtie` subclass
of activesupport's `BaseRailtie`, mirroring activemodel/trailties, and port
`railtie_test.rb` the way activemodel did — driving `Trailtie.runInitializers()`
and config directly rather than a full `Rails::Application` boot. On success,
drop the globalid `railtie_test.rb` exclusion so the file re-enters parity:test
accounting.

## Non-goals

- A general `Rails::Application` boot harness / `ActiveSupport::Testing::Isolation`
  analogue. activemodel's port shows the isolation-free pattern; follow it.
- Any change to the other packages' already-shipped Trailties.

## Packages

- globalid

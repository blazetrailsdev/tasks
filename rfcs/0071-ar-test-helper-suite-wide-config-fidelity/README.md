---
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
title: "AR test-helper suite-wide config fidelity"
status: active
created: 2026-07-25
updated: 2026-07-25
owner: "@your-handle"
packages:
  - "activerecord"
clusters: []
---

## Problem

Rails' `activerecord/test/cases/helper.rb` flips several `ActiveRecord` config
settings **suite-wide** before any test runs. The RFC 0064 spike
(`docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md`, PR #5309)
mapped all 17 helper.rb responsibilities to their trails locations and found
four settings where the _flag exists_ in trails but the test suite never sets
it — so our suite runs under different config than Rails' does, and any test
whose behavior depends on the setting is passing for the wrong reason.

This is a behavior-fidelity gap, deliberately out of scope for RFC 0064, whose
non-goals are "no behavior change to the test harness; layout/organization only".

| helper.rb  | setting                                             | trails state                                                 |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `:27`      | `permanent_connection_checkout = :disallowed`       | `ar-config.ts:126` defaults `true`; suite never sets it      |
| `:104-107` | `extend_queries = true` + 2 × `install_support`     | `encryption/config.ts:22` defaults `false`; no trailtie port |
| `:43`      | `belongs_to_required_validates_foreign_key = false` | `ar-config.ts:213` / `trailtie.ts:139` default `true`        |
| `:14-16`   | PG `create_unlogged_tables = true`                  | `postgresql-adapter.ts:321` defaults `false`                 |

## Non-goals

- No layout or filename changes — RFC 0064 settled that (keep `test-setup-*`).
- Not a mandate to flip all four blindly. `:27` in particular has a large blast
  radius and its story is scoped as an audit-first spike.

## Notes

- Where each setting is applied matters: `helper.rb:104-107` mirrors
  `railtie.rb:351`, so the `extend_queries` work has a production-side port
  (trailtie) as well as a test-bootstrap side.
- The suite-wide bootstrap point for anything test-only is
  `packages/activerecord/src/test-setup-ar.ts`, which already carries four
  `// Mirror Rails activerecord/test/cases/helper.rb:NN` settings.

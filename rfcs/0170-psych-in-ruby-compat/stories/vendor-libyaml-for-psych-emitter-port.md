---
title: "Vendor libyaml 0.2.5 so the ported Psych::Emitter is cited and checked against emitter.c"
status: done
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8977
claim: "2026-10-16T13:49:50Z"
assignee: "delegate-class-constructor-takes-no-object"
blocked-by: null
closed-reason: null
---

## Context

trails#8970 ported libyaml 0.2.5's `src/emitter.c` into `packages/ruby-compat/src/psych/emitter.ts`. Each private method is `yaml_emitter_<name>` in camelCase (`emitBlockMappingKey` is `yaml_emitter_emit_block_mapping_key`). Ruby links libyaml 0.2.5 (`Psych::LIBYAML_VERSION`). libyaml is not under `vendor/`, so the port was checked from memory of the source and by fuzzing against `ruby -ryaml`, and nothing can cite `vendor/libyaml/<version>/src/emitter.c:LINE`. The reviewer of trails#8970 flagged this.

## Acceptance criteria

- [ ] libyaml 0.2.5 (yaml/libyaml tag `0.2.5`) is a vendored source in `vendor/sources.ts` / `sources.lock.json`, following vendor/README.md § "Upgrading a source".
- [ ] `Psych::Emitter`'s JSDoc cites `vendor/libyaml/0.2.5/src/emitter.c`.
- [ ] Each ported method's body is re-read against the vendored source. Any divergence found is fixed, and `ruby -ryaml` output is pinned in `psych.trails.test.ts`.

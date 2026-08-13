---
title: "core-ext-sweep-hash-module-string"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6455
claim: "2026-08-13T03:16:53Z"
assignee: "naming-burndown-2-ar-associations-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

Slot E: small core_ext files — hash + module + string.

- `core_ext/hash/keys.rb` — 9 remaining: bang forms `stringify_keys!`/`symbolize_keys!`, `to_options`/`to_options!`, `deep_transform_keys!`, `deep_stringify_keys!`, `deep_symbolize_keys!`, private `_deep_transform_keys_in_object(!)`. AR lib: `stringify_keys` 10 sites, `symbolize_keys` 9.
- `core_ext/hash/reverse_merge.rb` 4, `core_ext/hash/slice.rb` 2, `core_ext/hash/except.rb` 1, `core_ext/hash/indifferent_access.rb` 1.
- `core_ext/module/aliasing.rb` — NO TS FILE, 3; `core_ext/module/attr_internal.rb` 3, `redefine_method.rb` 3, `attribute_accessors.rb` 4, `introspection.rb` 2, `concerning.rb` — NO TS FILE, 2.
- `core_ext/string/inflections.rb` 4 remaining, `filters.rb` 2, `conversions.rb` 1, `zones.rb` 1.
- `core_ext/securerandom.rb` — NO TS FILE, 2 (`base58`, `base36`); `core_ext/digest/uuid.rb` — NO TS FILE, 6; `core_ext/file/atomic.rb` — NO TS FILE, 2 (`atomic_write` — AR schema cache dump); `core_ext/enumerable.rb` 2 remaining; `core_ext/range/overlap.rb` 1; `core_ext/class/attribute.rb` 1.

~50 members, audit slot ~240 LOC. Ruby-module-machinery members that don't port (e.g. `alias_method_chain`-era aliasing internals) go to SKIP_GROUPS with reasons, not silent drops.

## Acceptance criteria

- Listed files at 0 missing or reasoned SKIP rows; delta non-negative.
- `Hash` bang forms mutate in place exactly where Ruby does; `fetch`-vs-`??` semantics per CLAUDE.md.

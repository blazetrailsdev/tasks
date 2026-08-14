---
title: "core-ext-sweep-hash-module-string-residue"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6518
claim: "2026-08-14T12:47:04Z"
assignee: "core-ext-sweep-hash-module-string-residue"
blocked-by: null
closed-reason: null
---

## Context

Residue from `core-ext-sweep-hash-module-string` (slot E of RFC 0098). That PR
closed the hash + string + module-machinery half of the slot and hit the LOC
ceiling; the members below were measured but not shipped. Counts are from
`pnpm parity:api --package activesupport` on `main` @ 059bfe688 plus that PR.

### Still missing, portable

- `core_ext/module/attribute_accessors.rb` — `mattr_reader`, `mattr_writer`,
  `cattr_reader`, `cattr_writer` (4). trails has `mattrAccessor` / `cattrAccessor`
  in `packages/activesupport/src/module-ext.ts`; the reader/writer halves are
  the same generator with one side omitted
  (`vendor/rails/activesupport/lib/active_support/core_ext/module/attribute_accessors.rb:28,71`).
- `core_ext/module/introspection.rb` — `module_parent`, `module_parents` (2).
  `moduleParentName` is already in `module-ext.ts`; Rails' `module_parent` is
  `module_parent_name ? constantize(...) : Object` (introspection.rb:26-28) and
  `module_parents` walks the chain (introspection.rb:44-53).
- `core_ext/module/attr_internal.rb` — `attr_internal_accessor`
  (attr_internal.rb:16-19), the reader+writer pair `attr_internal` aliases.
  trails has `attrInternal`/`attrInternalReader`/`attrInternalWriter`.
- `core_ext/string/conversions.rb` — `to_datetime` (conversions.rb:57-59).
- `core_ext/string/zones.rb` — `in_time_zone` (zones.rb:8-14). Note the name
  collides with `time-ext.ts`'s Time arm in the flat index; the settled answer
  is the subpath export precedent (see `core-ext/date/calculations`).
- `core_ext/securerandom.rb` — `base58`, `base36` (2). NO TS FILE.
- `core_ext/digest/uuid.rb` — `uuid_from_hash`, `uuid_v3`, `uuid_v5`, `uuid_v4`,
  `nil_uuid`, `pack_uuid_namespace` (6). NO TS FILE; needs md5/sha1 through
  `crypto-adapter.ts`.
- `core_ext/class/attribute.rb` — `class_attribute` (1). trails has the
  `ClassAttribute` class in `class-attribute.ts`; the module-level macro is the
  missing entry point.

Ruby-module-machinery members that do not port already landed as
`SCOPED_SKIP_GROUPS` entries in `scripts/parity/conventions.ts`
(`redefine_method.rb`, `aliasing.rb`/`concerning.rb`, `attr_internal_define` /
`attr_internal_naming_format`, `String#squish!`/`#remove!`,
`EnumerableCoreExt::Constants#const_missing`) — do not re-litigate those.

## Acceptance criteria

- [ ] Each listed member is ported at its Rails name and file, or carries a
      reasoned `SCOPED_SKIP_GROUPS` row.
- [ ] `pnpm parity:api` delta non-negative; `pnpm parity:api:calls` /
      `:args` green with no baseline row added.
- [ ] Tests carry the Rails test names from
      `activesupport/test/core_ext/{module,string,securerandom,digest}_*`.

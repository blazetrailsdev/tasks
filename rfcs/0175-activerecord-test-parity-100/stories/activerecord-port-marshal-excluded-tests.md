---
title: "activerecord: port marshal_serialization_test.rb and the 6 Marshal-excluded cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: ["activerecord-port-marshalling-module", "ruby-compat-marshal-core-types"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Marshal exclusions (plus the whole-file `marshal_serialization_test.rb`, `vendor/rails/v8.0.2/activerecord/test/cases/marshal_serialization_test.rb`):

- `marshal_serialization_test.rb` — (whole file)
  reason: Ruby's Marshal binary format (Marshal.dump/load). No JS equivalent; JS cache/session layers use JSON or structured clone.
- `message_pack_test.rb` — (whole file)
  reason: Rails-integrated MessagePack (:nodoc:) registers AR records with ActiveSupport::MessagePack encoder/decoder. Ruby-only coupling; MessagePack-the-format exists in JS but this file is the Marshal bridge, not a reusable imp
- `associations/extension_test.rb` — "marshalling extensions"; "marshalling named extensions"
  reason: Marshal.dump/load round-trip of an AR record carrying an extended association proxy (extension_test.rb:46-65). Ruby Marshal binary serialization has no Node.js equivalent.
- `associations/has_many_through_associations_test.rb` — "marshal dump"
  reason: Marshal.load(Marshal.dump(preloaded)) of a loaded has-many-through collection. Ruby Marshal binary serialization has no Node.js equivalent.
- `associations/has_one_associations_test.rb` — "can marshal has one association with nil target"
  reason: Marshal.load(Marshal.dump(firm)) of an AR record with a loaded has-one association cache. Ruby Marshal binary serialization has no Node.js equivalent.

Their reason ("Ruby Marshal binary format has no JS equivalent") falls once ruby-compat carries Marshal
(`ruby-compat-marshal-core-types`, RFC 0154) and activerecord's `Marshalling` module is ported
(`activerecord-port-marshalling-module`, RFC 0174). The Rails 6.1/7.1 fixture dumps under
`test/assets/` are byte-for-byte inputs.

## Acceptance criteria

- [ ] `marshal_serialization_test.rb` is enrolled and every case above is ported with Rails' body; entries deleted.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```

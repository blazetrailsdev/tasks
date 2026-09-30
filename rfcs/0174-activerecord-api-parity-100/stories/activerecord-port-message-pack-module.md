---
title: "activerecord: port ActiveRecord::MessagePack (un-exclude message_pack.rb)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["message-pack-serializer-pool-and-packer-block"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`message_pack.rb` is excluded: "Rails-integrated MessagePack (:nodoc:) … Ruby-only coupling".
`vendor/rails/v8.0.2/activerecord/lib/active_record/message_pack.rb` registers AR records with `ActiveSupport::MessagePack` (`Extensions.install`,
`Encoder`, `Decoder`, record/association serialization). trails ports `ActiveSupport::MessagePack`
under RFC 0041 (`activesupport-messagepack-ext`, draft), which is the prerequisite: this module is a
client of that codec, not a separate format.

## Acceptance criteria

- [ ] `packages/activerecord/src/message-pack.ts` ports `Extensions`, `Encoder` and `Decoder` onto the ActiveSupport MessagePack port; `message_pack_test.rb` is enrolled.
- [ ] The unported entry is deleted; `message_pack.rb` scores 100%.

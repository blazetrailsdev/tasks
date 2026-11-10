---
title: "port-active-record-message-pack-initializer"
status: in-progress
updated: 2026-11-10
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9940
claim: "2026-11-10T00:29:33Z"
assignee: "port-active-record-message-pack-initializer"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Railtie`'s `active_record.message_pack` initializer (`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:408-415`) is not ported in `packages/trailties/lib/trailties/active-record.ts`. It nests `ActiveSupport.on_load(:message_pack)` → `on_load(:active_record)` → `require "active_record/message_pack"` → `ActiveRecord::MessagePack::Extensions.install(ActiveSupport::MessagePack::CacheSerializer)`.

`packages/activerecord/src/message-pack.ts` already ports `Extensions.install`, but it is neither exported from `@blazetrails/activerecord`'s index nor a package subpath, so the railtie cannot reach it. Without the initializer, a `{ serializer: ":message_pack" }` cache store raises `Unsupported type Post` (`activesupport/lib/message-pack/extensions.ts` `raiseUnserializable`) when it writes a record.

## Acceptance criteria

- `activerecord/message-pack` is reachable from trailties (subpath export, with its registrations).
- The initializer is ported under its Rails name, with the nested `onLoad("message_pack")` / `onLoad("active_record")` hooks and an awaited load in place of `require`.
- `FrameworksTest` "ActiveRecord::MessagePack extensions are installed when using ActiveSupport::MessagePack::CacheSerializer" (`railties/test/application/initializers/frameworks_test.rb:432-445`) is unskipped and passes.

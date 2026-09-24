---
title: "naming-burndown-activerecord-behavioral"
status: draft
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 wave W5 follow-up, split from `naming-burndown-activerecord-remaining`. That story's PR closed 21 of activerecord's 31 convergeable naming rows. The six rows below each need a behavior change, not a rename, so the story is `activerecord`'s last naming work before it can join `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`). The recorder rows are in the sibling story `naming-rows-recorder-shape-activerecord`.

| TS file / method                                            | Rails                                                                                                                 | Divergence to converge                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `associations/belongs-to-association.ts` `updateCounters`   | `belongs_to_association.rb:114` `update_counters_via_scope(klass, owner._read_attribute(reflection.foreign_key), by)` | TS maps every foreign-key column into an array (CPK generalisation) and `updateCountersViaScope` builds per-column conditions. Rails passes one `_read_attribute` value and `where!(primary_key(klass) => foreign_key)` (`:120`).       |
| `associations/join-dependency.ts` `instantiate`             | `join_dependency.rb:106` `aliases.column_alias(join_root, join_root.primary_key)`                                     | TS aliases each CPK column separately. Rails aliases `primary_key` whole (nil for a CPK root, so `parent_key = row_hash`). Check the CPK eager-load tests before changing it.                                                           |
| `associations/collection-association.ts` `mergeTargetLists` | `collection_association.rb:339` `memory.delete(record)`                                                               | TS keys a `Map` by a JSON identity string. Rails deletes from the `memory` Array by record `==`. Needs a ruby-compat `Array#delete` port (`vendor/ruby/array.c` `rb_ary_delete`) keyed on `rbEqual`.                                    |
| `encryption/message-pack-message-serializer.ts` `load`      | `message_pack_message_serializer.rb:28` `ActiveSupport::MessagePack.load(serialized_content)`                         | TS converts `Buffer.from(serializedContent, "latin1")` at the call site. The byte-string bridge belongs in activesupport's `MessagePack::Serializer#load` (`activesupport/src/message-pack/serializer.ts`), which Rails feeds a String. |
| `tasks/database-tasks.ts` `dumpSchema`                      | `tasks/database_tasks.rb:438` `FileUtils.mkdir_p(db_dir)`                                                             | TS creates `File.dirname(filename)`, where `filename` comes from the trails-only `_resolveSchemaPath`. Rails relies on the process cwd.                                                                                                 |
| `tasks/database-tasks.ts` `initializeDatabase`              | `tasks/database_tasks.rb:662-663` `File.exist?(schema_dump_path)`                                                     | Same `_resolveSchemaPath` indirection (`rawPath` → `resolved`).                                                                                                                                                                         |

## Acceptance criteria

- [ ] Each row converges to the Rails argument. `pnpm parity:api:calls:args:report` shows 0 `burndown` / `module-mixin-receiver` rows for activerecord once `naming-rows-recorder-shape-activerecord` has also landed.
- [ ] `activerecord` is added to `NAMING_ENROLLED_PACKAGES`, and `pnpm parity:api:calls:args` is green with it enrolled.
- [ ] No row is receipted.

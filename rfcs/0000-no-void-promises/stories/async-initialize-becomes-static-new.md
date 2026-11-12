---
title: "Rackup::Server, the console command, ActionText::Content and SchemaDumper are built with an awaited static new"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: constructors
packages: []
deps:
  [
    constructor-creates-no-promise-lint-rule,
    ruby-compat-rb-class-new-instance,
    inlined-from-placement-accepts-static-new,
  ]
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

RFC § Design 2(a). `rackup/lib/server.ts:300` stores
`this._ready = this.parseOptions(ARGV).then(...)`;
`trailties/lib/commands/console.ts:59` stores
`this._loadConsole = Promise.resolve(app.loadConsole())` and swallows its
rejection; `actiontext/lib/content.ts:73` and
`activerecord/src/schema-dumper.ts:80` chain `.then` in their constructors.
Rails: rackup's `server.rb` `initialize`,
`vendor/rails/v8.0.2/railties/lib/rails/commands/console/console_command.rb`,
`vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb`.

## Acceptance criteria

- [ ] Each class has a `protected` synchronous constructor and a `static async new` running the async remainder of `initialize` in Rails' order; every caller writes `await Klass.new(...)`.
- [ ] `_ready`, `_loadConsole` and any equivalent stored promise field are deleted.
- [ ] A rejection from the async half surfaces at `await Klass.new(...)` (a test per class).
- [ ] The constructor rule's mark drops by 4.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.

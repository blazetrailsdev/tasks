---
title: "Rackup::Server, the console command, ActionText::Content and SchemaDumper are built with an awaited static new"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: constructors
packages: []
deps: [constructor-creates-no-promise-lint-rule, ruby-compat-rb-class-new-instance]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2(a): async `initialize` is `static async new` with a protected constructor. `rackup/lib/server.ts:300` stores
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

- [ ] Each class has a `protected` synchronous constructor and a `static async new` that runs the async remainder of `initialize` at its Rails position; callers write `await Klass.new(...)`.
- [ ] `new Klass(...)` outside the class hierarchy no longer compiles (a `@ts-expect-error` test).
- [ ] `_ready`, `_loadConsole` and any equivalent stored promise field are deleted.
- [ ] A rejection from the awaited step surfaces at the call site (a test per class).
- [ ] No `create()` factory and no `ready` / `whenReady` member is added.

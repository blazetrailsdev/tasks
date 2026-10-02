---
title: "activerecord: Reaper.register_pool spawns its thread through spawn_thread"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ConnectionPool::Reaper` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb:24-67`):

```ruby
@mutex = Mutex.new
@pools = {}
@threads = {}

class << self
  def register_pool(pool, frequency) # :nodoc:
    @mutex.synchronize do
      unless @threads[frequency]&.alive?
        @threads[frequency] = spawn_thread(frequency)
      end
      @pools[frequency] ||= []
      @pools[frequency] << WeakRef.new(pool)
    end
  end

  private
    def spawn_thread(frequency)
      Thread.new(frequency) do |t|
        Thread.current.thread_variable_set(:fork_safe, true)
        Thread.current.name = "AR Pool Reaper"
        running = true
        while running
          sleep t
          @mutex.synchronize do
            @pools[frequency].select! { |pool| pool.weakref_alive? && !pool.discarded? }
            @pools[frequency].each do |p|
              p.reap
              p.flush
            rescue WeakRef::RefError
            end
            if @pools[frequency].empty?
              @pools.delete(frequency)
              @threads.delete(frequency)
              running = false
            end
          end
        end
      end
    end
end
```

`packages/activerecord/src/connection-adapters/abstract/connection-pool/reaper.ts` is a different design. `registerPool` carries
`@missingRailsCall spawn_thread` and:

- guards `frequency` / `isDiscarded` itself (Rails' only guard is `run`'s, `reaper.rb:70-73`);
- keys a `_timers` map of `setTimeout` handles where Rails keys `@threads` of `Thread`s and asks `alive?`;
- prunes and de-duplicates the pool list at registration (Rails appends unconditionally);
- calls a private `_spawnTimer` that re-arms a timer per tick, with a `_stopTimer` twin;
- and a module-level `spawnThread` function at the bottom of the file that nothing in `registerPool` calls.

ruby-compat has `Thread` (already used inside `_spawnTimer`), `Mutex`, and a `sleep`.

## Acceptance criteria

- [ ] `Reaper` holds `mutex` / `pools` / `threads` class state and `registerPool` is Rails' five lines: `threads[frequency]?.isAlive()`, `spawnThread(frequency)`, `||= []`, `<< new WeakRef(pool)`, inside the mutex only if the body spans an `await` (CLAUDE.md § "The pool monitor guards only sections that span an `await`").
- [ ] `spawnThread` is a private static on `Reaper` holding the `Thread.new` loop: `sleep`, the `select!`, the `each` with `reap` / `flush`, the `empty?` teardown. `_spawnTimer`, `_stopTimer`, `_timers` and the module-level `spawnThread` are gone.
- [ ] The reaper thread does not keep the process alive (the `unref` the timer carries today), stated at the one place it is done.
- [ ] The `@missingRailsCall spawn_thread` receipt is deleted; `pnpm parity:api:calls` green with no new row; `pnpm parity:api:extra:gate` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:extra:gate && pnpm vitest run packages/activerecord/src/reaper.test.ts packages/activerecord/src/reaper.trails.test.ts
```

---
title: "was-loaded-duplicate-append-regression"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6405
claim: "2026-08-12T13:01:41Z"
assignee: "plumb-save-block-through-create-record"
blocked-by: null
closed-reason: null
---

## Context

Rails' `replace_on_target` skips an append its own callbacks already made:

```ruby
@_was_loaded = true
yield(record) if block_given?
...
elsif @_was_loaded || !loaded?
  @association_ids = nil
  target << record
```

(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:468-489`)

`@_was_loaded` is captured by the block `concat_records` / `_create_record`
hand to `insert_record` (`collection_association.rb:366,445`), which
`insert_record` forwards into `record.save(&block)` (`:377-383`).
`Persistence#_create_record` yields it after the INSERT and **before** the
after_create callbacks (`persistence.rb:920-940`) — so a callback that loads
the association cannot make the capture read `true` after the fact.

That mechanism now exists in trails across two PRs:

- #6401 (`converge-collection-association-reset-concat-empty`) added
  `CollectionAssociation._wasLoaded`, the `concatRecords` capture block, and the
  `elsif @_was_loaded || !loaded?` arm in `replaceOnTarget` /
  `replaceOnTargetAsync`.
- #6405 (`plumb-save-block-through-create-record`) threaded the block through
  `save`/`saveBang` → `createOrUpdate` → `_createRecord`/`_updateRecord` to
  Rails' yield site, and made `insertRecord` hand its block to `save` instead of
  invoking it after the save returns.

Neither PR could write the end-to-end regression on its own: #6401 predates the
yield-site plumbing (its capture ran after the save, so an after_create callback
that loads the collection still won the race), and #6405 must not duplicate the
`_wasLoaded` machinery from #6401. The two compose only once both are on `main`.

## The bug is LIVE on main — measured, not predicted

Verified on the #6405 branch (which already has the save-block plumbing). This
test **fails today**, appending the record twice:

```ts
const author = await Author.find(authors("david").id);
await resetCallbacks(Post, "create", async () => {
  afterCreate(Post, async () => {
    await author.posts.load();
  });
  const post = Post.new({ title: "dup", body: "check" });
  await author.posts.push(post);
  const target = await author.posts.toArray();
  expect(target.filter((p) => p.id === post.id)).toHaveLength(1);
});
// → expected [ …(2) ] to have a length of 1 but got 2
```

Two traps cost a cycle when confirming this, so do not repeat them:

- **The association must start unloaded.** Reading `await author.posts.toArray()`
  before the `push` loads it, and the duplicate then disappears —
  `finishReplaceOnTarget`'s `Core#==` re-index (`indexInTarget`) replaces the
  entry instead of appending. That masking is why an earlier pass wrongly
  concluded the property already held.
- **The callback must `await` the load.** A fire-and-forget
  `void author.posts.load()` never completes before `finishReplaceOnTarget`
  runs, and the test passes for the wrong reason.

Re-verified after #6407 (`HasManyAssociation#insertRecord` converged to
`set_owner_attributes` + `super`) and after #6405 rebased onto it: the repro
still fails with 2 target entries, so #6407's shorter call path does not
change the analysis below.

## Why BOTH PRs are required

`finishReplaceOnTarget` (`collection-association.ts`) has no `@_was_loaded` arm
at all — its `else` branch is an unconditional `target.push(record)`.

- **#6401 alone does not fix this.** It captures `_wasLoaded` in the block it
  hands to `insert_record`, but on that branch `insert_record` invokes the block
  _after_ the save returns — i.e. after the after_create callback has already
  loaded the association. The capture therefore reads `true`, and Rails' guard
  `elsif @_was_loaded || !loaded?` (`collection_association.rb:480`) takes the
  append arm anyway. Same duplicate.
- **#6405 alone does not fix this.** It moves the yield to Rails' site
  (`persistence.rb:940`, before the after_create callbacks) but `concat_records`
  on `main` passes no block, and there is no `_wasLoaded` field or guard arm to
  receive it.
- **Together they do.** With #6405's yield point, the capture runs before the
  callback loads the association, so `@_was_loaded` is `false`; the callback
  then loads it, so `!loaded?` is also `false`; the guard skips the append.

So this story is the composition step, and it is a real bug fix, not just
missing coverage. Land it only once both PRs are on `main`.

## Acceptance criteria

1. With both #6401 and #6405 merged, add regression coverage: an `after_create`
   callback on the child that loads the owner's collection must NOT leave a
   duplicated entry in the association target after `owner.things << thing` /
   `owner.things.create(...)` — the callback's own load already appended it, and
   `@_was_loaded` (captured before the callback ran) must make
   `replace_on_target` take the no-append arm.
2. The test fails if `insertRecord`'s block is moved back to after the `save`
   (i.e. it actually pins the yield-site ordering, not just the `_wasLoaded`
   field).
3. Prefer the canonical models/fixtures; if Rails covers this shape in
   `test/cases/associations/has_many_associations_test.rb`, port that test under
   its Rails name rather than writing a trails-only one.

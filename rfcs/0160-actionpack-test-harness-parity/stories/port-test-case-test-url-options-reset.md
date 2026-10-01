---
title: "port-test-case-test-url-options-reset"
status: done
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8322
claim: "2026-10-01T13:19:18Z"
assignee: "port-test-case-test-url-options-reset"
blocked-by: null
closed-reason: null
---

## Context

`TestCaseTest#test_url_options_reset`
(`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb:236-241`)
drives `DefaultUrlOptionsCachingController` (`:213-227`), whose
`default_url_options` override merges an ivar a `before_action` sets, and checks
that the per-request `url_options` memo is rebuilt for the request.

`port-test-case-test-requests-and-params` wrote the port and had it passing, but
left it `it.skip` in
`packages/actionpack/src/action-controller/controller/test-case.test.ts` to stay
under the PR LOC ceiling. `default_url_options` is a `class_attribute` in trails,
so `Base.prototype` carries it as an accessor and the override redefines that
accessor rather than declaring a method:

```ts
class DefaultUrlOptionsCachingController extends Base {
  declare _dynamicOpt: string | undefined;

  static {
    this.beforeAction(function (this: DefaultUrlOptionsCachingController) {
      this._dynamicOpt = "opt";
    });
  }

  async testUrlOptionsReset() {
    await this.render({ plain: this.urlFor() });
  }
}
const defaultUrlOptions = Object.getOwnPropertyDescriptor(Base.prototype, "defaultUrlOptions")!;
Object.defineProperty(DefaultUrlOptionsCachingController.prototype, "defaultUrlOptions", {
  get(this: DefaultUrlOptionsCachingController) {
    if (this._dynamicOpt !== undefined) {
      return { ...defaultUrlOptions.get!.call(this), dynamic_opt: this._dynamicOpt };
    } else {
      return defaultUrlOptions.get!.call(this);
    }
  },
});
Object.defineProperty(DefaultUrlOptionsCachingController, "name", {
  value: "TestCaseTest::DefaultUrlOptionsCachingController",
});
```

```ts
it("url options reset", async () => {
  tc.controller = new DefaultUrlOptionsCachingController();
  await tc.get("testUrlOptionsReset");
  assertNil(tc.request.params["dynamic_opt"]);
  assertMatch(/dynamic_opt=opt/, tc.response.body);
});
```

## Acceptance criteria

- `DefaultUrlOptionsCachingController` and `url options reset` are added to
  `test-case.test.ts` at their Rails positions, and the test passes.

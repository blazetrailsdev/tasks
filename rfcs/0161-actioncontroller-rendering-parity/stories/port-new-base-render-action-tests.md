---
title: "port-new-base-render-action-tests"
status: ready
updated: 2026-10-11
rfc: "0161-actioncontroller-rendering-parity"
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

Split out of `port-new-base-render-action-and-layout-tests` (RFC 0161): that
story's PR ported `new_base/render_layout_test.rb` and stopped at the PR LOC
ceiling, so `vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_action_test.rb`
(314 lines, 23 tests) is still unported. `pnpm parity:test --package actioncontroller`
reports `controller/new-base/render-action.test.ts` 0/23.

The port is already written and was green against that PR's tree (20 pass, 3
parked). It is reproduced whole below; drop it in at
`packages/actionpack/src/action-controller/controller/new-base/render-action.test.ts`.

Facts established while writing it:

- Four Rails modules each define their own `BasicController`
  (`render_action_test.rb:5,123,206,261`), so each module is a bare `{ }` block
  with its own `registerConstant` and `controllerConstants.set`.
- `RenderLayoutTest`'s two raising tests (`:90-94`, `:110-114`) pass
  `"action_dispatch.show_exceptions" => :none`. trails' `DebugExceptions`
  (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`)
  gates on its constructor option instead of `wrapper.show?(request)`
  (`action_dispatch/middleware/debug_exceptions.rb:44`), so the exception is
  rendered rather than raised. They are parked on
  `debug-exceptions-gates-on-wrapper-show-and-request-headers`.
- `TestLayout`'s "builder works with layouts" (`:195-198`) needs the builder
  template handler: parked on
  `builder-template-handler-and-actionpack-builder-fixtures`.
- `RenderActionWithBothLayouts` (`:261`) depends on the `_writeLayoutMethod`
  word-boundary fix in `packages/actionview/src/layouts.ts`, which the parent
  story's PR landed.

## Acceptance criteria

- `controller/new-base/render-action.test.ts` ports every test of
  `render_action_test.rb` in Rails order, under the Rails module and class
  names, on the harness's `Rack::TestCase`.
- `pnpm parity:test --package actioncontroller` reports the file complete, the
  three parked tests aside.
- A parked test is un-skipped here if its blocking story has landed.

## The port

```ts
import { beforeEach, describe, it } from "vitest";
import { FixtureResolver, MissingTemplate } from "@blazetrails/actionview";
import { assertRaises } from "@blazetrails/activesupport";
import { ArgumentError, registerConstant } from "@blazetrails/ruby-compat";
import { Base } from "../../base.js";
import { controllerConstants } from "../../../action-dispatch/http/request.js";
import { ApplicationController, Rack } from "../../../test-helpers/abstract-unit.js";

{
  registerConstant("RenderAction", { name: "RenderAction" });

  class BasicController extends Base {
    static {
      Object.defineProperty(this, "name", { value: "RenderAction::BasicController" });
      this.viewPaths([
        new FixtureResolver({ "render-action/basic/hello-world.html.tse": "Hello world!" }),
      ]);
    }

    async helloWorld(): Promise<void> {
      await this.render({ action: "helloWorld" });
    }

    async helloWorldAsString(): Promise<void> {
      await this.render("helloWorld");
    }

    async helloWorldAsStringWithOptions(): Promise<void> {
      await this.render("helloWorld", { status: 404 });
    }

    async helloWorldAsSymbol(): Promise<void> {
      await this.render("helloWorld");
    }

    async helloWorldWithSymbol(): Promise<void> {
      await this.render({ action: "helloWorld" });
    }

    async helloWorldWithLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: true });
    }

    async helloWorldWithLayoutFalse(): Promise<void> {
      await this.render({ action: "helloWorld", layout: false });
    }

    async helloWorldWithLayoutNil(): Promise<void> {
      await this.render({ action: "helloWorld", layout: null });
    }

    async helloWorldWithCustomLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: "greetings" });
    }
  }

  controllerConstants.set("render_action/basic", BasicController);

  class RenderActionTest extends Rack.TestCase {}

  describe("RenderActionTest", () => {
    let t: RenderActionTest;

    beforeEach(({ task }) => {
      t = new RenderActionTest(task.name);
    });

    it("rendering an action using :action => <String>", async () => {
      await t.get("/render_action/basic/helloWorld");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });

    it("rendering an action using '<action>'", async () => {
      await t.get("/render_action/basic/helloWorldAsString");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });

    it("rendering an action using '<action>' and options", async () => {
      await t.get("/render_action/basic/helloWorldAsStringWithOptions");

      t.assertBody("Hello world!");
      t.assertStatus(404);
    });

    it("rendering an action using :action", async () => {
      await t.get("/render_action/basic/helloWorldAsSymbol");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });

    it("rendering an action using :action => :hello_world", async () => {
      await t.get("/render_action/basic/helloWorldWithSymbol");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });
  });

  class RenderLayoutTest extends Rack.TestCase {}

  describe("RenderLayoutTest", () => {
    let t: RenderLayoutTest;

    beforeEach(({ task }) => {
      t = new RenderLayoutTest(task.name);
    });

    // BLOCKED: debug-exceptions-gates-on-wrapper-show-and-request-headers
    it.skip("rendering with layout => true", async () => {
      await assertRaises([ArgumentError], {}, async () => {
        await t.get("/render_action/basic/helloWorldWithLayout", {
          headers: { "action_dispatch.show_exceptions": "none" },
        });
      });
    });

    it("rendering with layout => false", async () => {
      await t.get("/render_action/basic/helloWorldWithLayoutFalse");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });

    it("rendering with layout => :nil", async () => {
      await t.get("/render_action/basic/helloWorldWithLayoutNil");

      t.assertBody("Hello world!");
      t.assertStatus(200);
    });

    // BLOCKED: debug-exceptions-gates-on-wrapper-show-and-request-headers
    it.skip("rendering with layout => 'greetings'", async () => {
      await assertRaises([MissingTemplate], {}, async () => {
        await t.get("/render_action/basic/helloWorldWithCustomLayout", {
          headers: { "action_dispatch.show_exceptions": "none" },
        });
      });
    });
  });
}

{
  registerConstant("RenderActionWithApplicationLayout", {
    name: "RenderActionWithApplicationLayout",
  });

  class BasicController extends ApplicationController {
    static {
      Object.defineProperty(this, "name", {
        value: "RenderActionWithApplicationLayout::BasicController",
      });
      this.viewPaths([
        new FixtureResolver({
          "render-action-with-application-layout/basic/hello-world.html.tse": "Hello World!",
          "render-action-with-application-layout/basic/hello.html.builder": "xml.p 'Hello'",
          "layouts/application.html.tse": "Hi <%= yield %> OK, Bye",
          "layouts/greetings.html.tse": "Greetings <%= yield %> Bye",
          "layouts/builder.html.builder": "xml.html do\n  xml << yield\nend",
        }),
      ]);
    }

    async helloWorld(): Promise<void> {
      await this.render({ action: "helloWorld" });
    }

    async helloWorldWithLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: true });
    }

    async helloWorldWithLayoutFalse(): Promise<void> {
      await this.render({ action: "helloWorld", layout: false });
    }

    async helloWorldWithLayoutNil(): Promise<void> {
      await this.render({ action: "helloWorld", layout: null });
    }

    async helloWorldWithCustomLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: "greetings" });
    }

    async withBuilderAndLayout(): Promise<void> {
      await this.render({ action: "hello", layout: "builder" });
    }
  }

  controllerConstants.set("render_action_with_application_layout/basic", BasicController);

  class LayoutTest extends Rack.TestCase {}

  describe("LayoutTest", () => {
    let t: LayoutTest;

    beforeEach(({ task }) => {
      t = new LayoutTest(task.name);
    });

    it("rendering implicit application.html.erb as layout", async () => {
      await t.get("/render_action_with_application_layout/basic/helloWorld");

      t.assertBody("Hi Hello World! OK, Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => true", async () => {
      await t.get("/render_action_with_application_layout/basic/helloWorldWithLayout");

      t.assertBody("Hi Hello World! OK, Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => false", async () => {
      await t.get("/render_action_with_application_layout/basic/helloWorldWithLayoutFalse");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });

    it("rendering with layout => :nil", async () => {
      await t.get("/render_action_with_application_layout/basic/helloWorldWithLayoutNil");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });

    it("rendering with layout => 'greetings'", async () => {
      await t.get("/render_action_with_application_layout/basic/helloWorldWithCustomLayout");

      t.assertBody("Greetings Hello World! Bye");
      t.assertStatus(200);
    });
  });

  class TestLayout extends Rack.TestCase {
    static {
      this.testing(BasicController);
    }
  }

  describe("TestLayout", () => {
    let t: TestLayout;

    beforeEach(({ task }) => {
      t = new TestLayout(task.name);
    });

    // BLOCKED: builder-template-handler-and-actionpack-builder-fixtures
    it.skip("builder works with layouts", async () => {
      await t.get(":withBuilderAndLayout");
      t.assertResponse("<html>\n<p>Hello</p>\n</html>\n");
    });
  });
}

{
  registerConstant("RenderActionWithControllerLayout", {
    name: "RenderActionWithControllerLayout",
  });

  class BasicController extends Base {
    static {
      Object.defineProperty(this, "name", {
        value: "RenderActionWithControllerLayout::BasicController",
      });
      this.viewPaths([
        new FixtureResolver({
          "render-action-with-controller-layout/basic/hello-world.html.tse": "Hello World!",
          "layouts/render-action-with-controller-layout/basic.html.tse":
            "With Controller Layout! <%= yield %> Bye",
        }),
      ]);
    }

    async helloWorld(): Promise<void> {
      await this.render({ action: "helloWorld" });
    }

    async helloWorldWithLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: true });
    }

    async helloWorldWithLayoutFalse(): Promise<void> {
      await this.render({ action: "helloWorld", layout: false });
    }

    async helloWorldWithLayoutNil(): Promise<void> {
      await this.render({ action: "helloWorld", layout: null });
    }

    async helloWorldWithCustomLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: "greetings" });
    }
  }

  controllerConstants.set("render_action_with_controller_layout/basic", BasicController);

  class ControllerLayoutTest extends Rack.TestCase {}

  describe("ControllerLayoutTest", () => {
    let t: ControllerLayoutTest;

    beforeEach(({ task }) => {
      t = new ControllerLayoutTest(task.name);
    });

    it("render hello_world and implicitly use <controller_path>.html.erb as a layout.", async () => {
      await t.get("/render_action_with_controller_layout/basic/helloWorld");

      t.assertBody("With Controller Layout! Hello World! Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => true", async () => {
      await t.get("/render_action_with_controller_layout/basic/helloWorldWithLayout");

      t.assertBody("With Controller Layout! Hello World! Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => false", async () => {
      await t.get("/render_action_with_controller_layout/basic/helloWorldWithLayoutFalse");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });

    it("rendering with layout => :nil", async () => {
      await t.get("/render_action_with_controller_layout/basic/helloWorldWithLayoutNil");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });
  });
}

{
  registerConstant("RenderActionWithBothLayouts", { name: "RenderActionWithBothLayouts" });

  class BasicController extends Base {
    static {
      Object.defineProperty(this, "name", {
        value: "RenderActionWithBothLayouts::BasicController",
      });
      this.viewPaths([
        new FixtureResolver({
          "render-action-with-both-layouts/basic/hello-world.html.tse": "Hello World!",
          "layouts/application.html.tse": "Oh Hi <%= yield %> Bye",
          "layouts/render-action-with-both-layouts/basic.html.tse":
            "With Controller Layout! <%= yield %> Bye",
        }),
      ]);
    }

    async helloWorld(): Promise<void> {
      await this.render({ action: "helloWorld" });
    }

    async helloWorldWithLayout(): Promise<void> {
      await this.render({ action: "helloWorld", layout: true });
    }

    async helloWorldWithLayoutFalse(): Promise<void> {
      await this.render({ action: "helloWorld", layout: false });
    }

    async helloWorldWithLayoutNil(): Promise<void> {
      await this.render({ action: "helloWorld", layout: null });
    }
  }

  controllerConstants.set("render_action_with_both_layouts/basic", BasicController);

  class ControllerLayoutTest extends Rack.TestCase {}

  describe("ControllerLayoutTest", () => {
    let t: ControllerLayoutTest;

    beforeEach(({ task }) => {
      t = new ControllerLayoutTest(task.name);
    });

    it("rendering implicitly use <controller_path>.html.erb over application.html.erb as a layout", async () => {
      await t.get("/render_action_with_both_layouts/basic/helloWorld");

      t.assertBody("With Controller Layout! Hello World! Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => true", async () => {
      await t.get("/render_action_with_both_layouts/basic/helloWorldWithLayout");

      t.assertBody("With Controller Layout! Hello World! Bye");
      t.assertStatus(200);
    });

    it("rendering with layout => false", async () => {
      await t.get("/render_action_with_both_layouts/basic/helloWorldWithLayoutFalse");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });

    it("rendering with layout => :nil", async () => {
      await t.get("/render_action_with_both_layouts/basic/helloWorldWithLayoutNil");

      t.assertBody("Hello World!");
      t.assertStatus(200);
    });
  });
}
```

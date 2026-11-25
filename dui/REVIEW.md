# dui developer experience review

**Verdict for v0.2.1.** I would use dui for a Bun + Datastar settings page or internal tool today. I would budget time to verify keyboard behavior, assemble styles, and integrate updates before adopting it as a team's default. It already delivers shadcn/ui's most valuable architectural promise: the application owns readable component source. The shortfall is what happens between seeing a good demo and shipping that same experience in your application.

## Where dui earns its place

- **Small, inspectable primitives.** Accordion uses native disclosures, Switch is a real checkbox, and Dialog uses a browser modal. In Chromium, the dialog opened modally, Escape closed it, and focus returned to its trigger. Checking the Datastar-bound checkbox enabled Continue. These are good reasons to choose dui for a server-rendered app. [Dialog](site/src/ui/dialog.tsx) · [Checkbox example](site/src/examples/checkbox-datastar.tsx)
- **The distribution model works.** The published installer verified the release checksum and ran without elevated privileges with a temporary install directory. All 21 components and their shared library installed from the live registry and matched the checkout byte for byte. All 67 example modules rendered using those installed files. A second add preserved local edits by default. [Installer](site/public/install.sh) · [Registry](site/src/registry.ts)
- **The docs make implementation choices visible.** Each preview uses the example source displayed beside it, links to additional components it uses, and explains differences from shadcn/ui. All 21 component pages fit a 390 CSS-pixel viewport without document-level horizontal scrolling. Keep this connection between examples and source. [Component pages](site/src/pages/pages.tsx) · [Example metadata](site/src/pages/examples.tsx)

## Findings in adoption order

### 1. Replace the public payment example immediately

The Field demo renders a real form with named card number and CVV inputs and a submit button. With dummy values on the local build, Chromium attempted a GET to the docs page with query keys `name`, `number`, `month`, `cvv`, `same`, and `comments`. Someone trying the live example could put payment details in browser history and request logs. The request was intercepted locally. Actual visitor activity and log retention are unknown. [Field demo](site/src/examples/field-demo.tsx)

Use a project-preferences form that demonstrates the same text, select, checkbox, and validation states. Give Save a visible result. Exercise click and Enter submission with scripting enabled and disabled and assert that private input never enters a URL. A client-side submit handler alone leaves the native fallback exposed.

### 2. Make the first successful render deterministic

On Bun 1.4.4, `bun init -y` created a project without `src/`. The CLI correctly wrote `lib/` and printed a matching alias. The installation page then instructed me to map `#jsx/*` to `./src/lib/jsx/*.ts`. Following that snippet produced “Cannot find module '#jsx/jsx-runtime'”. Changing the mapping to `./lib/jsx/*.ts` made the documented counter render and increment from 0 to 1. An absolute `--dir` also yielded a misleading alias beginning `.//tmp/`. This is a particularly expensive first impression because the download and copy steps both report success. [Installation guide](site/src/pages/pages.tsx) · [CLI path handling](site/src/cli/add.ts) · [shadcn/ui initialization](https://ui.shadcn.com/docs/cli#init)

Fix the guide immediately with an exact filename, working directory, launch command, and matching root and `src/` layouts. Then add an idempotent `dui init` that detects the layout, preserves existing config, configures JSX and the theme, and offers a runnable counter. Test it in a blank directory, a default Bun app, an existing `src/` app, and a workspace package. The acceptance test is one visible click after following the published instructions verbatim.

### 3. Deliver keyboard and contrast defaults developers can trust

- **Tabs.** Focusing Account and pressing Right Arrow left focus on Account. Tab then moved to Password, placing both triggers in the page's Tab order. Clicking Password correctly selected it and the docs disclose the keyboard limitation. Implement a single tab stop with Left/Right navigation and wrapping, label each tablist, and make a text-only panel keyboard reachable. Test two independent tabsets and programmatic signal changes alongside pointer input. Today the signal name also determines DOM IDs, so rendering the same factory twice duplicates IDs and couples the instances. [Tabs implementation](site/src/ui/tabs.tsx) · [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- **Color.** axe measured white text on the dark destructive Button and Badge at **2.88:1**, below its 4.5:1 threshold for these text sizes. The destructive Dialog trigger inherits the Button result. In light mode the invalid Field description measured 4.11:1 and selected choice-card description 3.86:1. Introduce a destructive foreground/background pair and tune invalid and selected text against their actual surfaces. Verify both schemes and hover/focus states. [Button CSS](site/src/ui/button.css) · [Badge CSS](site/src/ui/badge.css) · [Theme](site/src/lib/theme.css)
- **Form feedback.** The validation demo visually places its description and error below the email input without associating either by ID. Wire up the description and active error so refocusing a field reveals the reason it failed. axe also flagged the choice-card radios' labels, although Chromium's accessibility snapshot named the VM radio from its wrapping label. Give the option a concise explicit name and separate description, then verify with assistive technology. [Validation example](site/src/examples/field-validation.tsx) · [Choice cards](site/src/examples/field-choice-card.tsx)

### 4. Make a copied example look like its preview

`dui add dialog` correctly installs Button, but `DIALOG_CSS` contains only the dialog stylesheet. The documentation site globally includes every component's CSS. A consumer following the single-component Button recipe can therefore wire the dialog correctly and still see unstyled triggers and footer buttons. There is a second dependency boundary at the example level: the first Field example imports Button, Checkbox, Input, Native Select, and Textarea, while the installation command on the page adds only Field. The “Also uses” links help readers discover the pieces but leave the assembly to them. [Site style assembly](site/src/pages/layout.tsx) · [Dialog](site/src/ui/dialog.tsx) · [Field example](site/src/examples/field-demo.tsx)

Generate a deterministic stylesheet entry point for the installed set, with theme first, dependencies once, and local overrides last. Generate an exact install command for each example from the imports the docs already collect. Test Dialog and the Field form in isolated consumer projects using only the files and styles those instructions produce. Compare computed styles and interaction with the docs preview. Show how to change a theme token and make the existing global body and box-sizing rules clear to developers integrating into an established site. [Example dependency extraction](site/src/pages/examples.tsx) · [shadcn/ui theming](https://ui.shadcn.com/docs/theming)

### 5. Make the second install as trustworthy as the first

I edited the installed Button CSS and shared theme. `dui add dialog` kept both edits. Repeating with `--overwrite` replaced **both**, although the command named only Dialog. The switch does what help advertises, but gives no advance view of the transitive impact. Also, `DUI_VERSION` pins the binary while `add` still fetches the live registry. Two projects bootstrapped with the same CLI version can acquire different source over time. [Add implementation](site/src/cli/add.ts) · [Installer](site/public/install.sh) · [shadcn/ui add previews and diffs](https://ui.shadcn.com/docs/cli#add)

Start with `add --dry-run` and file-level diffs that distinguish requested files, shared files, identical content, and local changes. Offer selective replacements. Next publish immutable versioned registry snapshots and record the source revision and installed hashes so reviewers can distinguish an upstream update from a local edit. Test a customized theme and Button across a Dialog update.

### 6. Focus the product on the Bun + Datastar workflow

- The Linux ARM64 release asset was 110,087,160 bytes (105 MiB). The same binary adds source, serves the entire docs site, and exposes a privileged site deployment command in consumer help. `dui --help` raised a Bun argument-parser stack trace, while `dui help` worked. Fix conventional help and errors first. Measure a Bun-run consumer entry point containing only project commands, while retaining the standalone binary for people who prefer it. [CLI](site/src/cli/main.ts) · [Build](site/scripts/build.ts)
- Prop passthrough is a strength for Datastar, but many components accept `Record<string, unknown>`. A misspelled native prop type-checks and reaches the markup. An easy mistake such as `<Button href="…" disabled>` renders an anchor whose disabled attribute has no native effect. Type common native props and mutually exclusive Button modes, retain an extension path for Datastar, and add focused examples of valid submit, link, and disabled actions. [Button](site/src/ui/button.tsx) · [Runtime](site/src/lib/jsx/jsx-runtime.ts)
- Once onboarding and interactions are reliable, ship one installable settings screen that saves, displays server-side validation, and preserves focus and input during a Datastar update. It would demonstrate why someone should pick this stack. Use friction building that screen to choose the next primitives. A larger catalog alone would leave every issue above intact. [Current catalog](site/src/registry.ts) · [shadcn/ui component catalog](https://ui.shadcn.com/docs/components)

## Release criteria and evidence

| Milestone | Observable pass condition |
| --- | --- |
| Immediate patch | No sensitive demo values submitted. The published quickstart runs in both layouts. Conventional help exits successfully. |
| Adoption-ready release | Add Dialog or the full Field example in a clean app with one generated command and one stylesheet import. Keyboard tests pass and both themes meet text contrast thresholds. |
| Team-ready release | Preview a pinned upstream update, see exactly which files differ, apply selected changes, and preserve the team's customized theme. |

The current four-platform release workflow checks compilation, HTTP routes, registry content, and the existence of copied files. Extend it with one Linux consumer job that runs the published quickstart, renders installed examples, and tests form submission, tab navigation, and contrast. A passing site build cannot catch a consumer alias pointing at the wrong directory. [Release workflow](../.github/workflows/dui-release.yml)

Reviewed commit `1096620` and published dui 0.2.1 on Linux ARM64 with Bun 1.4.4. Local type, formatting, and build checks passed. Browser testing used Playwright with Chromium 159, axe-core 4.14.1 on previews across all 21 dark component pages, and targeted light-mode checks. The 67-example check verified server rendering. Browser interactions were sampled separately. Screen-reader testing, Safari/Firefox behavior, and pixel-level visual parity remain unverified. The shadcn/ui comparison uses its published workflows and design principles, without a head-to-head timing study. [shadcn/ui introduction](https://ui.shadcn.com/docs)

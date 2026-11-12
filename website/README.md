# XShot website

A portable static website with an English homepage at `/`, Simplified Chinese at `/zh/`, and eight help articles in each language. The build produces 20 localized HTML pages—two homepages, two documentation indexes and 16 articles—plus one authentic single-file XShot HTML export at `demos/release-workflow.html`. Source is HTML, CSS and JavaScript; the builder and checker require Python 3 with no package dependencies.

From the repository root:

```sh
python3 website/scripts/build.py
python3 website/scripts/check.py
python3 -m http.server 4380 --bind 127.0.0.1 --directory website/dist
```

Open [the English preview](http://127.0.0.1:4380/) or [the Chinese preview](http://127.0.0.1:4380/zh/). Documentation starts at `/docs/` and `/zh/docs/`. Preview the generated `website/dist/`; `website/index.html` is a Python `string.Template` source containing localization placeholders.

CSS and JavaScript URLs include a content hash generated during the build. Reload an existing preview after rebuilding; changed assets then receive a new URL instead of reusing a cached response.

The checker validates the 20 generated localized pages, language counterparts, alternate links, local resources, anchors, duplicate IDs and basic HTML semantics. It separately checks the native HTML export against its pinned byte count and SHA-256 and verifies its embedded screenshot and hotspot payload. It does not establish visual fidelity, interaction quality or accessibility conformance; inspect the relevant browser states separately.

## Source and localization

- `index.html`: shared homepage template, including the screenshot-sheet hero, white feature overview and detailed sections.
- `locales/home.en.json` and `home.zh.json`: homepage copy, annotation captions, image descriptions and metadata. Nested keys are flattened into template variables.
- `locales/ui.en.json` and `ui.zh.json`: shared headers, footers and documentation interface copy.
- `docs-content.en.json` and `docs-content.json`: English and Chinese help articles. Stable slugs generate article routes, navigation, page outlines and separate language search indexes.
- `styles.css`: shared reading styles, the blue paper world, responsive layouts and local interaction feedback.
- `app.js`: locale-aware messages, mobile navigation, hero playback state, the lower keyboard-operated screenshot gallery, project disclosure, documentation search and command copying.
- `hero-paper.js`: dependency-free WebGL renderer for the two-sided screenshot-sheet curl. The homepage loads it before `app.js`; documentation does not load it.
- `scripts/build.py`: locale registry, templates, route generation and optional deployment metadata. It copies `hero-paper.js`, the production assets and the hash-pinned native HTML export into the output.
- `scripts/check.py`: build checks, including its expected-locale registry.
- `demos/release-workflow.html` and `demos/manifest.json`: unchanged native HTML export and its source, byte count, hash and payload provenance.
- `assets/` and `ASSETS.json`: approved brand assets, authentic product images, font licenses and provenance. Root `DESIGN.md` and `.impeccable/design.json` describe the current implemented visual system.

English is the default route and `x-default` alternate. Language switches keep the same article and preserve section hashes when JavaScript is available. Article bodies are generated statically; search loads the matching locale's `search-index.json` only when needed.

To add a language:

1. Add its code, route prefix, HTML language tag, switch label and article filename to `LOCALES` in `scripts/build.py`; add its expected route/tag to `scripts/check.py` and update alternate-link expectations there.
2. Add `locales/home.<code>.json`, `locales/ui.<code>.json` and translated documentation with matching slugs and heading IDs. Preserve all required template keys.
3. Extend `app.js` locale selection and interaction messages. Its current runtime explicitly supports `en` and `zh`; the builder registry alone does not localize dynamic feedback.
4. Check font coverage and text fitting, including handwriting, navigation, article counterparts and mobile layouts. Both Chinese fonts are text subsets; update their glyph coverage when changing their text.
5. Rebuild, run the checker and inspect homepage, documentation, keyboard and mobile states in the new language.

## Screenshot layers and motion

The user selected the blue layered-paper reference on 2026-11-02, replacing the earlier white annotation-ribbon composition. The homepage uses the approved white SVG wordmark within a saturated blue hero, white pill actions, three overlapping screenshot sheets and a shallow wave into a three-column feature overview. Detailed capture, recording, local-project and help sections follow it. The user’s subsequent 2026-11-02 refinement makes the homepage fill the viewport: the blue hero and white sections reach the browser edges while their content keeps centered reading gutters.

The front sheet uses `assets/plates/native-editor.png` (2160×1612). The overview uses `capture-preview.png`, `style-preview.png` and `demo-preview.png` (1920×1080 each) from the same directory. These PNGs preserve the decoded pixels of existing authentic WebP screenshots; controls and text were not synthesized. Source sidecars and PNG metadata record provenance. Lower gallery and documentation imagery retain their existing WebP assets. Launchboard remains demonstration content.

`hero-paper.js` bends the front texture around a diagonal cylinder using a depth-tested WebGL 1 mesh of 38,025 vertices. It shades the white reverse and rolled edge rather than drawing a flat folded-corner overlay. When WebGL, context or texture initialization fails, the authentic front image remains available and shifts to reveal backing sheets through the same controls. Headings, guide links and the lower gallery remain ordinary HTML.

`app.js` samples the browser's native CSS animation clock through the Web Animations API for one finite 4.8-second opening. Rear sheets settle, then the short paper note appears. After that, pull the lower-right corner toward the upper left to peel the actual mesh further, from resting progress 1 to 2.2; release settles to rest or open over 420ms. The rear sheets support bounded drags (±45px horizontally, ±35px vertically), and the numbered caption buttons select capture, marked or finished context.

The corner is a native button: click, Enter or Space toggles it; Left/Up opens, Right/Down closes, End opens fully and Home/Escape restores the finished sheet. Escape cancels a captured drag and returns focus. Pointer capture supports mouse, touch and pen on the corner handle. Replay clears sheet offsets and selection before restarting the original moment. Pause is stored for the session. Rendering stops at idle and while hidden or offscreen; resize can redraw the current static state. Reduced motion keeps direct dragging and instant button or keyboard state changes, disables automatic playback, and removes hover lift and settling tweens.

The capture and styling overview images link to the appropriate guides; the product-demo preview and its action jump to the embedded walkthrough at `#step-demo`. The lower screenshot gallery still supports tabs, arrow keys and Home/End. Other motion stays local to a hover, image change, focus detail or folder disclosure.

`ASSETS.json` and the individual source sidecars describe the production assets. The included files under `assets/` and `demos/` are sufficient to build; the ignored original `artifacts/` directories are not required.

## Native HTML walkthrough

The recording section embeds `demos/release-workflow.html` in a titled, lazy-loaded iframe with `sandbox="allow-scripts"` and `referrerpolicy="no-referrer"`. Full-view and HTML-download links remain outside the frame. Desktop uses a 16:10 frame with a 620–860px height range; widths of 761–1150px use a 560px minimum, and mobile uses a 460px frame.

This 3,470,675-byte artifact is byte-for-byte the original `artifacts/product-demo-20261101/v5/exports/Release workflow.html`, with SHA-256 `5225873921a27d345aac47c9d1b1f44b4dd88c835215d0e4511445ed44ca6c73`. It contains five PNG screenshot states and four hotspots, with its own step navigation, replay and finish/retry flow. Images, styles and scripts are embedded in the one HTML file; it needs no separate assets or network requests. It advances recorded screenshot states rather than operating a live application. Launchboard is demonstration content, and step titles and descriptions were edited manually.

The exported player keeps its original styling and English content. Website typography, translations and motion rules apply to the surrounding toolbar, caption and links; they do not restyle or translate the native export. The Chinese homepage explicitly identifies it as an English example. Its source was a task-local English demo build, which does not establish that the current public application ships English localization.

Generated `_headers` keeps site pages on same-origin scripts and styles and allows same-origin frames. The exact export route has its own policy permitting the inline script/style and embedded image data that the unchanged export requires, with same-origin framing. Configure the chosen static host to honor these route-specific headers; Python’s preview server does not apply `_headers`.

## Fonts

All fonts are self-hosted with OFL licenses:

- DM Sans variable Latin (400–900): `dm-sans.woff2`, `DM-Sans-OFL.txt`, `dm-sans-source.json`.
- Noto Sans SC under CSS family `XShot Sans` (100–900): `xshot-sans.woff2`, `OFL.txt`, `font-source.json`.
- Caveat variable Latin (400–700), for short English handwriting: `caveat.woff2`, `Caveat-OFL.txt`, `caveat-source.json`.
- Zhi Mang Xing regular (400), a 10,564-byte Chinese handwriting text subset: `zhi-mang-xing.ttf`, `Zhi-Mang-Xing-OFL.txt`, `zhi-mang-xing-source.json`.

Zhi Mang Xing is used only for Chinese layer captions and the short paper note. Body copy remains in Noto Sans SC. Add required glyphs to the relevant subset before introducing new Chinese text.

## Product facts and publishing

Use current `Sources/XShot/`, `Resources/Info.plist`, repository `README.md` and `PRODUCT.md` as the factual baseline. Update homepage claims, installation help and version information together. The homepage download actions lead to the latest GitHub Release. The installation guide covers the v0.2.0 DMG for Apple Silicon Macs on macOS 14 or later and keeps source-build instructions as a second option. The app in the DMG uses ad hoc signing and has no Apple notarization.

Deployment is undecided. Deploy `website/dist/`; its relative paths support a static-host subpath such as `/xshot/`. This source tree does not establish a public website URL or hosting account.

When the public origin is known, set `SITE_URL` to the full site base, including a subpath when applicable, to generate canonical URLs, absolute alternates, `sitemap.xml` and the robots sitemap reference:

```sh
SITE_URL=https://example.com/xshot python3 website/scripts/build.py
python3 website/scripts/check.py
```

Without `SITE_URL`, language alternates remain relative and the build omits invented canonical and sitemap URLs. `_headers` supplies route-specific content policies and basic response protections, including the narrow native-export policy described above; confirm equivalent configuration on the chosen host.

The design record describes the current source, including the user-approved reference direction. It does not claim that screenshot comparison receipts or exact-fidelity gates have passed.

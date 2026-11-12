---
name: XShot Website
description: Blue fields, authentic screenshot sheets and a physical paper curl for XShot's public website.
colors:
  hero-bright: "#3974f7"
  hero-blue: "#346bf1"
  hero-deep: "#2b5fe9"
  blue: "#1768f6"
  brand: "#3478f6"
  action: "#195ecc"
  ink: "#10121c"
  muted: "#5d687d"
  line: "#e0e5ef"
  surface: "#f0f4fc"
  soft: "#f8faff"
  paper: "#fff"
  sheet: "#f6f8ff"
  feature-tile: "#e9f0ff"
  demo-stage: "#121e35"
typography:
  display:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "clamp(43px, 4.1vw, 65px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  display-zh:
    fontFamily: "XShot Sans, sans-serif"
    fontSize: "clamp(44px, 4.8vw, 73px)"
    fontWeight: 900
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "clamp(36px, 3.9vw, 60px)"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  overview-title:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "clamp(16px, 1.45vw, 22px)"
    fontWeight: 500
    lineHeight: 1.55
  body:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "14px"
    lineHeight: 1.95
  label:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.5
  hero-label:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
  annotation:
    fontFamily: "Caveat, XShot Sans, sans-serif"
    fontSize: "19px"
    lineHeight: 1.1
  annotation-zh:
    fontFamily: "Zhi Mang Xing, XShot Sans, sans-serif"
    fontSize: "18px"
    lineHeight: 1.4
  paper-note:
    fontFamily: "Caveat, XShot Sans, sans-serif"
    fontSize: "22px"
    lineHeight: 1.05
  caption:
    fontFamily: "DM Sans, XShot Sans, sans-serif"
    fontSize: "12px"
    lineHeight: 1.6
rounded:
  badge: "4px"
  key: "5px"
  navigation: "6px"
  input: "7px"
  image: "8px"
  control: "9px"
  sheet: "12px"
  feature-symbol: "15px"
  compact-pill: "30px"
  hero-pill: "40px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  content: "20px"
  lg: "24px"
  xl: "28px"
  group: "40px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "#1255cc"
    textColor: "{colors.paper}"
  button-hero:
    backgroundColor: "{colors.paper}"
    textColor: "#1c3685"
    typography: "{typography.hero-label}"
    rounded: "{rounded.hero-pill}"
    padding: "16px 28px"
  button-hero-hover:
    backgroundColor: "#f1f5ff"
    textColor: "#1540b5"
  button-header:
    backgroundColor: "{colors.paper}"
    textColor: "#1b51d9"
    rounded: "{rounded.compact-pill}"
    padding: "11px 22px"
  button-reading-compact:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  text-link:
    textColor: "{colors.action}"
  search-input:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "11px 10px 11px 34px"
  hero-navigation:
    textColor: "{colors.paper}"
    padding: "12px 0"
  keyboard-key:
    backgroundColor: "{colors.paper}"
    textColor: "#40516d"
    rounded: "{rounded.key}"
    padding: "4px 7px"
  feature-symbol:
    backgroundColor: "{colors.feature-tile}"
    textColor: "#356dff"
    rounded: "{rounded.feature-symbol}"
    size: "60px"
  feature-preview:
    backgroundColor: "#e7effd"
    rounded: "{rounded.sheet}"
    height: "258px"
  project-folder:
    backgroundColor: "#f1f5fe"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "25px 28px"
---

# Design System: XShot Website

## Overview

**Creative North Star: "The Opening Sheet"**

A saturated blue field holds white type, the approved white wordmark and three overlapping screenshot sheets. The front sheet opens at its lower-right corner to show a lit white reverse; handwritten pointers explain capture, annotation and the finished result. A shallow asymmetric wave joins this material scene to a white, image-led feature overview. The blue hero and white sections extend to the viewport edges, with a centered inner content column.

The screenshot fronts remain authentic XShot interface pixels. Website annotations and paper shading are separate editorial layers. Promotional pages use this physical, expressive language; help pages retain a quiet white reading surface, shared sans typography and blue navigation. The exact approved open-corner identity remains an asset, not a shape to redraw.

This system replaces the earlier white annotation-ribbon world following the user's explicit selection on 2026-11-02. The current source and its cascade are normative. This document records the implementation, not an exact image-match or shipping verdict; comparison receipts remain in the build evidence.

**Key Characteristics:**

- Saturated blue presentation with white type and pill actions.
- Real screenshot fronts, pale sheet planes and a physically bent white reverse.
- Handwritten English and Chinese pointers confined to annotation roles.
- Three open feature columns immediately below a shallow white wave.
- One finite opening, direct corner peeling and sheet controls with keyboard, touch and authentic-image fallback access.
- An authentic offline five-step, four-hotspot HTML walkthrough, embedded without restyling its native player.

## Colors

Blue provides the main promotional field; white and pale sheets give it contrast and material depth, while slate neutrals keep detailed reading calm.

### Primary

- **Paper Blue** (`hero-bright`, `hero-blue`, `hero-deep`): the three stops of the hero's 118-degree gradient, progressing from bright left to deeper right.
- **Capture Blue** (`blue`): filled actions and selected workflow keys on white reading surfaces.
- **Identity Blue** (`brand`): approved identity color, selection geometry and the shared focus outline.
- **Reading Blue** (`action`): links and interactive text on white or pale backgrounds.

### Neutral

- **White Paper** (`paper`): hero lettering, pills, the main page and the visual paper reverse.
- **Sheet White** (`sheet`): the pale paper material beneath authentic screenshot fronts. The individual rear planes use subtle local variations.
- **Feature Mist** (`feature-tile`): the small rounded icon fields in the three-column overview.
- **Page Ink** (`ink`): reading headings, primary text and active states outside the blue field.
- **Slate Text** (`muted`): feature explanations, documentation support text and evidence captions.
- **Cool Rule** (`line`): open-column dividers, list boundaries and reading separators.
- **Code Mist** (`surface`): inline command backing.
- **Soft Paper** (`soft`): quiet field, note and hover backgrounds.
- **Demo Night** (`demo-stage`): the lower homepage recording section; it uses its own light text colors.

### Named Rules

**The Field Changes the Action Rule.** Use white pills and white navigation inside the blue promotional field; use blue actions and reading links on white surfaces.

## Typography

**Display and Body Font:** DM Sans with XShot Sans and sans-serif fallbacks. XShot Sans is the locally named Noto Sans SC Chinese subset.

**English Annotation Font:** Caveat.

**Chinese Annotation Font:** Zhi Mang Xing, with XShot Sans and sans-serif fallbacks. It is a self-hosted text subset reserved for the layer captions and the short paper note.

**Code Font:** `ui-monospace, SFMono-Regular, monospace` for commands and project filenames.

**Character:** Compact, heavy white display type sits beside the screenshot material. The expressive handwriting belongs to short actual pointers; descriptions and instructions stay in the sans family. The Latin, Chinese sans and handwriting fonts are self-hosted with OFL licenses.

### Hierarchy

- **Display:** use the frontmatter display role for the two-line homepage statement. Chinese uses its display-zh role. At the medium breakpoint the statement is 48px; mobile uses `clamp(39px, 10.5vw, 58px)` with line-height 1.13 for both languages. The Chinese selector's specificity preserves its own desktop fitting.
- **Headline:** the larger section-heading role applies to detailed features. Reading article titles use 38px, weight 650 and line-height 1.35, reduced to 30px on mobile.
- **Overview title:** the three-column introductions use the frontmatter overview-title role; medium screens use 22px and mobile uses 24px.
- **Lead:** hero explanation uses the lead role and a maximum measure of 34ch. Mobile uses 16px, line-height 1.6 and 31ch.
- **Body:** documentation uses the body role; mobile uses 15px, with 14px notes and 16px descriptions. Promotional explanations use local 13–16px sizes and short column measures.
- **Labels:** the normal action role belongs to blue content buttons; the hero-label role belongs to the white main action. The header pill uses 12px and weight 650.
- **Annotations:** the frontmatter annotation roles describe the external layer pointers. English pointers reduce on smaller screens; Chinese pointers use 18px desktop and 13px mobile. The short paper note uses 22px desktop; mobile uses 13px English and 14px Chinese. The rear sheet buttons use a top-aligned column layout. The marked sheet image occupies 78% of its inner height on desktop and 66% at widths of 760px and below, leaving a clean pale margin for the complete note, arrow and circle.
- **Captions:** evidence and local-project notes use the caption role or a local 12px equivalent; their line-height follows the content.

### Named Rules

**The Handwriting Has a Pointer Rule.** Use Caveat or Zhi Mang Xing for short annotation captions and the paper note; keep paragraphs, controls and documentation in the sans family.

## Layout

Following the user’s 2026-11-02 refinement, the homepage fills the viewport width. The blue hero and white sections reach both edges without an outer presentation frame or page corner radius. The inner content width remains `calc(100% - 144px)`, capped at 1392px; medium widths use `calc(100% - 88px)` and mobile uses `calc(100% - 42px)` so text and controls retain comfortable gutters.

The desktop hero is 676px high. Copy occupies 40% with a 505px maximum; the overlapping paper stage begins at 34% and aligns to the right edge of its content area, keeping the exposed paper note visible. The stack retains the native editor aspect ratio of 2160:1612. At 1600px and wider the hero becomes 730px with a taller stage. From 761px to 1150px, the hero and its inner container grow with their content, with a 590px minimum height and 80px bottom padding. Playback controls follow the copy in normal flow with a 12px top margin, keeping them clear of the primary action when the headline wraps. At 760px and below the copy and sheets stack in normal vertical flow, with an automatic hero height and the controls below the sheets.

The white overview is three continuous columns with vertical rules, not three enclosed cards. Each introduction pairs an icon field with short copy, followed by a real screenshot preview and a guide link. On mobile these become one column with horizontal separators. Detailed capture, recording, local-project and help sections follow this overview. The product-demo preview jumps to the real exported HTML walkthrough in the recording section; capture and styling previews retain their guide links.

Help retains its separate 1376px maximum shell, with a 220px sidebar, an article up to 760px and a 180px page outline separated by 52px gaps. At 1150px the outline disappears and the sidebar becomes 190px. At 760px the shell becomes one column and the directory can collapse. The help header is sticky; the promotional header sits inside the blue hero.

## Elevation & Depth

Depth is material in the paper stack and restrained elsewhere. The front screenshot casts a soft drop shadow, pale rear sheets separate through scale, offsets and diffuse shadows, and WebGL shades the actual two-sided bend. The overview previews have a lighter lift. Reading surfaces rely mainly on white space, rules and pale fills.

### Shadow Vocabulary

- **Front sheet** (`filter: drop-shadow(0 20px 16px #062c9366)`): separates the curled front from the blue field and rear sheets.
- **Rear sheet** (`0 18px 27px #0e308c40`): material separation within the screenshot stack.
- **Preview lift** (`0 10px 23px #203c6a12`): light grounding beneath overview screenshots.
- **Promotional action hover** (`0 10px 26px #113b9724`): brief button response on the homepage.
- **Reading action hover** (`0 8px 24px #1854a925`): the blue button response on reading surfaces.

**The Reverse Is Material Rule.** A paper curl reveals a lit white underside and the layers behind it; preserve that material relationship rather than substituting a flat triangular overlay.

## Shapes

The page itself is flush with the viewport edges. Pills mark the primary actions on blue, and screenshot sheets use smaller radii. Overview symbol fields have their own compact rounded-square shape. Reading controls retain the tighter input, key and content-button radii. The wave is shallow and asymmetric; it connects the hero to the white overview without becoming a recurring divider on every section.

## Components

### Buttons

White and buoyant on blue; compact blue actions on reading surfaces.

- **Hero:** the frontmatter hero component has a desktop minimum size of 194×58px and a 24px arrow gap. Mobile uses a 170×50px minimum, 15px type and 13px by 23px padding.
- **Header:** the white header pill has a 42px minimum height and a 13px icon gap. Its label and fill have distinct hover colors from the main action.
- **Reading:** the primary blue component has a 54px minimum height. Its compact reading-header variant retains 10px by 18px padding and a 40px minimum height.
- **Hover:** actions lift 2px and move their arrow 3px over 250ms using the shared easing. Text links move their arrow 4px without a filled background.
- **Focus:** retain the shared 3px Identity Blue outline with a 5px offset. Focus is a semantic keyboard state, not a hover substitute.

### Chips

Keyboard shortcuts use a pale cool border, white fill, tabular numerals and the key radius; the active gallery shortcut reverses to Capture Blue with white text. Export formats remain small outlined context labels in the dark recording section. Neither treatment is a general pill navigation system.

### Cards / Containers

Overview columns stay open and ruled. Their screenshot previews use the sheet radius and the preview shadow. The feature symbols have small blue SVG drawings inside pale rounded-square fields. Local project and closing containers use pale blue fills and the sheet radius. Help topics remain open rows rather than a repeated card wall.

### Inputs / Fields

The documentation search is a pale field with a cool one-pixel border, input radius and inset SVG search icon. It retains the shared focus outline. Search results are ordinary article links; loading failure, empty results and result counts have explicit status messages.

### Navigation

The promotional header uses the approved white SVG wordmark, white text links, white language-current underline and a white pill action. The help header uses the color wordmark and dark reading links. At mobile widths the main links move into an explicit menu while the language switch remains visible. Escape closes the menu and returns focus. Language links keep the article and section hash. A no-JavaScript navigation is also generated.

### Opening Screenshot Stack

The front sheet uses a real XShot editor texture; two pale rear sheets show capture and annotation context. The marked sheet leaves a clean lower margin for the short handwriting, with website overlays kept separate from native controls. The scene's numbered pointer buttons communicate capture, marking and sharing and select the matching sheet without replacing the actual interface evidence.

The curl is a two-sided, depth-tested cylindrical WebGL surface with 38,025 vertices. Its front samples the authentic screenshot; the reverse is shaded white paper. The browser's native animation time drives a finite 4.8-second opening. Rear sheets settle over 1.2 and 1.5 seconds, and the note fades in over 1.4 seconds after a one-second delay. Rendering stops when the scene settles or becomes hidden/offscreen; resize can redraw the settled state.

The front sheet’s lower-right corner is a native button and a pointer-captured drag handle. Pulling it toward the upper left opens the same real mesh from its resting curl at progress 1 to 2.2; release snaps to rest or fully open with a finite 420ms settle. Mouse hover gives a small corner lift only after the opening has settled. The two rear sheets can be dragged within ±45px horizontally and ±35px vertically; releasing clears their drag offsets. Their numbered caption buttons reveal capture or marked context, and the finish caption restores the front sheet. These interactions are website demonstrations, not controls for the native application.

Click, Enter or Space toggles the corner. Arrow Left/Up opens it in steps; Arrow Right/Down closes it. End opens fully, while Home or Escape restores the finished sheet. Escape also cancels a captured gesture and returns focus to the corner. The corner supports touch and pen through pointer events; its touch gesture is confined to the corner handle so the rest of the page remains available for scrolling.

Replay resets sheet offsets and selection, then restarts the original 4.8-second moment. Pause is remembered for the session and freezes automatic opening and any running settle. Reduced motion retains direct dragging and instant click or keyboard state changes, with no hover lift or settling tween; the automatic playback controls stay disabled. Rendering is bounded to a direct drag, the finite opening or 420ms settle and stops at idle, hidden or offscreen. If WebGL or the texture fails, the authentic front image shifts to reveal the backing sheets, and the same buttons and keyboard controls remain available.

**The One Opening Rule.** Play one finite sheet-opening moment and settle; subsequent animation follows replay or a direct local interaction.

### Native HTML Walkthrough

The recording section presents an actual XShot HTML export instead of a static editor screenshot. A titled, lazy-loaded, script-only sandboxed iframe loads `demos/release-workflow.html`; a dark site toolbar offers a separate full view, and the site caption offers the single-file download. The frame uses a 16:10 aspect ratio with 620px minimum and 860px maximum desktop height, a 560px minimum at 761–1150px, and a 460px height on mobile.

The native player remains byte-for-byte the original export. Its own typography, layout, hotspot cues and step controls are product evidence, separate from this website’s design tokens and motion. The surrounding toolbar, caption and links use the website system and the current page language; the Chinese page identifies the player as an English sample. Do not recolor, rebuild or translate the player to make it match the promotional surface.

The example contains five embedded PNG screenshot states and four hotspots, with previous/next, replay, finish and retry controls. All player scripts, styles and images are inside the HTML file, with no separate assets or network dependencies. It guides recorded screenshot states and does not control a live app. Launchboard is demonstration content, and step descriptions were edited manually. `demos/manifest.json` and `ASSETS.json` identify the source and pin the unchanged payload by byte count and SHA-256.

### Evidence and Reading Feedback

The capture and styling overview previews link to their task guides; the product-demo preview jumps to the embedded walkthrough at `#step-demo`. Hover adds a slight image zoom or selection/focus detail; reduced motion removes the zoom transition. The lower screenshot gallery retains tab semantics, roving keyboard focus, arrow keys and Home/End. It waits for the new image to decode before replacing visible evidence, then uses a 450ms settle response.

The local-project disclosure reveals content over 280ms and exposes `aria-expanded`. Command copying gives brief success or manual-copy fallback feedback, then restores the normal label. Other motion stays local: a small arrow movement, a focus bracket or the closing corner's angle relaxing on hover.

## Do's and Don'ts

### Do:

- **Do** preserve the approved symbol and exact wordmark, choosing the white variant inside the blue hero.
- **Do** keep real screenshot pixels, native control proportions and their provenance intact.
- **Do** keep website annotation overlays distinct from native application controls.
- **Do** use white pills on the blue promotional field and blue actions on white reading surfaces.
- **Do** preserve the white reverse, soft shading and visible rear planes when extending the paper material.
- **Do** retain keyboard states, a complete reduced-motion scene and the authentic-image fallback.

### Don't:

- **Don't** redraw, stretch or close the brand mark's open corner.
- **Don't** substitute generated interface content for actual product evidence.
- **Don't** extend handwriting into paragraphs, ordinary controls or documentation.
- **Don't** turn the paper-opening sequence into an endless decorative loop.
- **Don't** turn every lower section or help topic into a tilted sheet or enclosed card.

Not canonized: a few tiny utility labels and the circled decorative percentage remain implementation details, not a reusable type scale or product metric. Image-match receipts and exact fidelity gates remain separate from this extracted system; this document records no passed exact-match verdict.

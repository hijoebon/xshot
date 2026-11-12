# XShot 官网产品记录

<!-- impeccable:product-schema 1 -->

## Platform
web

本记录描述 XShot 的官方网站；所介绍的产品是原生 macOS 应用。

## Stack
用户确认采用静态 HTML/CSS/JavaScript，源码位于 website/；先完成可预览版本。正式部署目标尚未指定。

## Users
面向需要用截图沟通问题、标注界面、制作产品操作演示的 Mac 用户与开发者。用户明确要求多语言，默认英文；当前交付英语与简体中文，内容结构允许扩展。

## Product Purpose
用户明确要求开发 landing page、帮助文档、GitHub 仓库入口；要求充分理解 XShot，内容准确、有吸引力、有设计感。官网让访客理解功能、确认适用条件、获得可执行的使用指引。

## Positioning
当前源码包含区域/窗口/单屏截图、五种标注、截图美化、桌面贴图，以及自动聚焦录屏和截图式交互演示。使用本地文件工作流，不需要云账号。

## Operating Context
Apple Silicon、macOS 14 或更新版本。源码构建需要 Xcode Command Line Tools。全局快捷键为 Option-X 截图、Option-R 进入演示或完成录制、Option-P 暂停或继续。

## Capabilities and Constraints
- 0.2.0，Swift/AppKit 与 Apple 系统框架，MIT 许可。
- 窗口截图保留 Retina 像素；区域和整屏限单显示器。
- 标注：矩形、箭头、画笔、文字、马赛克画笔；支持选择、移动、缩放、删除及撤销重做，双击文字可重新编辑。
- 美化：原图、轻影、留白、展示预设；默认轻影。复制、PNG、贴图共享输出效果。
- 录制：屏幕、窗口、单屏区域；无/3/5 秒倒计时；暂停、重录、保留范围。
- 根据点击安排平滑缩放，可编辑焦点、倍率和时间；MP4 为 H.264、固定 60 fps。录制原片宽度最高 1920 px，目标最高 60 fps，不能将原片描述为恒定 60 fps 或 4K。
- 交互步骤使用截图和热点，可编辑标题、说明、跳转并导出内嵌资源的单个离线 HTML；不会控制真实产品或克隆 DOM。
- 当前不含音频、摄像头、云分享、AI 文案、OCR、长截图、录制敏感信息自动打码。
- 项目默认保存到 ~/Movies/XShot/，扩展名 .xshotdemo；本地保存与自动保存不等于备份。
- GitHub Releases 提供适用于 Apple Silicon 的 DMG；安装包使用临时签名，未经过 Apple 公证。官网源码可独立构建，源码本身不指定正式网站地址。

## Brand Commitments
官网以蓝色层叠截图和翻页效果为视觉基准，实施细节见 `DESIGN.md`。默认英文，提供简体中文；动效围绕 XShot 的框选、标注和聚焦机制展开。
沿用现有 A「开角」蓝色标志和 XShot 字标。来源 Design/Logo/Final/GUIDE.md：XShot Blue #3478F6、Ink #161B25、White #FFFFFF。不得重画、拉伸或填满断角。

## Evidence on Hand
README.md、Sources/XShot/、Resources/Info.plist、LICENSE、Docs/、VERIFICATION.md。可用真实 QA 截图位于忽略提交的 artifacts/，逐图审查后方可用于官网；合成演示必须标明。无用户数、客户背书、性能对比或发行证明，不得编造。

## Product Principles
1. 每个卖点可由当前实现支持。
2. 功能演示先于抽象形容词。
3. 使用门槛、权限和导出边界清楚可查。
4. 官网与帮助共同维护，使用同一事实基线。

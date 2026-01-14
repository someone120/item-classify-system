# Android Build & Install Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 编译生成 Android APK 并安装到已连接的设备/模拟器。

**Architecture:** 使用 Tauri 的 Android 构建管线（`cargo tauri android build`）生成 APK；通过 `adb install -r` 安装到设备。构建依赖 Android SDK/NDK、JDK、Rust Android targets。

**Tech Stack:** Rust, Tauri, Android SDK/NDK, Gradle, adb

### Task 1: 预检构建环境

**Files:**
- Inspect: `src-tauri/tauri.conf.json`

**Step 1: 检查 Tauri CLI 可用**

Run: `cargo tauri --version`
Expected: 输出版本号

**Step 2: 检查 Rust Android targets**

Run: `rustup target list --installed | rg android`
Expected: 至少包含一个 Android target（如 `aarch64-linux-android`）

**Step 3: 检查 adb 连接**

Run: `adb devices`
Expected: 设备列表中至少 1 台 `device`

**Step 4: 获取应用包名**

Read: `src-tauri/tauri.conf.json` 的 `tauri.bundle.identifier`

### Task 2: 构建 Android APK

**Files:**
- Build output: `src-tauri/gen/android/**`

**Step 1: 执行构建**

Run: `cargo tauri android build`
Expected: 构建完成且无错误

**Step 2: 定位 APK**

Run: `rg --files -g "*.apk" src-tauri/gen/android`
Expected: 输出 APK 路径（用于安装）

### Task 3: 安装到设备

**Files:**
- Use: `src-tauri/gen/android/**.apk`

**Step 1: 安装 APK**

Run: `adb install -r <apk-path>`
Expected: `Success`

**Step 2: 验证已安装**

Run: `adb shell pm list packages | rg <bundle-identifier>`
Expected: 能查到包名


# Android Build + Deploy + Log Capture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Android app, install it on a connected device, and capture logs during launch/use.

**Architecture:** Use Tauri CLI to build the Android APK, install via `adb`, then capture runtime logs with `adb logcat`. No code changes expected.

**Tech Stack:** Tauri 2, Rust, React/Vite, Android SDK/ADB, Node.js.

### Task 1: Verify Android toolchain and device connection

**Files:**
- Modify: none
- Test: none

**Step 1: Verify ADB is available**

Run: `adb version`
Expected: ADB version information prints without error.

**Step 2: Verify a device is connected**

Run: `adb devices`
Expected: At least one device listed as `device`.

**Step 3: Verify Java/Android SDK availability**

Run: `java -version`
Expected: Java 17+ prints without error.

Run: `sdkmanager --version`
Expected: Android SDK manager version prints without error.

**Step 4: Verify Node dependencies (if needed)**

Run: `npm install`
Expected: Dependencies install successfully.

**Step 5: Commit**

No commit (no code changes).

### Task 2: Build Android APK

**Files:**
- Modify: none
- Test: none

**Step 1: Run Android build**

Run: `npm run tauri:android:build`
Expected: Build completes successfully.

**Step 2: Locate generated APK**

Run: `Get-ChildItem -Recurse -Filter *.apk src-tauri\gen\android`
Expected: At least one APK path printed (e.g. `app-debug.apk` or `app-release.apk`).

**Step 3: Commit**

No commit (no code changes).

### Task 3: Install APK and capture logcat

**Files:**
- Modify: none
- Test: none

**Step 1: Install/replace APK on device**

Run: `adb install -r <path-to-apk>`
Expected: `Success`.

**Step 2: (Optional) Launch the app**

Run: `adb shell monkey -p com.itemclassify.app -c android.intent.category.LAUNCHER 1`
Expected: App launches on device.

**Step 3: Capture logs**

Run: `adb logcat -c`
Expected: Log buffer cleared.

Run: `adb logcat -v time | Tee-Object -FilePath logs\android-logcat.txt`
Expected: Live logs stream to console and `logs\android-logcat.txt`.

**Step 4: Stop log capture**

Stop the command with `Ctrl+C` after reproducing the issue or capturing needed output.

**Step 5: Commit**

No commit (no code changes).

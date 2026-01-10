# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.itemclassify.app.* {
  native <methods>;
}

-keep class com.itemclassify.app.WryActivity {
  public <init>(...);

  void setWebView(com.itemclassify.app.RustWebView);
  java.lang.Class getAppClass(...);
  java.lang.String getVersion();
}

-keep class com.itemclassify.app.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.itemclassify.app.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class com.itemclassify.app.RustWebChromeClient,com.itemclassify.app.RustWebViewClient {
  public <init>(...);
}

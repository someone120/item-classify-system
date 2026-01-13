package com.itemclassify.app

import android.Manifest
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.PermissionChecker
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {

  private val cameraPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { /* Permission result handled by system */ }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    checkAndRequestCameraPermission()
  }

  override fun onWebViewCreate(webView: android.webkit.WebView) {
    super.onWebViewCreate(webView)

    // 处理 WindowInsets,确保 WebView 内容不会与状态栏重叠
    ViewCompat.setOnApplyWindowInsetsListener(webView) { v, windowInsets ->
      val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())

      // 将系统栏的 insets 应用为 padding,确保内容不会与状态栏和导航栏重叠
      v.setPadding(
        insets.left,
        insets.top,
        insets.right,
        insets.bottom
      )

      // 返回 CONSUMED 表示我们已经处理了 insets
      WindowInsetsCompat.CONSUMED
    }
  }

  private fun checkAndRequestCameraPermission() {
    val hasPermission = PermissionChecker.checkSelfPermission(
      this,
      Manifest.permission.CAMERA
    ) == PermissionChecker.PERMISSION_GRANTED

    if (!hasPermission) {
      cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
  }
}

package com.itemclassify.app

import android.Manifest
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.PermissionChecker
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {

  private val cameraPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { /* Permission result handled by system */ }

  override fun onCreate(savedInstanceState: Bundle?) {
    // 移除 enableEdgeToEdge() 以避免内容与状态栏重叠
    super.onCreate(savedInstanceState)
    WindowCompat.setDecorFitsSystemWindows(window, true)
    checkAndRequestCameraPermission()
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

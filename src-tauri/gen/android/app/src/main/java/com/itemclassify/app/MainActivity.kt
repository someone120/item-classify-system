package com.itemclassify.app

import android.Manifest
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.PermissionChecker

class MainActivity : TauriActivity() {
  private val cameraPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { isGranted: Boolean ->
    if (isGranted) {
      // Permission granted
    } else {
      // Permission denied, camera functionality will not work
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    // Check and request camera permission on startup
    checkAndRequestCameraPermission()
  }

  private fun checkAndRequestCameraPermission() {
    if (PermissionChecker.checkSelfPermission(this, Manifest.permission.CAMERA)
      == PermissionChecker.PERMISSION_GRANTED
    ) {
      // Permission already granted
    } else {
      // Request camera permission
      cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
  }
}

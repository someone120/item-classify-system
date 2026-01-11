package com.itemclassify.app

import android.Manifest
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.PermissionChecker

class MainActivity : TauriActivity() {

  private val cameraPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { /* Permission result handled by system */ }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
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

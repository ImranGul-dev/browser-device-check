---
title: "Fix Camera and Microphone Permissions"
seoTitle: "Fix Camera and Microphone Permissions"
appendSiteName: true
description: "Reset blocked camera or microphone access in Chrome, Edge, Firefox, or Safari and review Windows, macOS, Android, or iPhone privacy settings."
published: 2026-07-27
updated: 2026-07-27
category: "Permissions"
order: 1
relatedTools:
  - title: "Test your webcam"
    href: "/webcam-test/"
  - title: "Test your microphone"
    href: "/microphone-test/"
  - title: "Run Complete Device Check"
    href: "/device-check/"
  - title: "Troubleshoot a webcam"
    href: "/guides/webcam-not-working/"
---

## Quick diagnosis

Run the [Webcam Test](/webcam-test/) or [Microphone Test](/microphone-test/) first. The result helps distinguish a blocked browser decision from a missing device, a device already in use, an operating-system restriction, or an application-specific problem.

A browser permission prompt should appear only after you deliberately select **Allow Camera** or **Allow Microphone**. If no prompt appears, the site may already have a saved decision or the browser may not expose a reliable pre-request status.

## Reset a saved browser decision

1. Open the site-information or permissions control beside the address bar.
2. Find **Camera** or **Microphone**.
3. Change the setting to **Allow**, or reset the saved decision so the browser can ask again.
4. Reload the page.
5. Start the test and respond to the actual browser prompt.

Browser interfaces differ. Look for a lock, sliders, site-settings, or permissions icon near the address bar. Use the browser’s official help when the control is not available.

## Check operating-system privacy settings

Browser permission and operating-system permission are separate layers. A browser can show **Allow** while the operating system still prevents access.

### Windows

Open the privacy settings for Camera or Microphone. Confirm that device access is enabled and that desktop applications or the intended browser are allowed. Organization-managed devices may show settings that cannot be changed by the user.

### macOS

Open **System Settings**, then the Privacy & Security section for Camera or Microphone. Enable the intended browser. Quit and reopen the browser when macOS asks for that step.

### Mobile devices

Open the device settings for the browser application and review Camera and Microphone permissions. Mobile browsers may also provide per-site controls inside the browser.

## Confirm the correct device

After permission is granted, device labels may become available. Choose the intended camera or microphone in the test. Then choose the same device inside the meeting, interview, exam, or telehealth application.

A generic label such as “Default camera” does not necessarily indicate a problem. Browsers often hide precise labels until access is allowed.

## Close competing applications

A camera or microphone can be unavailable when another application has exclusive control or has not released the device cleanly. Close meeting, recording, streaming, camera, voice-chat, and browser-tab sessions, then retry.

Disconnect and reconnect an external device only after stopping active tests. For Bluetooth audio, verify that the device is connected in a call-capable mode and has enough battery.

## Secure-context requirement

Camera and microphone APIs normally require HTTPS. Local development on `localhost` or `127.0.0.1` is treated as secure by current browsers. A copied static build opened from an ordinary insecure web origin may not receive media access.

## Organization and browser policy

Schools, employers, examination providers, and managed devices can apply policies that override personal site settings. Contact the administrator when a setting is locked, the browser reports management, or the same restriction appears across multiple sites.

## Test again in order

1. Reload the page after changing a permission.
2. Run the individual browser test.
3. Confirm the selected device and local result.
4. Open the third-party application.
5. Select the same device and use its official preview or test feature.

A passed browser test does not guarantee that another application uses the same permission, device, account, or policy.

## Privacy notes

The device tests use camera video and microphone audio locally. They do not upload or save that media. The microphone test may briefly hold a bounded sample in volatile memory only when local playback is available. Browser vendors and operating systems control the permission interface. Hosting and any separately enabled advertising, consent, analytics, or contact service can process other information as described in the site policies.

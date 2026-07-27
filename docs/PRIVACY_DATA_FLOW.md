# Privacy Data Flow

## Core device tools

Primary device-test media and interactions remain in the current browser session. There is no custom backend, account, database, cloud history, or media upload.

| Tool | Browser input | Local processing | Transmission or persistence |
|---|---|---|---|
| Webcam | Camera video track | Local preview and browser-delivered settings | No recording or upload |
| Microphone | Microphone audio track | Web Audio analysis and optional temporary local sample | No upload or persistent storage |
| Speaker | User-triggered playback | Generated Web Audio and browser speech | No microphone access or remote audio |
| Keyboard | Key events in bounded area | Temporary key state and history | No storage or transmission |
| Mouse | Pointer, button, wheel, and drag events | Temporary counts and positions | No storage or transmission |
| Touchscreen | Touch Pointer Events | Temporary coverage and touch count | No storage or transmission |
| Dead Pixel | No capture | CSS colors and patterns | No screenshot or upload |
| Display tools | Screen, viewport, frame timing, browser and controller values | Temporary local reports | No storage or transmission |
| Device Check | Explicit device permissions and confirmations | Temporary step results | Screen track stopped immediately |

## Contact form boundary

The Contact page sends only visitor-entered form fields to FormSubmit, which forwards them to `gulimran980@gmail.com`. FormSubmit and its spam-protection services are third parties. FormSubmit states that submissions may be retained for 30 days. Contact form data is separate from device-test media and results.

## Launch integrations

Advertising, analytics, and the site-wide consent platform are disabled. They must not receive camera or microphone media, key contents, pointer or touch coordinates, screen-sharing content, contact text, or detailed diagnostic results if enabled later.

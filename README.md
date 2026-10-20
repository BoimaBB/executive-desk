# Executive Desk (Android + Windows 11)

Lorna's Executive Desk for the Office of the MD (CEMMATS), as an Android app and a Windows 11 desktop app that share the same records.

- **8 TOR tools**: commitments, files, research, social media, personal finance, diary (with clash check), travel, meetings + action log.
- **Timeline**: Gantt-style view of every dated task (start → due), progress, overdue / due-soon colours, tap to edit.
- **Reminders**: Android schedules them on the phone (work with the app closed). Windows shows them while the app runs in the system tray (it starts with Windows by default).
- **Sync**: Firebase Auth (email/password) + Cloud Firestore at `users/{uid}/{collection}/{recordId}`, with a persistent offline cache on each device. Last write wins per record.
- **Backup**: one-tap JSON backup file + restore, independent of the online account.

## Downloads
Every push to `main` builds both apps in GitHub Actions and publishes them under **Releases**:
`ExecutiveDesk-<version>-android.apk` and `ExecutiveDesk-<version>-windows-setup.exe`.

## Project layout
- `www/`: the app itself (index.html, app.css, app.js, firebase-config.js). Shared by both platforms.
- `src/bridge.js`, `src/sync.js`: platform bridge (Capacitor / Tauri) and Firebase sync, bundled to `www/native.js`.
- `android/`: Capacitor Android project.
- `src-tauri/`: Tauri 2 Windows project (tray, autostart, notifications, save dialog).

## Developing
```
npm ci
npm run build        # bundle bridge + sync Android project
npx tauri dev        # Windows desktop (on a Windows PC with Rust installed)
```

## Firebase setup
`www/firebase-config.js` holds the web-app config. Firestore rules restrict each user to `users/{their uid}`; sign-up is disabled in Firebase Authentication so only the desk account exists.

## Signing
Android release key: repository secrets `EDESK_KEYSTORE_B64` and `EDESK_KEYSTORE_PASSWORD`. Keep the same key forever, or updates will not install over the existing app. The Windows installer is not code-signed, so SmartScreen shows a warning on first install.

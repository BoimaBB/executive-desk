# Executive Desk (Android)

Offline Android app version of Lorna's Executive Desk for the Office of the MD (CEMMATS).

- **8 TOR tools**: commitments, files, research, social media, personal finance, diary (with clash check), travel, meetings + action log.
- **Timeline**: Gantt-style view of every dated task (start → due), progress fill, overdue / due-soon colours, tap to edit.
- **Reminders**: phone notifications N days before due dates and trips, and before meetings/diary entries; work offline.
- **Storage**: on the phone only (Android SharedPreferences, covered by Android's own app backup). One-tap backup file + restore.

## Getting the APK
Every push to `main` builds a signed APK in GitHub Actions. Download it from **Releases** (or the workflow run's artifacts).

## Developing
```
npm ci
npm run build      # bundles native bridge + copies www/ into android/
```
`www/` holds the app (index.html, app.css, app.js). Open `www/index.html` in a browser to preview (browser storage, no reminders).

Signing key: stored as repository secrets `EDESK_KEYSTORE_B64` and `EDESK_KEYSTORE_PASSWORD`. Keep the same key forever, or updates will not install over the existing app.

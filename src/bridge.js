// Platform bridge, bundled into www/native.js.
// Exposes window.Native (device features: Android via Capacitor, Windows via Tauri)
// and window.Sync (Firebase cloud sync with an offline copy on the device).
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { App } from "@capacitor/app";
import { invoke } from "@tauri-apps/api/core";
import * as TauriNotify from "@tauri-apps/plugin-notification";
import * as TauriDialog from "@tauri-apps/plugin-dialog";
import * as TauriAutostart from "@tauri-apps/plugin-autostart";
import { createSync } from "./sync.js";

const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
const isAndroid = Capacitor.isNativePlatform();

window.Native = {
  platform: isAndroid ? "android" : isTauri ? "windows" : "web",
  isNative: isAndroid, // Android-only features (kept for compatibility with app.js)
  isDesktop: isTauri,
  Preferences, LocalNotifications, Filesystem, Directory, Encoding, Share, App,
  Desktop: isTauri ? {
    notify: TauriNotify, dialog: TauriDialog, autostart: TauriAutostart,
    saveText: (path, contents) => invoke("save_text", { path, contents }),
  } : null,
};

window.Sync = createSync(window.FIREBASE_CONFIG);

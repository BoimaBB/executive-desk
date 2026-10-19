// Thin bridge to the Capacitor plugins, bundled into www/native.js as window.Native.
// In a normal browser (testing), isNative is false and the app falls back to web APIs.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { App } from "@capacitor/app";

window.Native = {
  isNative: Capacitor.isNativePlatform(),
  Preferences, LocalNotifications, Filesystem, Directory, Encoding, Share, App,
};

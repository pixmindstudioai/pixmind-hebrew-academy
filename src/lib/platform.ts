/**
 * True only when running inside the native iOS app. The app injects
 * `window.__PIXMIND_NATIVE__ = 'ios'` at document start (see WebAppView.swift).
 *
 * Used to hide ALL purchasing UI in the app — per App Store guideline 3.1.1, the iOS app is
 * view-only and purchases happen exclusively on the website (SUMIT).
 */
export function isNativeIOSApp(): boolean {
  return typeof window !== 'undefined' && (window as { __PIXMIND_NATIVE__?: string }).__PIXMIND_NATIVE__ === 'ios';
}

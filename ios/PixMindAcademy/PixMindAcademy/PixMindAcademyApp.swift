import SwiftUI
import AVFoundation

@main
struct PixMindAcademyApp: App {
    init() {
        // Keep lesson audio playing when the app is backgrounded or the screen is locked,
        // and play even when the device is on silent — standard for a media/learning app.
        // Works together with the "audio" entry in UIBackgroundModes (Info.plist).
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("AVAudioSession setup failed: \(error)")
        }

        // Re-activate the session after an interruption (e.g. a phone call) so audio can resume.
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification, object: nil, queue: .main
        ) { note in
            guard
                let info = note.userInfo,
                let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                AVAudioSession.InterruptionType(rawValue: raw) == .ended
            else { return }
            try? AVAudioSession.sharedInstance().setActive(true)
        }
    }

    var body: some Scene {
        WindowGroup {
            WebShellRootView()
                .environment(\.layoutDirection, .rightToLeft)
                .preferredColorScheme(.dark)
        }
    }
}

struct WebShellRootView: View {
    @State private var isLoading = true

    var body: some View {
        ZStack {
            WebAppView(url: WebShellConfig.startURL, isLoading: $isLoading)
                .ignoresSafeArea(.container, edges: .bottom)

            if isLoading {
                LaunchLoadingView()
                    .transition(.opacity)
            }
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.05))
        .animation(.easeOut(duration: 0.2), value: isLoading)
    }
}

private struct LaunchLoadingView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.02, green: 0.03, blue: 0.04),
                    Color(red: 0.05, green: 0.07, blue: 0.09)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                Image("AppLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 104, height: 104)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                ProgressView()
                    .tint(Color(red: 0.012, green: 0.757, blue: 0.929))
            }
        }
    }
}

import Foundation

enum WebShellConfig {
    #if DEBUG
    static let startURL = URL(string: "http://127.0.0.1:8080")!
    #else
    static let startURL = URL(string: "https://academy.pixmindstudio.com")!
    #endif

    static let allowedHosts: Set<String> = [
        startURL.host ?? "",
        "academy.pixmindstudio.com",
        "pixmindstudio.com",
        "127.0.0.1",
        "localhost",
        "agodijuyujiliengmail.supabase.co"
    ]
}

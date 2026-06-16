import SwiftUI
import UIKit
import WebKit
import StoreKit

struct WebAppView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoading: $isLoading)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.allowsAirPlayForMediaPlayback = true
        // Let the web Fullscreen API (the custom player's "fill screen" button) work inside the
        // WebView, in addition to the video element's native fullscreen (iOS 15.4+).
        if #available(iOS 15.4, *) {
            configuration.preferences.isElementFullscreenEnabled = true
        }

        // Bridge for Apple In-App Purchase: the web posts {action, productId, requestId} to "iap".
        configuration.userContentController.add(context.coordinator, name: "iap")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.03, green: 0.04, blue: 0.05, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        let refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 0.012, green: 0.757, blue: 0.929, alpha: 1)
        refreshControl.addTarget(context.coordinator, action: #selector(Coordinator.refresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
        context.coordinator.webView = webView
        context.coordinator.startTransactionListener()

        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        @Binding private var isLoading: Bool
        weak var webView: WKWebView?
        private var didAttemptDebugAutoLogin = false

        init(isLoading: Binding<Bool>) {
            _isLoading = isLoading
        }

        // MARK: - In-App Purchase bridge (web ⇄ StoreKit)

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "iap",
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String,
                  let requestId = body["requestId"] as? String else { return }

            switch action {
            case "purchase":
                guard let productId = body["productId"] as? String else {
                    sendIapCallback(["requestId": requestId, "ok": false, "error": "missing_product"])
                    return
                }
                let appAccountToken = body["appAccountToken"] as? String
                Task { @MainActor in
                    let r = await StoreManager.shared.purchase(productId: productId, appAccountToken: appAccountToken)
                    var payload: [String: Any] = ["requestId": requestId, "ok": r.ok]
                    if let t = r.transactionId { payload["transactionId"] = t }
                    if let e = r.environment { payload["environment"] = e }
                    if let err = r.error { payload["error"] = err }
                    self.sendIapCallback(payload)
                }
            case "restore":
                Task { @MainActor in
                    let txns = await StoreManager.shared.restore()
                    self.sendIapCallback(["requestId": requestId, "ok": true, "transactions": txns])
                }
            default:
                break
            }
        }

        private func sendIapCallback(_ payload: [String: Any]) {
            guard let webView = webView,
                  let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else { return }
            webView.evaluateJavaScript("window.__iapCallback && window.__iapCallback(\(json));")
        }

        // Deliver transactions that arrive outside a purchase() call — deferred Ask-to-Buy
        // approvals, renewals/refunds, or completions after the web timed out — so they still grant.
        private var transactionListener: Task<Void, Never>?

        func startTransactionListener() {
            guard transactionListener == nil else { return }
            transactionListener = Task { [weak self] in
                for await update in Transaction.updates {
                    if case .verified(let transaction) = update {
                        await transaction.finish()
                        await self?.deliverTransaction(transaction)
                    }
                }
            }
        }

        @MainActor
        private func deliverTransaction(_ transaction: Transaction) {
            var payload: [String: Any] = [
                "transactionId": String(transaction.id),
                "productId": transaction.productID,
            ]
            if let env = StoreManager.environmentString(transaction) { payload["environment"] = env }
            guard let webView = webView,
                  let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else { return }
            webView.evaluateJavaScript("window.__iapDeliver && window.__iapDeliver(\(json));")
        }

        @objc func refresh(_ sender: UIRefreshControl) {
            webView?.reload()
            sender.endRefreshing()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoading = false
            webView.evaluateJavaScript("""
                document.documentElement.setAttribute('dir', 'rtl');
                document.documentElement.setAttribute('lang', 'he');
            """)
            runDebugAutoLoginIfNeeded(in: webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            isLoading = false
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            isLoading = false
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let targetURL = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if targetURL.scheme == "mailto" || targetURL.scheme == "tel" {
                UIApplication.shared.open(targetURL)
                decisionHandler(.cancel)
                return
            }

            let host = targetURL.host ?? ""
            let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? false
            let shouldOpenExternally = isMainFrame && !host.isEmpty && !WebShellConfig.allowedHosts.contains(host)

            if shouldOpenExternally {
                UIApplication.shared.open(targetURL)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
                webView.load(URLRequest(url: url))
            }
            return nil
        }

        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }

        private func runDebugAutoLoginIfNeeded(in webView: WKWebView) {
            #if DEBUG
            guard !didAttemptDebugAutoLogin else { return }
            guard webView.url?.host == WebShellConfig.startURL.host else { return }
            let environment = ProcessInfo.processInfo.environment
            guard
                let email = environment["PIXMIND_LOGIN_EMAIL"],
                let password = environment["PIXMIND_LOGIN_PASSWORD"],
                !email.isEmpty,
                !password.isEmpty
            else {
                return
            }

            didAttemptDebugAutoLogin = true

            performNativeDebugAutoLogin(email: email, password: password, webView: webView)
            #endif
        }

        private func performNativeDebugAutoLogin(email: String, password: String, webView: WKWebView) {
            let supabaseURL = "https://agodijuyujiliengmail.supabase.co"
            let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2RpanV5dWppbGllbmdtYWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjcwMzIsImV4cCI6MjA3MTU0MzAzMn0.zdZgTihlA-k3JLxG4iNTmvSg4eolTT7vJZ4UHSENxYA"

            guard let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=password") else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue(supabaseKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(supabaseKey)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? JSONSerialization.data(withJSONObject: [
                "email": email,
                "password": password,
            ])

            URLSession.shared.dataTask(with: request) { [weak webView] data, response, error in
                guard let webView else { return }

                if let error {
                    DispatchQueue.main.async {
                        Self.showDebugAutoLoginError(error.localizedDescription, in: webView)
                    }
                    return
                }

                guard
                    let httpResponse = response as? HTTPURLResponse,
                    let data,
                    let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                else {
                    DispatchQueue.main.async {
                        Self.showDebugAutoLoginError("Invalid auth response", in: webView)
                    }
                    return
                }

                guard (200..<300).contains(httpResponse.statusCode) else {
                    let message =
                        json["error_description"] as? String ??
                        json["msg"] as? String ??
                        json["message"] as? String ??
                        "Auth failed with status \(httpResponse.statusCode)"
                    DispatchQueue.main.async {
                        Self.showDebugAutoLoginError(message, in: webView)
                    }
                    return
                }

                var session = json
                let expiresIn = session["expires_in"] as? Double ?? 3600
                session["expires_at"] = Int(Date().timeIntervalSince1970 + expiresIn)

                guard
                    let sessionData = try? JSONSerialization.data(withJSONObject: session),
                    let sessionJSONString = String(data: sessionData, encoding: .utf8)
                else {
                    DispatchQueue.main.async {
                        Self.showDebugAutoLoginError("Could not serialize auth session", in: webView)
                    }
                    return
                }

                let sessionLiteral = Self.javaScriptStringLiteral(sessionJSONString)
                DispatchQueue.main.async {
                    webView.evaluateJavaScript("""
                        (() => {
                          localStorage.setItem('sb-agodijuyujiliengmail-auth-token', \(sessionLiteral));
                          window.location.replace('/');
                          return true;
                        })();
                    """)
                }
            }.resume()
        }

        private static func showDebugAutoLoginError(_ error: String, in webView: WKWebView) {
            let message = javaScriptStringLiteral(error)
            webView.evaluateJavaScript("""
                (() => {
                  const marker = document.createElement('div');
                  marker.style.cssText = 'position:fixed;z-index:2147483647;left:12px;right:12px;bottom:28px;padding:12px;border-radius:12px;background:#7f1d1d;color:white;font:14px -apple-system;text-align:left;direction:ltr;white-space:pre-wrap;';
                  marker.textContent = 'Debug auto-login failed: ' + \(message);
                  document.body.appendChild(marker);
                })();
            """)
        }

        private static func javaScriptStringLiteral(_ value: String) -> String {
            var output = "\""

            for scalar in value.unicodeScalars {
                switch scalar {
                case "\"":
                    output += "\\\""
                case "\\":
                    output += "\\\\"
                case "\n":
                    output += "\\n"
                case "\r":
                    output += "\\r"
                case "\t":
                    output += "\\t"
                default:
                    if scalar.value < 0x20 {
                        output += String(format: "\\u%04X", scalar.value)
                    } else {
                        output.unicodeScalars.append(scalar)
                    }
                }
            }

            output += "\""
            return output
        }
    }
}

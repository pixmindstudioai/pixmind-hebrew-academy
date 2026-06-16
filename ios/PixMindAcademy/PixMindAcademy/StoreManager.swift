import Foundation
import StoreKit

/// StoreKit 2 wrapper for per-course non-consumable In-App Purchases.
/// The web layer asks (via the WKScriptMessageHandler bridge) to purchase a product id; we run the
/// Apple purchase sheet, finish the transaction, and hand the verified transaction id back to the
/// web, which verifies + grants access server-side (apple-iap-verify).
@MainActor
final class StoreManager {
    static let shared = StoreManager()

    struct PurchaseResult {
        let ok: Bool
        let transactionId: String?
        let environment: String?
        let error: String?
    }

    /// Buy a single non-consumable product. `appAccountToken` (the Supabase user id) binds the
    /// purchase to the buyer so a shared/family Apple ID can't move the entitlement to another account.
    func purchase(productId: String, appAccountToken: String?) async -> PurchaseResult {
        do {
            let products = try await Product.products(for: [productId])
            guard let product = products.first else {
                return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: "product_not_found")
            }

            var options: Set<Product.PurchaseOption> = []
            if let tokenStr = appAccountToken, let uuid = UUID(uuidString: tokenStr) {
                options.insert(.appAccountToken(uuid))
            }

            let result = try await product.purchase(options: options)
            switch result {
            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    let env = Self.environmentString(transaction)
                    await transaction.finish()
                    return PurchaseResult(ok: true, transactionId: String(transaction.id), environment: env, error: nil)
                case .unverified:
                    return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: "unverified")
                }
            case .userCancelled:
                return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: "cancelled")
            case .pending:
                return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: "pending")
            @unknown default:
                return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: "unknown")
            }
        } catch {
            return PurchaseResult(ok: false, transactionId: nil, environment: nil, error: error.localizedDescription)
        }
    }

    /// Restore previously-purchased entitlements (Apple requires a restore action for non-consumables).
    func restore() async -> [[String: String]] {
        try? await AppStore.sync()
        var out: [[String: String]] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                var entry: [String: String] = [
                    "transactionId": String(transaction.id),
                    "productId": transaction.productID,
                ]
                if let env = Self.environmentString(transaction) { entry["environment"] = env }
                out.append(entry)
            }
        }
        return out
    }

    static func environmentString(_ transaction: Transaction) -> String? {
        if #available(iOS 16.0, *) {
            switch transaction.environment {
            case .production: return "Production"
            case .sandbox: return "Sandbox"
            default: return nil
            }
        }
        return nil
    }
}

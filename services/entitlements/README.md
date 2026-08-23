# KashifWeb entitlements service

This private service verifies Gumroad-issued license keys and keeps entitlement state for paid KashifWeb Pro features. It never receives report source HTML or CSS, payment-card data, IBANs, or plaintext license keys at rest.

Do not deploy this directory until the owner has set the product ID and session signing secret in the provider's private secret store. See the launch checklist maintained outside the public repository for the owner-only steps.

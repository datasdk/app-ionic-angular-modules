# Firebase Key Files

Place local Firebase credentials here before copying them into the native projects.

Expected files:
- `google-services.json` for Android.
- `GoogleService-Info.plist` for iOS when Firebase iOS configuration is required.
- APNs `.p8` key files or service-account JSON files for backend/CI use only.

The checked-in `*.test.*` files are sanitized placeholders that document the expected structure. Do not put real private keys in source code or Angular components.

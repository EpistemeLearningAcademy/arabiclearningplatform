# Certificate images (logo, signature, stamp)

To show Episteme Learning Academy's real logo, signature and stamp on every device:

1. Upload your files to this folder as `logo.png`, `signature.png` and `stamp.png`.
   Use transparent PNGs, about 600 px on the longest side.
2. Open `content/shared/branding.json` and set the `files` line to list what you uploaded, for example:
   `"files": { "logo": "png", "signature": "png", "stamp": "png" }`
3. Change the version name in `sw.js` (for example `kalimati-v2-16`) so phones fetch the update.

You can also choose the three images inside the app (Settings → Admin → Certificate and branding).
Those are saved on that one device only.

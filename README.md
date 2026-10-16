# CUBE X — 3D Cube Studio

A responsive Three.js cube simulator built with HTML, CSS, and JavaScript modules.

## Deploy to GitHub Pages (important)

**Upload the CONTENTS of this folder to the repository root**, not just `index.html`, and do not put them inside an extra `cube-x/` folder unless you configure Pages to publish that folder.

The repository root must look like this:

```
index.html
favicon.ico
favicon.svg
manifest.json
service-worker.js
assets/icons/apple-touch-icon.png
css/styles.css
js/main.js
js/cube-engine.js
js/cube-state.js
tests/cube-tests.js
```

Then open **Repository → Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save. Wait for deployment to finish. Open the URL GitHub provides.

The HTML uses relative asset paths (for example `./css/styles.css`) so it works on both a user site and a project site such as `https://USERNAME.github.io/CUBE-X/`, provided the folder structure above is preserved.

If the page looks like unstyled text, open the CSS URL directly by appending `css/styles.css` to the site path. If it returns 404, the folder was not uploaded at the expected location. After updating files, hard-refresh the browser or clear the site's cached data; the service worker may cache older assets.

## Run locally

Use a local HTTP server because the app uses JavaScript modules:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Dependencies

- Three.js 0.170.0 loaded from jsDelivr CDN. Internet access is required to load the 3D engine unless you vendor the library locally.
- No build step is required.

## Current limitations

- AI Solve reverses the move sequence recorded in the current session. It is not a general-purpose solver for arbitrary cube states.
- Large-cube move support and direct face-turn gestures have limitations; use the explicit move controls for predictable operation.
- Browser/device WebGL behavior depends on the device and browser. Verify on your target phone after deployment.
- The service worker caches core local assets; the Three.js CDN dependency is not guaranteed to work offline.

## Tests

`tests/cube-tests.js` contains the cube-state tests. Run it in a browser environment that supports JavaScript modules as described in the test file.

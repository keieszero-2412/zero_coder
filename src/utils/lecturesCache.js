let cachedManifest = null;
let manifestPromise = null;

export async function getLecturesManifest() {
  if (cachedManifest) return cachedManifest;
  if (!manifestPromise) {
    manifestPromise = fetch('/lectures/lectures.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load lectures manifest');
        return res.json();
      })
      .then(data => {
        cachedManifest = data;
        return data;
      })
      .catch(err => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

export function getCachedLecturesManifest() {
  return cachedManifest;
}

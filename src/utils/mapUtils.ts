export const isAllowed = (registration: string) => registration.startsWith("SD-B");

export function toDegrees(rawYaw = 0) {
  return Math.abs(rawYaw) <= Math.PI * 2 + 0.0001 ? (rawYaw * 180) / Math.PI : rawYaw;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img as HTMLImageElement);
    img.onerror = reject;
    img.src = url;
  });
}

/** Debounce many updates into one rAF tick */
export function makeScheduler() {
  let pending = false;
  return (fn: () => void) => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      fn();
    });
  };
}

export async function cropImageBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  mime = "image/jpeg",
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const longest = Math.max(croppedAreaPixels.width, croppedAreaPixels.height);
  const scale = longest > 2400 ? 2400 / longest : 1;
  canvas.width = Math.max(1, Math.round(croppedAreaPixels.width * scale));
  canvas.height = Math.max(1, Math.round(croppedAreaPixels.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not crop image");
  }
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mime, 0.92);
  });
  if (!blob) {
    throw new Error("Could not crop image");
  }
  return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load image")));
    image.src = src;
  });
}

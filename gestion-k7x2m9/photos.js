// Turns a file chosen by the owner into a photo ready to publish: reduced so
// its longest side is at most 800 px and saved as WebP (or JPEG where the
// browser cannot write WebP). Everything happens in the browser.
import { scaledSize } from "../src/lib/product-form.js";

const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

// Reads the file as a picture, or throws when the browser cannot open it.
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      // Phone photos carry their rotation in the file; apply it.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Some formats only open through an <img>; try that next.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function draw(picture, { width, height }, background) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(picture, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Returns { base64, extension, previewUrl, width, height }. Throws when the
// file is not a picture the browser can open.
export async function preparePhoto(file) {
  if (!file.type.startsWith("image/")) throw new Error("not an image");

  const picture = await decode(file);
  const size = scaledSize(picture.naturalWidth ?? picture.width, picture.naturalHeight ?? picture.height);

  let extension = "webp";
  let blob = await toBlob(draw(picture, size), "image/webp", WEBP_QUALITY);
  // A browser that cannot write WebP answers with another format. JPEG has no
  // transparency, so the photo gets a white background.
  if (!blob || blob.type !== "image/webp") {
    extension = "jpg";
    blob = await toBlob(draw(picture, size, "#ffffff"), "image/jpeg", JPEG_QUALITY);
  }
  if (!blob) throw new Error("could not write the photo");
  picture.close?.();

  return { base64: await toBase64(blob), extension, previewUrl: URL.createObjectURL(blob), ...size };
}

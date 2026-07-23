import type { DocFile } from "./data";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Downscale an image file to keep persisted data URLs small (max ~1100px, JPEG).
async function downscaleImage(file: File, max = 1100, quality = 0.82): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  try {
    const img = document.createElement("img");
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    if (scale >= 1 && dataUrl.length < 400_000) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

/** Convert an uploaded browser File into a DocFile (with a preview/persist data URL when reasonable). */
export async function toDocFile(file: File): Promise<DocFile> {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const kind: DocFile["kind"] = isImage ? "image" : isPdf ? "pdf" : "file";

  if (isImage) {
    return { name: file.name, kind, dataUrl: await downscaleImage(file) };
  }
  // Persist small PDFs/files inline so they survive reloads; otherwise metadata only.
  if (file.size <= 3_500_000) {
    return { name: file.name, kind, dataUrl: await readAsDataUrl(file) };
  }
  return { name: file.name, kind };
}

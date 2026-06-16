// Client-side canvas renderer for issued certificates.
//
// NOTE: If the template image is cross-origin-tainted, canvas.toBlob() will
// throw a SecurityError. The 'thumbnails' bucket is public so anonymous CORS
// requests (crossOrigin='anonymous') should succeed and the canvas stays clean.

import { CertificateConfig, CertTextField, fieldText } from '@/lib/certificate';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function tryLoadFont(family: string): Promise<void> {
  try {
    await (document as any).fonts.load(`700 48px "${family}"`);
  } catch {
    // Best-effort: ignore failures (font may already be loaded or unavailable)
  }
}

function shrinkFontToFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  field: CertTextField,
  W: number,
  H: number,
  initialPx: number
): number {
  const maxWidth = (field.width ?? 1) * W;
  let px = initialPx;
  // Set font at initial size before measuring
  ctx.font = `${field.weight ?? 700} ${px}px "${field.fontFamily}"`;
  while (px > 6 && ctx.measureText(text).width > maxWidth) {
    px -= 1;
    ctx.font = `${field.weight ?? 700} ${px}px "${field.fontFamily}"`;
  }
  return px;
  // ctx.font is already set to the final shrunk size on return
}

export async function renderCertificate(
  templateImageUrl: string,
  config: CertificateConfig,
  names: { full_name?: string | null; full_name_en?: string | null }
): Promise<Blob> {
  // 1. Load the template image
  const img = await loadImage(templateImageUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // 2. Create canvas and draw template
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(img, 0, 0);

  // 3. Best-effort font loading
  const uniqueFamilies = [...new Set(config.fields.map((f) => f.fontFamily))];
  await Promise.all(uniqueFamilies.map(tryLoadFont));
  try {
    await (document as any).fonts.ready;
  } catch {
    // Ignore if fonts.ready is not available
  }

  // 4. Draw text fields
  for (const field of config.fields) {
    const text = fieldText(field, names);
    if (!text) continue;

    const initialPx = field.fontSize * H;

    // IMPORTANT: set direction BEFORE textAlign so the canvas bidi engine
    // maps 'start'/'end' (and left/right anchors) correctly under RTL.
    // We also set direction before the shrink loop so measureText reflects
    // the correct shaping direction.
    (ctx as any).direction = field.lang === 'en' ? 'ltr' : 'rtl';

    // Determine final font size (shrink if width constraint present).
    // shrinkFontToFit leaves ctx.font set to the final shrunk px value.
    if (field.width) {
      shrinkFontToFit(ctx, text, field, W, H, initialPx);
      // ctx.font is already correct — do NOT reset it here
    } else {
      ctx.font = `${field.weight ?? 700} ${initialPx}px "${field.fontFamily}"`;
    }

    ctx.fillStyle = field.color;
    ctx.textAlign = field.align;
    ctx.textBaseline = 'middle';

    ctx.fillText(text, field.x * W, field.y * H);
  }

  // 5. Draw signature images
  for (const sig of config.signatures) {
    if (!sig.imageUrl) continue; // skip anchors without an actual image
    try {
      const sigImg = await loadImage(sig.imageUrl);
      const sigW = sig.width * W;
      const aspectRatio = sigImg.naturalHeight / sigImg.naturalWidth;
      const sigH = sigW * aspectRatio;
      // x is the horizontal center of the signature
      ctx.drawImage(sigImg, sig.x * W - sigW / 2, sig.y * H, sigW, sigH);
    } catch {
      // Best-effort: skip signatures that fail to load
    }
  }

  // 6. Export as PNG Blob
  return new Promise<Blob>((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('canvas.toBlob failed — canvas may be tainted'))),
      'image/png'
    );
  });
}

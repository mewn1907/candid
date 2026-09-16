// ©️ Mewn — extra feature 5: share + copy image (wabi-sabi, extra)

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    // ClipboardItem is still prefixed in some browsers
    const ClipboardItemCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
    if (navigator.clipboard && ClipboardItemCtor && typeof ClipboardItemCtor !== 'undefined') {
      const item = new ClipboardItemCtor({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    // Fallback: copy data URL text (not ideal, but keeps extra feature graceful)
    await navigator.clipboard.writeText(dataUrl);
    return false;
  } catch {
    return false;
  }
}

export async function shareImage(dataUrl: string, filename = 'candid.jpg', title = 'Candid'): Promise<'shared' | 'copied' | 'download'> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: blob.type });
  const canShareFile = !!(navigator as unknown as { canShare?: (d: ShareData) => boolean }).canShare?.({ files: [file] });
  if (canShareFile && navigator.share) {
    try {
      await navigator.share({ title, files: [file] });
      return 'shared';
    } catch {
      // user cancelled or failed — fall through to copy
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, url: dataUrl });
      return 'shared';
    } catch {
      // fall through
    }
  }
  const copied = await copyImageToClipboard(dataUrl);
  return copied ? 'copied' : 'download';
}

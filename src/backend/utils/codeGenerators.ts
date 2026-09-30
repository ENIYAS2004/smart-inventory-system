import QRCode from 'qrcode';

export async function generateQRCode(assetId: string, assetName?: string): Promise<string> {
  try {
    const payload = JSON.stringify({
      assetId,
      name: assetName || '',
      system: 'Smart Inventory & Asset Management',
      type: 'COLLEGE_ASSET',
    });
    // Generate QR code as high-res base64 data URL
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function generateBarcodeString(assetId: string): string {
  // Format standard code 128 / clean identifier representation
  return assetId.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
}

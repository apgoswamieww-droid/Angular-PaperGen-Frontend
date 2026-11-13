export type OcrLanguage = 'eng' | 'guj' | 'eng+guj';

const TARGET_WIDTH = 2200;
const MAX_WIDTH = 4000;
const MAX_SCALE = 4;
const PADDING = 24;

type DecodedImage = ImageBitmap | HTMLImageElement;

export async function recognizeImage(
  file: File,
  onProgress?: (progress: number) => void,
  language: OcrLanguage = 'eng+guj',
): Promise<string> {
  const image = await prepareImage(file);
  const { createWorker, OEM, PSM } = await import('tesseract.js');
  const worker = await createWorker(language, OEM.LSTM_ONLY, {
    logger: (message) => onProgress?.(message.progress),
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });

    const { data } = await worker.recognize(image);
    const text = normalizeText(data.text);

    if (text === '') {
      throw new Error('No readable text was found in the image.');
    }

    return text;
  } finally {
    await worker.terminate();
  }
}

async function prepareImage(file: File): Promise<HTMLCanvasElement> {
  const source = await decodeImage(file);

  try {
    const scale = scaleFor(source.width);
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement('canvas');

    canvas.width = width + PADDING * 2;
    canvas.height = height + PADDING * 2;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context === null) {
      throw new Error('The image could not be processed.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, PADDING, PADDING, width, height);

    const imageData = context.getImageData(PADDING, PADDING, width, height);

    enhanceForOcr(imageData);
    context.putImageData(imageData, PADDING, PADDING);

    return canvas;
  } finally {
    if ('close' in source && typeof source.close === 'function') {
      source.close();
    }
  }
}

function scaleFor(width: number): number {
  if (width <= 0) {
    return 1;
  }

  if (width > MAX_WIDTH) {
    return MAX_WIDTH / width;
  }

  return Math.min(MAX_SCALE, Math.max(1, TARGET_WIDTH / width));
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall back to an <img> element for browsers that cannot decode the file.
    }
  }

  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The image could not be decoded.'));
    };
    image.src = url;
  });
}

function enhanceForOcr(imageData: ImageData): void {
  const { data } = imageData;
  const luminances = new Uint8Array(data.length / 4);
  const histogram = new Uint32Array(256);

  for (let offset = 0, index = 0; offset < data.length; offset += 4, index += 1) {
    const luminance = Math.round(
      0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2],
    );

    luminances[index] = luminance;
    histogram[luminance] += 1;
  }

  const invert = percentile(histogram, luminances.length, 0.5) < 128;
  const normalized = invert ? invertedHistogram(histogram) : histogram;
  const low = percentile(normalized, luminances.length, 0.02);
  const high = percentile(normalized, luminances.length, 0.98);
  const range = high - low;
  const lookup = new Uint8ClampedArray(256);

  for (let value = 0; value < 256; value += 1) {
    lookup[value] = range < 8 ? value : Math.round(((value - low) * 255) / range);
  }

  for (let offset = 0, index = 0; offset < data.length; offset += 4, index += 1) {
    const value = invert ? 255 - luminances[index] : luminances[index];
    const enhanced = lookup[value];

    data[offset] = enhanced;
    data[offset + 1] = enhanced;
    data[offset + 2] = enhanced;
    data[offset + 3] = 255;
  }
}

function invertedHistogram(histogram: Uint32Array): Uint32Array {
  const inverted = new Uint32Array(histogram.length);

  for (let value = 0; value < histogram.length; value += 1) {
    inverted[histogram.length - 1 - value] = histogram[value];
  }

  return inverted;
}

function percentile(histogram: Uint32Array, total: number, fraction: number): number {
  const target = total * fraction;
  let cumulative = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    cumulative += histogram[value];

    if (cumulative >= target) {
      return value;
    }
  }

  return histogram.length - 1;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200b-\u200d\ufeff]/gi, '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFC')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

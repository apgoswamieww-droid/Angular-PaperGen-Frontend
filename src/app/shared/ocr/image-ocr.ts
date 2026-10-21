export type OcrLanguage = 'eng' | 'guj' | 'eng+guj';

export async function recognizeImage(
  file: File,
  onProgress?: (progress: number) => void,
  language: OcrLanguage = 'eng+guj',
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(language, undefined, {
    logger: (message) => onProgress?.(message.progress),
  });

  try {
    const { data } = await worker.recognize(file);
    const text = data.text.trim();

    if (text === '') {
      throw new Error('No readable text was found in the image.');
    }

    return text;
  } finally {
    await worker.terminate();
  }
}

import * as pdfjsLib from 'pdfjs-dist';

const maxImageSize = 2480; //5MB

export async function convertToBase64(file: File): Promise<string> {
  const imageFile =
    file.type === 'application/pdf' ? await convertPDFToImage(file) : file;

  const base64 = await fileToBase64(imageFile);
  const resizedBase64 = await resizeImageBase64(base64);

  return resizedBase64;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImageBase64(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > maxImageSize) {
        height *= maxImageSize / width;
        width = maxImageSize;
      } else if (height > maxImageSize) {
        width *= maxImageSize / height;
        height = maxImageSize;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob!);
      }, 'image/jpeg');
    };
    img.src = base64;
  });
}

function convertPDFToImage(pdfFile: File): Promise<File> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async (e: any) => {
      if (typeof e.target.result === 'string') {
        const pdf = await pdfjsLib.getDocument(e.target.result).promise;
        const numPages = pdf.numPages;
        const canvases: HTMLCanvasElement[] = [];

        // Use A4 size with default page scale (page exactly fits the viewport)
        const a4Width = 794;
        const a4Height = 1123;
        const viewportScale = 1.0;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: viewportScale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = a4Width;
          canvas.height = a4Height;

          // Scale to fit A4 size
          const scaleX = a4Width / viewport.width;
          const scaleY = a4Height / viewport.height;
          const scale = Math.min(scaleX, scaleY);

          const scaledViewport = page.getViewport({ scale: scale });

          const renderContext = {
            canvasContext: context || new CanvasRenderingContext2D(),
            viewport: scaledViewport,
          };

          await page.render(renderContext).promise;
          canvases.push(canvas);
        }

        const totalHeight = canvases.reduce(
          (sum, canvas) => sum + canvas.height,
          0,
        );
        const maxWidth = Math.max(...canvases.map((canvas) => canvas.width));
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = maxWidth;
        finalCanvas.height = totalHeight;
        const finalContext = finalCanvas.getContext('2d');

        let yOffset = 0;
        for (const canvas of canvases) {
          finalContext?.drawImage(canvas, 0, yOffset);
          yOffset += canvas.height;
        }

        // Convert the canvas to a Blob and save it
        return finalCanvas.toBlob((blob) => {
          const imageFile = new File([blob!], 'imageFile.png', {
            type: 'image/png',
          });
          resolve(imageFile);
        }, 'image/png');
      } else {
        reject('Failed to read file');
      }
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
    fileReader.readAsDataURL(pdfFile);
  });
}

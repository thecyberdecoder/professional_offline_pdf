import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';


export const usePdfjs = () => {
  const [pdfjs, setPdfjs] = useState<typeof pdfjsLib | null>(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        setPdfjs(pdfjsLib);
      } catch (error) {
        console.error("Failed to load PDF.js:", error);
      }
    };
    loadPdfJs();
  }, []);

  return pdfjs;
};
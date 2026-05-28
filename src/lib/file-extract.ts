/**
 * Client-side text extraction from uploaded job files.
 *
 * - PDF  → pdfjs-dist (Mozilla PDF.js), text layer per page
 * - DOCX → mammoth (raw text)
 * - TXT  → read directly
 *
 * Everything runs in the browser; the file is never uploaded anywhere unless
 * the admin chooses to save the resulting job. Scanned/image-only PDFs return
 * little or no text (no OCR) — the admin can then paste text manually.
 */

export type ExtractResult = {
  text: string;
  pages?: number;
  warning?: string;
};

async function extractPdf(file: File): Promise<ExtractResult> {
  // Lazy import so the heavy worker only loads when actually needed.
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker URL
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    text += pageText + "\n\n";
  }

  const trimmed = text.trim();
  return {
    text: trimmed,
    pages: doc.numPages,
    warning:
      trimmed.length < 40
        ? "This PDF has very little selectable text — it may be a scan/image. Paste the text manually if extraction looks empty."
        : undefined,
  };
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return { text: result.value.trim() };
}

async function extractTxt(file: File): Promise<ExtractResult> {
  const text = await file.text();
  return { text: text.trim() };
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdf(file);
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return extractDocx(file);
  }
  if (type === "text/plain" || name.endsWith(".txt")) {
    return extractTxt(file);
  }
  if (name.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files aren't supported. Save as .docx or .pdf, or paste the text.",
    );
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}

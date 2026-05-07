"use client";

export async function parseFile(file: File): Promise<{ title: string; text: string }> {
  const name = file.name;
  const baseTitle = name.replace(/\.[^.]+$/, "");
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const text = await parsePdf(file);
    return { title: baseTitle, text };
  }

  const text = await file.text();
  return { title: baseTitle, text };
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is bundled separately; point at the matching version on a CDN.
  const version = pdfjs.version as string;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string }>;
    pages.push(`[Page ${i}]\n` + items.map((it) => it.str).join(" "));
  }
  return pages.join("\n\n");
}

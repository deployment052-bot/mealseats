const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const { colors, fonts, layout } = require("./pdfTheme.js");

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// =========================================================
// TEXT HELPERS
// =========================================================

function cleanText(text) {
  if (!text) return "";
  return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

/**
 * Splits a line into { type, content } tokens for inline
 * **bold**, *italic* and `code` spans, preserving order.
 */
function tokenizeInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return { type: "bold", content: part.slice(2, -2) };
      }
      if (/^\*[^*]+\*$/.test(part)) {
        return { type: "italic", content: part.slice(1, -1) };
      }
      if (/^`[^`]+`$/.test(part)) {
        return { type: "code", content: part.slice(1, -1) };
      }
      return { type: "normal", content: part };
    });
}

function plainText(text) {
  return tokenizeInline(text)
    .map((t) => t.content)
    .join("");
}

// =========================================================
// PAGINATION HELPERS
// =========================================================

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function remainingHeight(doc) {
  return doc.page.height - doc.page.margins.bottom - doc.y;
}

function ensureSpace(doc, neededHeight) {
  if (remainingHeight(doc) < neededHeight) {
    doc.addPage();
  }
}

// =========================================================
// RUNNING HEADER (pages 2+) — the big brand block only
// appears on page 1; every later page gets a slim repeat
// so readers never lose context mid-document.
// =========================================================

function attachRunningHeader(doc) {
  doc.on("pageAdded", () => {
    const startY = doc.page.margins.top - 40;

    doc
      .font(fonts.bold)
      .fontSize(9)
      .fillColor(colors.subtleText)
      .text("MealEats AI", doc.page.margins.left, startY, {
        width: contentWidth(doc),
        align: "right",
      });

    doc
      .moveTo(doc.page.margins.left, doc.page.margins.top - 22)
      .lineTo(doc.page.width - doc.page.margins.right, doc.page.margins.top - 22)
      .lineWidth(0.5)
      .strokeColor(colors.border)
      .stroke();

    doc.y = doc.page.margins.top;
  });
}

// =========================================================
// INLINE TEXT (bold / italic / code aware paragraph writer)
// =========================================================

function drawInline(doc, text, { size = 10.5, color = colors.text, x, width } = {}) {
  const tokens = tokenizeInline(text);
  const startX = x !== undefined ? x : doc.page.margins.left;

  doc.fontSize(size);
  if (x !== undefined) doc.x = startX;

  tokens.forEach((token, i) => {
    const isLast = i === tokens.length - 1;

    let font = fonts.regular;
    let fillColor = color;

    if (token.type === "bold") {
      font = fonts.bold;
      fillColor = colors.darkGreen;
    } else if (token.type === "italic") {
      font = fonts.italic;
      fillColor = "#4a544a";
    } else if (token.type === "code") {
      font = fonts.mono;
      fillColor = colors.green;
    }

    doc.font(font).fillColor(fillColor);

    const opts = { continued: !isLast };
    if (i === 0 && width !== undefined) opts.width = width;

    doc.text(token.content, opts);
  });
}

function measureInlineHeight(doc, text, { size = 10.5, width } = {}) {
  doc.fontSize(size).font(fonts.regular);
  return doc.heightOfString(plainText(text) || " ", { width });
}

// =========================================================
// BLOCK RENDERERS
// =========================================================

function drawH1(doc, text) {
  const width = contentWidth(doc);
  doc.fontSize(17).font(fonts.bold);
  const h = doc.heightOfString(text, { width });

  ensureSpace(doc, h + 20);
  doc.moveDown(0.6);

  const startY = doc.y;

  doc.fillColor(colors.darkGreen).text(text, doc.page.margins.left, startY, { width });

  const afterY = doc.y + 6;

  doc
    .moveTo(doc.page.margins.left, afterY)
    .lineTo(doc.page.width - doc.page.margins.right, afterY)
    .lineWidth(1.5)
    .strokeColor(colors.border)
    .stroke();

  doc.y = afterY + 10;
}

function drawH2(doc, text) {
  const barWidth = 3;
  const textX = doc.page.margins.left + barWidth + 8;
  const width = contentWidth(doc) - barWidth - 8;

  doc.fontSize(13.5).font(fonts.bold);
  const h = doc.heightOfString(text, { width });

  ensureSpace(doc, h + 18);
  doc.moveDown(0.55);

  const startY = doc.y;

  doc.rect(doc.page.margins.left, startY + 1, barWidth, h + 2).fill(colors.accentGreen);

  doc.fillColor(colors.green).text(text, textX, startY, { width });

  doc.y = doc.y + 10;
}

function drawH3(doc, text) {
  const width = contentWidth(doc);
  doc.fontSize(11.5).font(fonts.bold);
  const h = doc.heightOfString(text, { width });

  ensureSpace(doc, h + 14);
  doc.moveDown(0.4);

  doc.fillColor("#3f6b3f").text(text, doc.page.margins.left, doc.y, { width });
  doc.y = doc.y + 7;
}

function drawDayBadge(doc, text) {
  const label = text.toUpperCase();
  doc.font(fonts.bold).fontSize(10.5);

  const textWidth = doc.widthOfString(label);
  const paddingX = 12;
  const boxHeight = 22;
  const boxWidth = textWidth + paddingX * 2;

  ensureSpace(doc, boxHeight + 20);
  doc.moveDown(0.6);

  const startY = doc.y;

  doc.roundedRect(doc.page.margins.left, startY, boxWidth, boxHeight, 11).fill(colors.green);

  doc
    .fillColor(colors.white)
    .text(label, doc.page.margins.left, startY + 6, { width: boxWidth, align: "center" });

  doc.y = startY + boxHeight + 12;
}

function drawParagraph(doc, text) {
  const width = contentWidth(doc);
  const h = measureInlineHeight(doc, text, { size: 10.5, width });

  ensureSpace(doc, h + 10);

  drawInline(doc, text, { size: 10.5, color: colors.text, x: doc.page.margins.left, width });
  doc.moveDown(0.55);
}

function drawHr(doc) {
  ensureSpace(doc, 20);
  doc.moveDown(0.3);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(0.7)
    .strokeColor(colors.border)
    .stroke();
  doc.moveDown(0.5);
}

function drawBlockquote(doc, text) {
  const barWidth = 3;
  const paddingX = 12;
  const paddingY = 8;
  const textX = doc.page.margins.left + barWidth + paddingX;
  const width = contentWidth(doc) - barWidth - paddingX * 2;

  doc.fontSize(10.5).font(fonts.italic);
  const h = doc.heightOfString(plainText(text), { width });
  const boxHeight = h + paddingY * 2;

  ensureSpace(doc, boxHeight + 14);
  doc.moveDown(0.4);

  const startY = doc.y;

  doc.rect(doc.page.margins.left, startY, contentWidth(doc), boxHeight).fill(colors.softGreenBg);
  doc.rect(doc.page.margins.left, startY, barWidth, boxHeight).fill(colors.accentGreen);

  doc
    .font(fonts.italic)
    .fillColor("#3f4a3f")
    .text(plainText(text), textX, startY + paddingY, { width });

  doc.y = startY + boxHeight + 12;
}

function drawListItem(doc, { text, ordered, number, level }) {
  const indent = level * 16;
  const markerWidth = 16;
  const x = doc.page.margins.left + indent + markerWidth;
  const width = contentWidth(doc) - indent - markerWidth;

  const h = measureInlineHeight(doc, text, { size: 10.5, width });
  ensureSpace(doc, h + 6);

  const startY = doc.y;

  if (ordered) {
    doc
      .font(fonts.bold)
      .fontSize(10.5)
      .fillColor(colors.green)
      .text(`${number}.`, doc.page.margins.left + indent, startY, {
        width: markerWidth,
        lineBreak: false,
      });
  } else {
    doc
      .circle(doc.page.margins.left + indent + 4, startY + 5.5, 2)
      .fillColor(colors.accentGreen)
      .fill();
  }

  // the marker's own text() call advances doc.y — pin it back to the
  // item's start line so the label text renders beside the marker,
  // not on the next line.
  doc.y = startY;

  drawInline(doc, text, { size: 10.5, color: colors.text, x, width });
  doc.moveDown(0.32);
}

function drawCodeBlock(doc, lines) {
  const lineHeight = 12.5;
  const padding = 10;
  const width = contentWidth(doc);

  let i = 0;

  ensureSpace(doc, lineHeight + padding * 2);
  doc.moveDown(0.3);

  while (i < lines.length) {
    const available = remainingHeight(doc);

    if (available < lineHeight + padding * 2) {
      doc.addPage();
      continue;
    }

    const maxLines = Math.max(1, Math.floor((available - padding * 2) / lineHeight));
    const chunk = lines.slice(i, i + maxLines);
    const blockHeight = chunk.length * lineHeight + padding * 2;

    const startY = doc.y;

    doc.roundedRect(doc.page.margins.left, startY, width, blockHeight, 6).fill(colors.codeBg);

    doc.font(fonts.mono).fontSize(9).fillColor(colors.codeText);

    let ty = startY + padding;
    chunk.forEach((line) => {
      doc.text(line || " ", doc.page.margins.left + padding, ty, {
        width: width - padding * 2,
        lineBreak: false,
      });
      ty += lineHeight;
    });

    doc.y = startY + blockHeight + 10;
    i += chunk.length;
  }
}

// =========================================================
// TABLE
// =========================================================

function splitRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((c) => c.trim());
}

function isSeparatorRow(line) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());
}

function computeColWidths(doc, header, rows, totalWidth) {
  const weights = header.map((h, ci) => {
    let maxLen = plainText(h).length;
    rows.forEach((r) => {
      const cell = r[ci] || "";
      maxLen = Math.max(maxLen, plainText(cell).length);
    });
    return Math.max(maxLen, 4);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let widths = weights.map((w) => (w / totalWeight) * totalWidth);
  widths = widths.map((w) => Math.max(w, layout.minColWidth));

  const widthSum = widths.reduce((a, b) => a + b, 0);
  if (widthSum > totalWidth) {
    const scale = totalWidth / widthSum;
    widths = widths.map((w) => w * scale);
  }

  return widths;
}

function rowHeight(doc, cells, colWidths, { bold = false } = {}) {
  doc.font(bold ? fonts.bold : fonts.regular).fontSize(10);
  let max = 0;
  cells.forEach((cell, ci) => {
    const h = doc.heightOfString(plainText(cell) || " ", {
      width: colWidths[ci] - layout.cellPadding * 2,
    });
    max = Math.max(max, h);
  });
  return max + layout.cellPadding * 2;
}

function drawTableHeader(doc, header, colWidths) {
  const height = rowHeight(doc, header, colWidths, { bold: true });
  const startY = doc.y;
  let x = doc.page.margins.left;

  doc.rect(doc.page.margins.left, startY, contentWidth(doc), height).fill(colors.green);

  header.forEach((cell, ci) => {
    doc
      .font(fonts.bold)
      .fontSize(10)
      .fillColor(colors.white)
      .text(plainText(cell), x + layout.cellPadding, startY + layout.cellPadding, {
        width: colWidths[ci] - layout.cellPadding * 2,
      });
    x += colWidths[ci];
  });

  doc.y = startY + height;
}

function drawTableRow(doc, cells, colWidths, isEven) {
  const height = rowHeight(doc, cells, colWidths);
  const startY = doc.y;
  let x = doc.page.margins.left;

  if (isEven) {
    doc.rect(doc.page.margins.left, startY, contentWidth(doc), height).fill(colors.softGreenBg);
  }

  cells.forEach((cell, ci) => {
    doc
      .font(fonts.regular)
      .fontSize(10)
      .fillColor(colors.text)
      .text(plainText(cell), x + layout.cellPadding, startY + layout.cellPadding, {
        width: colWidths[ci] - layout.cellPadding * 2,
      });
    x += colWidths[ci];
  });

  doc
    .moveTo(doc.page.margins.left, startY + height)
    .lineTo(doc.page.width - doc.page.margins.right, startY + height)
    .lineWidth(0.5)
    .strokeColor(colors.border)
    .stroke();

  doc.y = startY + height;
}

function drawTable(doc, header, rows) {
  const totalWidth = contentWidth(doc);
  const colWidths = computeColWidths(doc, header, rows, totalWidth);

  ensureSpace(doc, rowHeight(doc, header, colWidths, { bold: true }) + 20);
  doc.moveDown(0.4);

  drawTableHeader(doc, header, colWidths);

  rows.forEach((row, i) => {
    const h = rowHeight(doc, row, colWidths);

    if (remainingHeight(doc) < h) {
      doc.addPage();
      doc.moveDown(0.1);
      drawTableHeader(doc, header, colWidths);
    }

    drawTableRow(doc, row, colWidths, i % 2 === 0);
  });

  doc.moveDown(0.7);
}

// =========================================================
// LINE CLASSIFICATION
// =========================================================

const CAPTION_HEADINGS =
  /^(general guidelines|general rules|foods to limit|foods to avoid|important tips|notes|conclusion|summary)/i;

function isDayLine(line) {
  return /^#{0,6}\s*day\s+\d+/i.test(line);
}

function headingLevel(line) {
  const hashMatch = line.match(/^(#{1,6})\s+/);
  if (hashMatch) return hashMatch[1].length;
  if (CAPTION_HEADINGS.test(line)) return 2;
  return null;
}

function headingText(line) {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

// =========================================================
// MAIN CONTENT WALKER
// =========================================================

function renderMarkdown(doc, content) {
  const lines = cleanText(content).split("\n");

  let i = 0;
  let orderedCounter = 0;
  let lastWasList = false;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // ---- blank line ----
    if (!line) {
      lastWasList = false;
      orderedCounter = 0;
      i += 1;
      continue;
    }

    // ---- code fence ----
    if (/^```/.test(line)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      drawCodeBlock(doc, codeLines);
      lastWasList = false;
      continue;
    }

    // ---- table ----
    if (line.includes("|") && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      drawTable(doc, header, rows);
      lastWasList = false;
      continue;
    }

    // ---- horizontal rule ----
    if (line === "---" || line === "***" || line === "___") {
      drawHr(doc);
      i += 1;
      lastWasList = false;
      continue;
    }

    // ---- day badge ----
    if (isDayLine(line)) {
      drawDayBadge(doc, headingText(line) || line);
      i += 1;
      lastWasList = false;
      continue;
    }

    // ---- heading ----
    const level = headingLevel(line);
    if (level !== null) {
      const text = headingText(line);
      if (level === 1) drawH1(doc, text);
      else if (level === 2) drawH2(doc, text);
      else drawH3(doc, text);
      i += 1;
      lastWasList = false;
      continue;
    }

    // ---- blockquote ----
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      drawBlockquote(doc, quoteLines.join(" "));
      lastWasList = false;
      continue;
    }

    // ---- list item (bullet or numbered, indentation-aware) ----
    const bulletMatch = raw.match(/^(\s*)[-*•]\s+(.*)$/);
    const orderedMatch = raw.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (bulletMatch || orderedMatch) {
      const indentSpaces = (bulletMatch || orderedMatch)[1].length;
      const level = Math.min(3, Math.floor(indentSpaces / 2));

      if (!lastWasList) orderedCounter = 0;

      if (orderedMatch) {
        orderedCounter += 1;
        drawListItem(doc, {
          text: orderedMatch[3],
          ordered: true,
          number: orderedMatch[2] || orderedCounter,
          level,
        });
      } else {
        drawListItem(doc, { text: bulletMatch[2], ordered: false, level });
      }

      lastWasList = true;
      i += 1;
      continue;
    }

    // ---- paragraph ----
    drawParagraph(doc, line);
    lastWasList = false;
    i += 1;
  }
}

// =========================================================
// DOCUMENT SHELL (brand header, title block, footer)
// =========================================================

function drawBrandHeader(doc) {
  doc.font(fonts.bold).fontSize(24).fillColor(colors.green).text("MEAL", { continued: true });
  doc.fillColor(colors.accentGreen).text("EATS");

  doc
    .font(fonts.regular)
    .fontSize(9)
    .fillColor(colors.subtleText)
    .text("AI-Powered Food & Nutrition Assistant");

  doc.moveDown(0.8);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(1)
    .strokeColor(colors.border)
    .stroke();

  doc.moveDown(1);
}

function drawTitleBlock(doc, title) {
  doc.font(fonts.bold).fontSize(20).fillColor(colors.darkGreen).text(title, { align: "left" });

  doc
    .moveDown(0.25)
    .font(fonts.regular)
    .fontSize(9)
    .fillColor(colors.subtleText)
    .text(
      `Generated by MealEats AI • ${new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`
    );

  doc.moveDown(1);
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Footer text is drawn inside the bottom margin band. PDFKit's
    // auto-pagination checks y against page.margins.bottom and will
    // silently spawn a new (blank) page if we write there with the
    // real margin still in effect. Zero it out just for the stamp.
    const realBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const pageHeight = doc.page.height;

    doc
      .moveTo(55, pageHeight - 48)
      .lineTo(540, pageHeight - 48)
      .lineWidth(0.5)
      .strokeColor(colors.border)
      .stroke();

    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor(colors.subtleText)
      .text("MealEats AI • General nutrition guidance", 55, pageHeight - 38, {
        width: 350,
        lineBreak: false,
      });

    doc
      .fontSize(8)
      .fillColor(colors.subtleText)
      .text(`Page ${i + 1} of ${range.count}`, 450, pageHeight - 38, {
        width: 90,
        align: "right",
        lineBreak: false,
      });

    doc.page.margins.bottom = realBottomMargin;
  }
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)\s*$/m);
  return match ? match[1].trim() : "Personalized Nutrition Plan";
}

// =========================================================
// PUBLIC API
// =========================================================

const generatePDF = async (content, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(UPLOAD_DIR, fileName);
      const cleaned = cleanText(content);

      const title = extractTitle(cleaned);
      const bodyContent = cleaned.replace(/^#\s+.+\n?/, "").trim();

      const doc = new PDFDocument({
        size: "A4",
        margins: layout.margin,
        bufferPages: true,
        autoFirstPage: true,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      attachRunningHeader(doc);

      drawBrandHeader(doc);
      drawTitleBlock(doc, title);

      renderMarkdown(doc, bodyContent);

      drawFooters(doc);

      doc.end();

      stream.on("finish", () => {
        console.log("PDF saved:", filePath);
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePDF,
};
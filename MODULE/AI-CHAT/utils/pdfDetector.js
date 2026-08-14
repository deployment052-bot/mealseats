const shouldGeneratePDF = (message) => {
  if (!message || typeof message !== "string") {
    return false;
  }

  const text = message
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()[\]{}]/g, " ");

  // =================================================
  // EXPLICIT PDF REQUESTS
  // =================================================

  const pdfRequestPatterns = [
    // English
    /\bpdf\b/,
    /\bpdf file\b/,
    /\bpdf document\b/,
    /\bmake (a |an )?pdf\b/,
    /\bcreate (a |an )?pdf\b/,
    /\bgenerate (a |an )?pdf\b/,
    /\bprepare (a |an )?pdf\b/,
    /\bbuild (a |an )?pdf\b/,
    /\bexport (this|it|that|the)? ?(as|to)? ?pdf\b/,
    /\bconvert (this|it|that)? ?(to|into)? ?pdf\b/,
    /\bdownload (a |the )?pdf\b/,
    /\bgive me (a |the )?pdf\b/,
    /\bsend me (a |the )?pdf\b/,
    /\bprovide (a |the )?pdf\b/,
    /\bpdf bana\b/,
    /\bpdf banao\b/,
    /\bpdf bana do\b/,
    /\bpdf bana\d* do\b/,
    /\bpdf generate\b/,
    /\bgenerate pdf\b/,
    /\bmake pdf\b/,
    /\bcreate pdf\b/,
    /\bpdf chahiye\b/,
    /\bpdf de do\b/,
    /\bpdf bhej do\b/,
    /\bpdf download\b/,

    // Hindi / Hinglish
    /\bpdf mein\b/,
    /\bpdf me\b/,
    /\bpdf mai\b/,
    /\bpdf ke form mein\b/,
    /\bpdf ke form me\b/,
    /\bpdf format mein\b/,
    /\bpdf format me\b/,
    /\biska pdf\b/,
    /\biski pdf\b/,
    /\biska pdf bana\b/,
    /\biska pdf banao\b/,
    /\biska pdf bana do\b/,
    /\biski pdf bana\b/,
    /\biski pdf banao\b/,
    /\biski pdf bana do\b/,
    /\bpdf bana ke do\b/,
    /\bpdf banake do\b/,
    /\bpdf banakar do\b/,
    /\bpdf ready karo\b/,
    /\bpdf ready kar do\b/,
    /\bpdf taiyar karo\b/,
    /\bpdf tayar karo\b/,
    /\bpdf nikal do\b/,
    /\bpdf nikal ke do\b/,
    /\bpdf chahiye mujhe\b/,
  ];

  // =================================================
  // NEGATIVE REQUESTS
  // =================================================
  // User explicitly says NOT to generate PDF

  const negativePatterns = [
    /\bpdf mat\b/,
    /\bpdf nahi\b/,
    /\bpdf nahin\b/,
    /\bpdf na banana\b/,
    /\bpdf mat banana\b/,
    /\bpdf mat banao\b/,
    /\bpdf nahi banana\b/,
    /\bpdf nahi chahiye\b/,
    /\bpdf nahin chahiye\b/,
    /\bwithout pdf\b/,
    /\bno pdf\b/,
    /\bdon't make pdf\b/,
    /\bdo not make pdf\b/,
    /\bdont make pdf\b/,
    /\bno need for pdf\b/,
  ];

  // Negative request gets priority
  const isNegativeRequest = negativePatterns.some(
    (pattern) => pattern.test(text)
  );

  if (isNegativeRequest) {
    return false;
  }

  // Explicit PDF request
  return pdfRequestPatterns.some(
    (pattern) => pattern.test(text)
  );
};

module.exports = {
  shouldGeneratePDF,
};
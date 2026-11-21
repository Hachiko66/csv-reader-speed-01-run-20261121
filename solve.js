// csv-reader-speed-01 entry: faster drop-in for csv-reader 1.0.0
// Produces identical output to csv-reader 1.0.0 but with optimized parsing.
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (text.charCodeAt(0) === 0xFEFF) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  function error(code) {
    errors.push({ code, line: recordLine, row: recordRow });
  }

  // Read unquoted characters onto value up to next comma or line break.
  // Returns {value, ended} where ended is 'comma', 'lineBreak', or 'end'.
  function readUnquoted() {
    const parts = [];
    while (pos < text.length) {
      const c = text[pos];
      if (c === ',') { pos++; return { value: parts.join(''), ended: 'comma' }; }
      if (c === '\n') { pos++; line++; return { value: parts.join(''), ended: 'lineBreak' }; }
      if (c === '\r') {
        if (text[pos + 1] === '\n') { pos += 2; line++; return { value: parts.join(''), ended: 'lineBreak' }; }
        error('stray_cr');
        pos++;
        continue;
      }
      parts.push(c);
      pos++;
    }
    return { value: parts.join(''), ended: 'end' };
  }

  // Read a quoted field whose opening quote is at pos.
  function readQuoted() {
    const open = pos;
    const openLine = line;
    const parts = [];
    pos++;
    let closed = false;
    while (pos < text.length) {
      const c = text[pos];
      if (c === '"') {
        if (text[pos + 1] === '"') {
          parts.push('"');
          pos += 2;
        } else {
          pos++;
          closed = true;
          break;
        }
      } else if (c === '\r') {
        parts.push('\n');
        line++;
        pos += text[pos + 1] === '\n' ? 2 : 1;
      } else if (c === '\n') {
        parts.push('\n');
        line++;
        pos++;
      } else {
        parts.push(c);
        pos++;
      }
    }
    let value = parts.join('');
    if (!closed) {
      pos = open + 1;
      line = openLine;
      error('unterminated_quote');
      return readUnquotedPrefixed('"');
    }
    if (pos >= text.length) return { value, ended: 'end' };
    const c = text[pos];
    if (c === ',') { pos++; return { value, ended: 'comma' }; }
    if (c === '\n') { pos++; line++; return { value, ended: 'lineBreak' }; }
    if (c === '\r' && text[pos + 1] === '\n') { pos += 2; line++; return { value, ended: 'lineBreak' }; }
    // Junk after closing quote
    const junkStart = pos;
    let junkParts = [];
    while (pos < text.length && text[pos] !== ',' && text[pos] !== '\n' && text[pos] !== '\r') {
      junkParts.push(text[pos]);
      pos++;
    }
    const junk = junkParts.join('');
    value += junk;
    if (junk.length > 0) error('quote_junk');
    if (pos >= text.length) return { value, ended: 'end' };
    const c2 = text[pos];
    if (c2 === ',') { pos++; return { value, ended: 'comma' }; }
    if (c2 === '\n') { pos++; line++; return { value, ended: 'lineBreak' }; }
    if (c2 === '\r' && text[pos + 1] === '\n') { pos += 2; line++; return { value, ended: 'lineBreak' }; }
    return { value, ended: 'end' };
  }

  // Read unquoted field with a pre-filled value (for unterminated_quote case).
  function readUnquotedPrefixed(prefix) {
    const parts = [prefix];
    while (pos < text.length) {
      const c = text[pos];
      if (c === ',') { pos++; return { value: parts.join(''), ended: 'comma' }; }
      if (c === '\n') { pos++; line++; return { value: parts.join(''), ended: 'lineBreak' }; }
      if (c === '\r') {
        if (text[pos + 1] === '\n') { pos += 2; line++; return { value: parts.join(''), ended: 'lineBreak' }; }
        error('stray_cr');
        pos++;
        continue;
      }
      parts.push(c);
      pos++;
    }
    return { value: parts.join(''), ended: 'end' };
  }

  while (pos < text.length) {
    while (pos < text.length) {
      const c = text[pos];
      if (c === '\n') { pos++; line++; }
      else if (c === '\r' && text[pos + 1] === '\n') { pos += 2; line++; }
      else break;
    }
    if (pos >= text.length) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let field;
    let quoted;
    do {
      quoted = text[pos] === '"';
      field = quoted ? readQuoted() : readUnquoted();
      fields.push(field.value);
    } while (field.ended === 'comma');

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}

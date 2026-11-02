import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lessonsDir = path.resolve(__dirname, '../src/data/lessons');

function countWords(text) {
  if (typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function validateVisualHighlight(visual, token, chunkLabel, errors, warnings) {
  if (!visual || typeof visual !== 'object') {
    errors.push(`${chunkLabel}: highlight token "${token}" used but chunk has no visual.`);
    return;
  }

  const type = visual.type;
  if (type === 'dotGrid') {
    const validIds = new Set((visual.groups || []).map((g) => g.id));
    if (!validIds.has(token)) {
      errors.push(`${chunkLabel} (dotGrid): unknown highlight id "${token}".`);
    }
    return;
  }

  if (type === 'bars') {
    const validIds = new Set((visual.items || []).map((it) => it.id));
    if (!validIds.has(token)) {
      errors.push(`${chunkLabel} (bars): unknown highlight id "${token}".`);
    }
    return;
  }

  if (type === 'matrixGrid') {
    const matrices = Array.isArray(visual.matrices) ? visual.matrices : [];
    const mMatch = /^([^:]+):(?:r(\d+))?(?:c(\d+))?$/.exec(token);
    if (!mMatch || (!mMatch[2] && !mMatch[3])) {
      errors.push(`${chunkLabel} (matrixGrid): invalid highlight token "${token}".`);
      return;
    }
    const [, matId, rStr, cStr] = mMatch;
    const mat = matrices.find((m) => m.id === matId);
    if (!mat || !Array.isArray(mat.rows) || mat.rows.length === 0) {
      errors.push(`${chunkLabel} (matrixGrid): unknown matrix "${matId}" in highlight "${token}".`);
      return;
    }
    const numRows = mat.rows.length;
    const numCols = Array.isArray(mat.rows[0]) ? mat.rows[0].length : 0;
    if (rStr !== undefined) {
      const rIdx = Number(rStr);
      if (rIdx < 1 || rIdx > numRows) {
        errors.push(`${chunkLabel} (matrixGrid): row out of range in highlight "${token}".`);
      }
    }
    if (cStr !== undefined) {
      const cIdx = Number(cStr);
      if (cIdx < 1 || cIdx > numCols) {
        errors.push(`${chunkLabel} (matrixGrid): column out of range in highlight "${token}".`);
      }
    }
    return;
  }

  if (type === 'linePlot') {
    if (token === 'line') {
      if (!visual.line) {
        warnings.push(`${chunkLabel} (linePlot): highlight "line" used but no line is defined.`);
      }
      return;
    }
    const xMatch = /^x(-?\d+(?:\.\d+)?)$/.exec(token);
    if (xMatch) {
      const xVal = Number(xMatch[1]);
      const pts = Array.isArray(visual.points) ? visual.points : [];
      const exists = pts.some((pt) => Array.isArray(pt) && Number(pt[0]) === xVal);
      if (!exists) {
        warnings.push(`${chunkLabel} (linePlot): point for token "${token}" not found in points.`);
      }
      return;
    }
    warnings.push(`${chunkLabel} (linePlot): unknown highlight token "${token}".`);
    return;
  }

  if (type === 'codeBlock') {
    const lMatch = /^l(\d+)$/.exec(token);
    const lines = Array.isArray(visual.lines) ? visual.lines : [];
    if (!lMatch) {
      warnings.push(`${chunkLabel} (codeBlock): unknown highlight token "${token}".`);
      return;
    }
    const lineNum = Number(lMatch[1]);
    if (lineNum < 1 || lineNum > lines.length) {
      warnings.push(
        `${chunkLabel} (codeBlock): highlight token "${token}" out of range (1..${lines.length}).`
      );
    }
    return;
  }

  warnings.push(`${chunkLabel}: unknown visual type "${type}" with highlight "${token}".`);
}

function checkLessonFile(filePath) {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const errors = [];
  const warnings = [];
  let topicCount = 0;
  let chunkCount = 0;
  let practiceCount = 0;
  let reviewItemCount = 0;

  const topics = Array.isArray(data.topics) ? data.topics : [];
  for (const topic of topics) {
    topicCount++;
    const chunks = Array.isArray(topic.chunks) ? topic.chunks : [];
    for (const chunk of chunks) {
      chunkCount++;
      const label = `[${fileName} · Topic ${topic.topicId} · ${chunk.chunkId || 'unknown'}]`;

      // Required chunk fields: goal, formula.readAloud, commonMistake, reviewItems >= 1
      if (typeof chunk.goal !== 'string' || !chunk.goal.trim()) {
        errors.push(`${label}: missing or empty "goal".`);
      }
      if (
        !chunk.formula ||
        typeof chunk.formula.readAloud !== 'string' ||
        !chunk.formula.readAloud.trim()
      ) {
        errors.push(`${label}: missing or empty "formula.readAloud".`);
      }
      if (typeof chunk.commonMistake !== 'string' || !chunk.commonMistake.trim()) {
        errors.push(`${label}: missing or empty "commonMistake".`);
      }
      if (!Array.isArray(chunk.reviewItems) || chunk.reviewItems.length < 1) {
        errors.push(`${label}: must have at least one "reviewItems" entry.`);
      } else {
        reviewItemCount += chunk.reviewItems.length;
      }

      // Guess validation
      if (!chunk.guess || typeof chunk.guess !== 'object') {
        errors.push(`${label}: missing "guess".`);
      } else {
        const gOpts = Array.isArray(chunk.guess.options) ? chunk.guess.options : [];
        const gIdx = chunk.guess.correctIndex;
        if (
          typeof gIdx !== 'number' ||
          !Number.isInteger(gIdx) ||
          gIdx < 0 ||
          gIdx >= gOpts.length
        ) {
          errors.push(
            `${label}: guess.correctIndex (${gIdx}) out of range for ${gOpts.length} options.`
          );
        }
      }

      // Visual validation (dotGrid sum & subsetOf rules)
      if (chunk.visual && chunk.visual.type === 'dotGrid') {
        const total = Number(chunk.visual.total);
        const groups = Array.isArray(chunk.visual.groups) ? chunk.visual.groups : [];
        const baseGroups = groups.filter((g) => !g.subsetOf);
        const subsetGroups = groups.filter((g) => Boolean(g.subsetOf));
        const sumBase = baseGroups.reduce((acc, g) => acc + Number(g.count || 0), 0);
        if (sumBase !== total) {
          errors.push(
            `${label} (dotGrid): groups without subsetOf sum to ${sumBase}, expected total=${total}.`
          );
        }
        const byId = new Map(groups.map((g) => [g.id, g]));
        for (const sub of subsetGroups) {
          const parent = byId.get(sub.subsetOf);
          if (!parent) {
            errors.push(
              `${label} (dotGrid): group "${sub.id}" references missing subsetOf parent "${sub.subsetOf}".`
            );
          } else if (Number(sub.count) > Number(parent.count)) {
            errors.push(
              `${label} (dotGrid): subset group "${sub.id}" count (${sub.count}) exceeds parent "${parent.id}" count (${parent.count}).`
            );
          }
        }
      }

      // Steps validation (<= 30 words & highlight ids)
      const steps = Array.isArray(chunk.steps) ? chunk.steps : [];
      steps.forEach((step, sIdx) => {
        const wc = countWords(step.text);
        if (wc > 30) {
          errors.push(`${label} step #${sIdx + 1}: exceeds 30 words (${wc} words): "${step.text}"`);
        }
        const highlights = Array.isArray(step.highlight) ? step.highlight : [];
        for (const token of highlights) {
          validateVisualHighlight(chunk.visual, token, `${label} step #${sIdx + 1}`, errors, warnings);
        }
      });

      // Practice activities validation
      const practices = Array.isArray(chunk.practice) ? chunk.practice : [];
      for (const act of practices) {
        practiceCount++;
        const actLabel = `${label} practice "${act.id}" (${act.type})`;
        if (act.type === 'choice') {
          const opts = Array.isArray(act.options) ? act.options : [];
          const cIdx = act.correctIndex;
          if (
            typeof cIdx !== 'number' ||
            !Number.isInteger(cIdx) ||
            cIdx < 0 ||
            cIdx >= opts.length
          ) {
            errors.push(
              `${actLabel}: correctIndex (${cIdx}) out of range for ${opts.length} options.`
            );
          }
        } else if (act.type === 'fillNumber') {
          if (typeof act.answer !== 'number' || !Number.isFinite(act.answer)) {
            errors.push(`${actLabel}: non-numeric answer (${JSON.stringify(act.answer)}).`);
          }
        } else if (act.type === 'order') {
          if (!Array.isArray(act.items) || act.items.length < 3) {
            errors.push(
              `${actLabel}: "order" activity must have at least 3 items (found ${
                Array.isArray(act.items) ? act.items.length : 0
              }).`
            );
          }
        } else if (act.type === 'match') {
          if (!Array.isArray(act.pairs) || act.pairs.length < 3) {
            errors.push(
              `${actLabel}: "match" activity must have at least 3 pairs (found ${
                Array.isArray(act.pairs) ? act.pairs.length : 0
              }).`
            );
          }
        }
      }
    }
  }

  return {
    fileName,
    topicCount,
    chunkCount,
    practiceCount,
    reviewItemCount,
    errors,
    warnings,
  };
}

function main() {
  if (!fs.existsSync(lessonsDir)) {
    console.error(`Lessons directory not found: ${lessonsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith('.lessons.json'))
    .sort();

  if (files.length === 0) {
    console.error('No *.lessons.json files found in src/data/lessons/');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  console.log('==========================================================');
  console.log(' DUNGEON BELAJAR ML & DL — LESSON CHUNKS v3 QUALITY GATE');
  console.log('==========================================================');

  for (const file of files) {
    const report = checkLessonFile(path.join(lessonsDir, file));
    console.log(
      `\nFile: ${report.fileName} | Topics: ${report.topicCount} | Chunks: ${report.chunkCount} | Practice: ${report.practiceCount} | Review Items: ${report.reviewItemCount}`
    );

    if (report.warnings.length > 0) {
      console.log(`  Warnings (${report.warnings.length}):`);
      for (const w of report.warnings) {
        console.log(`    [WARN] ${w}`);
      }
    }

    if (report.errors.length > 0) {
      console.log(`  Errors (${report.errors.length}):`);
      for (const e of report.errors) {
        console.log(`    [FAIL] ${e}`);
      }
    } else {
      console.log('  Status: PASS (0 errors)');
    }

    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;
  }

  console.log('\n----------------------------------------------------------');
  console.log(`Summary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  console.log('----------------------------------------------------------');

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();

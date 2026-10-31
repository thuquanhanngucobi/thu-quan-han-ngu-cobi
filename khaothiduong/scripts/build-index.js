#!/usr/bin/env node
/* Quét exams/hsk<cấp>/<tên-đề>/exam.json và tạo exams/index.json (danh sách đề cho trang web).
   Chạy tự động bởi GitHub Action mỗi lần bạn đẩy đề mới lên. Chạy tay: node scripts/build-index.js
   Thư mục bắt đầu bằng "_" (ví dụ _template) bị bỏ qua. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'exams');
const exams = [];
let errors = 0, warnings = 0;
const warn = m => { warnings++; console.warn('  ! ' + m); };
const err = m => { errors++; console.error('  ✘ ' + m); };

function walkAssets(node, cb) {
  if (Array.isArray(node)) node.forEach(n => walkAssets(n, cb));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if ((k === 'image' || k === 'audio') && typeof v === 'string') cb(v);
      else walkAssets(v, cb);
    }
  }
}

for (const lv of fs.readdirSync(root)) {
  const m = /^hsk([1-6])$/i.exec(lv);
  if (!m || !fs.statSync(path.join(root, lv)).isDirectory()) continue;
  for (const dir of fs.readdirSync(path.join(root, lv)).sort()) {
    if (dir.startsWith('_')) continue;
    const folder = path.join(root, lv, dir);
    const file = path.join(folder, 'exam.json');
    if (!fs.existsSync(file)) continue;
    console.log(`${lv}/${dir}`);
    let ex;
    try { ex = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { err('exam.json không đúng cú pháp JSON: ' + e.message); continue; }

    const level = Number(ex.level || m[1]);
    if (level !== Number(m[1])) warn(`level trong file (${level}) khác thư mục (${m[1]})`);
    if (!ex.title) err('thiếu "title"');
    if (!Array.isArray(ex.sections) || !ex.sections.length) { err('thiếu "sections"'); continue; }

    let count = 0, auto = 0, manual = 0;
    const seen = new Set();
    for (const s of ex.sections) for (const p of (s.parts || [])) for (const q of (p.questions || [])) {
      count++;
      const type = q.type || p.type || 'choice';
      if (q.n != null) { if (seen.has(q.n)) err(`trùng số câu ${q.n}`); seen.add(q.n); }
      if (type === 'essay' || q.answer == null) manual++; else auto++;
      const opts = q.options || p.options || [];
      if (['choice', 'matching'].includes(type)) {
        if (!opts.length) err(`câu ${q.n}: không có "options"`);
        else if (q.answer != null && !opts.some(o => o.key === q.answer)) err(`câu ${q.n}: đáp án "${q.answer}" không nằm trong options`);
      }
      if (type === 'truefalse' && q.answer != null && !['T', 'F'].includes(q.answer)) err(`câu ${q.n}: đáp án truefalse phải là "T" hoặc "F"`);
      if (type === 'ordering') {
        if (!Array.isArray(q.items)) err(`câu ${q.n}: ordering cần "items"`);
        else if (q.answer != null && (!Array.isArray(q.answer) || q.answer.length !== q.items.length)) err(`câu ${q.n}: "answer" của ordering phải là mảng chỉ số của items`);
      }
      if (!['truefalse', 'choice', 'matching', 'ordering', 'short', 'essay'].includes(type)) err(`câu ${q.n}: loại câu hỏi "${type}" chưa hỗ trợ`);
    }
    walkAssets(ex, a => { if (!/^(https?:|data:|\/)/.test(a) && !fs.existsSync(path.join(folder, a))) warn('thiếu file ' + a); });
    if (!count) { err('đề không có câu hỏi nào'); continue; }

    exams.push({
      id: `hsk${level}-${dir.toLowerCase()}`,
      level, version: String(ex.version || '2.0'), title: ex.title, code: ex.code || dir,
      durationMin: ex.durationMin || 0, questions: count, auto, manual,
      order: ex.order != null ? ex.order : 0,
      path: `exams/${lv}/${dir}/`
    });
  }
}

exams.sort((a, b) => a.level - b.level || a.order - b.order || a.title.localeCompare(b.title, 'vi', { numeric: true }));
const ids = new Set();
exams.forEach(e => { if (ids.has(e.id)) err('trùng id ' + e.id); ids.add(e.id); });

fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify({ exams }, null, 2));
console.log(`\nĐã tạo exams/index.json: ${exams.length} đề · ${warnings} cảnh báo · ${errors} lỗi`);
if (errors) process.exit(1);

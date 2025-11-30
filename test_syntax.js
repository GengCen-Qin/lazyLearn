// Test syntax of the refactored controller
import fs from 'fs';

try {
  const path = '/home/lucas/PythonProject/lazy_english/new_web/app/javascript/controllers/video_subtitle_merged_controller.js';
  const code = fs.readFileSync(path, 'utf8');
  
  // Remove import statements and export statement for syntax check
  const strippedCode = code
    .replace(/^import.*;$/gm, '')
    .replace('export default class', 'class ControllerClass');
  
  // Try to evaluate the controller code
  new Function(strippedCode);
  console.log('✓ 主控制器没有语法错误');
} catch (e) {
  console.error('✗ 主控制器有语法错误:', e.message);
  process.exit(1);
}

// Test video_controls module
try {
  const path = '/home/lucas/PythonProject/lazy_english/new_web/app/javascript/controllers/video_controls.js';
  const code = fs.readFileSync(path, 'utf8');
  
  // Remove import statements for syntax check
  const strippedCode = code
    .replace(/^import.*;$/gm, '')
    .replace('export class VideoControls', 'class VideoControls');
  
  // Try to evaluate the code
  new Function(strippedCode);
  console.log('✓ 视频控制模块没有语法错误');
} catch (e) {
  console.error('✗ 视频控制模块有语法错误:', e.message);
  process.exit(1);
}

// Test subtitle_manager module
try {
  const path = '/home/lucas/PythonProject/lazy_english/new_web/app/javascript/controllers/subtitle_manager.js';
  const code = fs.readFileSync(path, 'utf8');
  
  const strippedCode = code
    .replace(/^import.*;$/gm, '')
    .replace('export class SubtitleManager', 'class SubtitleManager');
  
  new Function(strippedCode);
  console.log('✓ 字幕管理模块没有语法错误');
} catch (e) {
  console.error('✗ 字幕管理模块有语法错误:', e.message);
  process.exit(1);
}

// Test word_lookup module
try {
  const path = '/home/lucas/PythonProject/lazy_english/new_web/app/javascript/controllers/word_lookup.js';
  const code = fs.readFileSync(path, 'utf8');
  
  const strippedCode = code
    .replace(/^import.*;$/gm, '')
    .replace('export class WordLookup', 'class WordLookup');
  
  new Function(strippedCode);
  console.log('✓ 单词查询模块没有语法错误');
} catch (e) {
  console.error('✗ 单词查询模块有语法错误:', e.message);
  process.exit(1);
}

// Test utils module
try {
  const path = '/home/lucas/PythonProject/lazy_english/new_web/app/javascript/controllers/utils.js';
  const code = fs.readFileSync(path, 'utf8');
  
  const strippedCode = code
    .replace(/^import.*;$/gm, '')
    .replace('export class Utils', 'class Utils');
  
  new Function(strippedCode);
  console.log('✓ 工具模块没有语法错误');
} catch (e) {
  console.error('✗ 工具模块有语法错误:', e.message);
  process.exit(1);
}

console.log('所有模块语法检查通过！');
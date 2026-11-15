const test = require('node:test');
const assert = require('node:assert/strict');

const _UTILS = require('../scripts/common/utils.js');

// 内容脚本里 _UTILS 是 utils.js 定义的全局类；Node 里手动挂到 global，
// 让 stepless-video-rate.js / feed-roll-history-btn.js 里的 typeof 判断生效。
global._UTILS = _UTILS;

const { getRateShortcutAction } = require('../scripts/stepless-video-rate.js');
const { shouldHandleRollShortcut } = require('../scripts/feed-roll-history-btn.js');

// --- 伪 DOM 节点 ---------------------------------------------------------

const element = (tagName, extra = {}) => {
  const attributes = extra.attributes || {};
  return {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    isContentEditable: extra.isContentEditable === true,
    getAttribute: name => (name in attributes ? attributes[name] : null),
    closest: () => extra.closestResult ?? null,
  };
};

// B 站评论区的编辑器（在 shadow root 内部）
const editorInShadow = element('div', { isContentEditable: true });
// 外层自定义元素，就是 document 层能看到的 shadow host
const commentHost = element('bili-comment-box');
// 页面普通节点
const bodyNode = element('body');
const buttonNode = element('button');
const disabledEditable = element('div', { attributes: { contenteditable: 'false' } });

const keyEvent = (overrides = {}) => ({
  key: '0',
  code: 'Digit0',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  defaultPrevented: false,
  isComposing: false,
  repeat: false,
  target: null,
  ...overrides,
});

// --- isEditableNode -----------------------------------------------------

test('isEditableNode 识别常规输入控件', () => {
  assert.equal(_UTILS.isEditableNode(element('input')), true);
  assert.equal(_UTILS.isEditableNode(element('textarea')), true);
  assert.equal(_UTILS.isEditableNode(editorInShadow), true);
  assert.equal(_UTILS.isEditableNode(element('div', { attributes: { role: 'textbox' } })), true);
  assert.equal(_UTILS.isEditableNode(bodyNode), false);
  assert.equal(_UTILS.isEditableNode(null), false);
});

test('isEditableNode 不把 contenteditable="false" 当成输入区', () => {
  assert.equal(_UTILS.isEditableNode(disabledEditable), false);
});

// --- isTypingContext ----------------------------------------------------

test('isTypingContext 通过 composedPath 看到 shadow root 里的编辑器', () => {
  const event = keyEvent({
    target: commentHost,
    composedPath: () => [editorInShadow, bodyNode, bodyNode],
  });
  assert.equal(_UTILS.isTypingContext(event, null), true);
});

test('isTypingContext 在 target 被重定向成 shadow host 时仍能判断', () => {
  const host = element('bili-comment-box', {
    own: {},
  });
  host.shadowRoot = { activeElement: editorInShadow };
  const documentObject = { activeElement: host };

  // composedPath 只给到 host（模拟重定向后的路径）
  const event = keyEvent({ target: host, composedPath: () => [host, bodyNode] });
  assert.equal(_UTILS.isTypingContext(event, documentObject), true);
});

test('isTypingContext 对普通页面按键返回 false', () => {
  const event = keyEvent({
    target: buttonNode,
    composedPath: () => [buttonNode, bodyNode, bodyNode],
  });
  assert.equal(_UTILS.isTypingContext(event, null), false);
});

test('deepActiveElement 逐层下钻 shadow root', () => {
  const innerHost = element('div', { isContentEditable: true });
  const outerHost = element('bili-comment-box');
  outerHost.shadowRoot = { activeElement: innerHost };
  assert.equal(_UTILS.deepActiveElement({ activeElement: outerHost }), innerHost);
  assert.equal(_UTILS.deepActiveElement({ activeElement: null }), null);
});

// --- 回归：评论框里不能吞掉 0 / + / - -----------------------------------

test('回归：在 shadow DOM 评论区按 0 不应触发倍速重置（原来的 bug）', () => {
  const shadowEvent = keyEvent({
    key: '0',
    code: 'Digit0',
    target: commentHost,
    composedPath: () => [editorInShadow, commentHost, bodyNode],
  });
  assert.equal(getRateShortcutAction(shadowEvent, commentHost), null);

  // + / - / = 走同一套判断，也不应被抢走
  for (const [key, code] of [
    ['-', 'Minus'],
    ['=', 'Equal'],
    ['+', 'NumpadAdd'],
  ]) {
    const event = keyEvent({
      key,
      code,
      target: commentHost,
      composedPath: () => [editorInShadow, commentHost, bodyNode],
    });
    assert.equal(getRateShortcutAction(event, commentHost), null, `${key} 不应触发快捷键`);
  }
});

test('对照：非输入状态下按 0 仍然重置倍速', () => {
  const event = keyEvent({
    key: '0',
    code: 'Digit0',
    target: bodyNode,
    composedPath: () => [bodyNode, bodyNode],
  });
  assert.deepEqual(getRateShortcutAction(event, bodyNode), { type: 'reset', value: 1 });
});

test('回归：在 shadow DOM 评论区按 R 不应触发“换一换”', () => {
  const location = { hostname: 'www.bilibili.com', pathname: '/' };
  const shadowEvent = keyEvent({
    key: 'r',
    code: 'KeyR',
    target: commentHost,
    composedPath: () => [editorInShadow, commentHost, bodyNode],
  });
  assert.equal(shouldHandleRollShortcut(shadowEvent, location, commentHost, true), false);

  const normalEvent = keyEvent({
    key: 'r',
    code: 'KeyR',
    target: bodyNode,
    composedPath: () => [bodyNode, bodyNode],
  });
  assert.equal(shouldHandleRollShortcut(normalEvent, location, bodyNode, true), true);
});

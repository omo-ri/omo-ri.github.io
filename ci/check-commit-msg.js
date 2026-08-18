#!/usr/bin/env node
'use strict';

/**
 * 提交信息规范检查（零依赖，CI 使用）
 *
 * 用法:
 *   node ci/check-commit-msg.js [base-ref] [head-ref]
 *
 * 检查范围:
 *   本仓库直推 main、没有 PR 流程，因此 CI 中传入 push 事件的
 *   github.event.before / github.event.after，只检查「本次 push 新带上来的提交」，
 *   历史上的不规范提交天然不在范围内。
 *
 *   以下三种情况降级为只检查 HEAD 一条：
 *     1. 未传参数（本地手动执行，通常只想验最新一条）
 *     2. base 为全零（该分支的首次推送，没有起点）
 *     3. base 对象在本地仓库中不存在（force push 后起点已被重写）
 *
 *   注意：CI checkout 必须设置 fetch-depth: 0，否则浅克隆里没有 base 对象，
 *   区间无法计算，检查会以「找不到起点」而非「提交不合规」的形式失败。
 *
 * 校验规则：Conventional Commits，只校验标题行的形状
 *   type 白名单强制执行；scope 只校验形状（小写字母/数字/连字符），不校验内容；
 *   Merge / Revert 提交不豁免，同样需要符合规范。
 */

const { execFileSync } = require('child_process');

const BASE = process.argv[2] || '';
const HEAD = process.argv[3] || 'HEAD';
const SUBJECT_RE = /^(feat|fix|refactor|perf|style|docs|chore|content|release)(\([a-z0-9-]+\))?(!)?: .+$/;

function git(args) {
  // stderr 走 pipe 而非继承，避免预期内的失败（如单提交仓库里的 HEAD~1）把
  // git 的原始报错漏到 CI 日志里
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** 判断一个 ref 是否是本地仓库中真实存在的提交对象 */
function commitExists(ref) {
  if (!ref || /^0+$/.test(ref)) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}^{commit}`], { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

function main() {
  const useRange = commitExists(BASE);
  const range = useRange ? `${BASE}..${HEAD}` : `${HEAD}~1..${HEAD}`;

  if (!useRange && BASE) {
    console.log(`起点 ${BASE} 不可用（首次推送或历史被重写），降级为只检查 ${HEAD} 一条。`);
  }

  let subjects;
  try {
    subjects = git(['log', '--format=%s', range])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (err) {
    // 仓库只有一个提交时 HEAD~1 不存在，退回到只读 HEAD 自身
    if (!useRange) {
      subjects = [git(['log', '-1', '--format=%s', HEAD])].filter(Boolean);
    } else {
      console.error(`无法获取 ${range} 的提交记录: ${err.message}`);
      console.error('若在 CI 中，请确认 actions/checkout 已设置 fetch-depth: 0。');
      process.exit(1);
    }
  }

  if (subjects.length === 0) {
    console.log('范围内无新增提交，提交信息检查通过。');
    return;
  }

  const bad = subjects.filter((s) => !SUBJECT_RE.test(s));
  if (bad.length > 0) {
    console.error(`以下提交不符合 Conventional Commits 规范（${bad.length}/${subjects.length}）:`);
    for (const s of bad) {
      console.error(`  - ${s}`);
    }
    console.error('');
    console.error('格式: <type>(<scope>): <description>');
    console.error('type ∈ feat|fix|refactor|perf|style|docs|chore|content|release');
    console.error('scope 可选，只允许小写字母、数字和连字符；内容自由，不做白名单校验。');
    console.error('合并提交同样需要符合规范：未 push 时可用 git commit --amend 改写标题。');
    console.error('完整规范见 AGENTS.md。');
    process.exit(1);
  }

  console.log(`提交信息检查通过（${subjects.length} 条）。`);
}

main();

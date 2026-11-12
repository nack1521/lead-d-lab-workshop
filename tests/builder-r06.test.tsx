import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const builder = readFileSync(join(import.meta.dir, '..', 'apps/web/src/builder.tsx'), 'utf8');
const css = readFileSync(join(import.meta.dir, '..', 'apps/web/src/styles.css'), 'utf8');
const r06 = css.slice(css.indexOf('/* WORKSHOP-BUILDER-02 R06'));

describe('WORKSHOP-BUILDER-02 R06 inline alignment and header parity', () => {
  test('room top header no longer renders an extra Rooms button', () => {
    expect(builder).not.toContain('onHome');
    expect(builder).toContain('aria-label="Breadcrumb"');
    expect(builder).toContain('className="back" onClick={onBack}>‹ Rooms');
    expect(builder).toContain("<Shell mode={mode} subtitle={readOnly ? 'Read-only room reports' : 'Workshop room'}>");
  });

  test('breadcrumb segments share an inline centerline without centering the row', () => {
    expect(r06).toContain('.breadcrumb {\n  align-items: center;');
    expect(r06).toContain('.breadcrumb .link,\n.breadcrumb span {');
    expect(r06).toContain('line-height: 1;');
    expect(r06).toContain('min-height: 24px;');
    const breadcrumbRule = r06.slice(r06.indexOf('.breadcrumb {'), r06.indexOf('}', r06.indexOf('.breadcrumb {')) + 1);
    expect(breadcrumbRule).not.toContain('justify-content: center');
  });

  test('Results label and question buttons share a row centerline', () => {
    expect(r06).toContain('.report-nav > .muted {');
    expect(r06).toContain('.report-nav .ghost {');
    expect(r06).toContain('display: inline-flex;');
    expect(r06).toContain('align-items: center;');
    expect(r06).toContain('min-height: 32px;');
  });

  test('Add question label aligns with the three type buttons', () => {
    expect(r06).toContain('.types-label {');
    expect(r06).toContain('.type-button {');
    expect(r06).toContain('min-height: 44px;');
    expect(r06).toContain('justify-content: center;');
    expect(r06).toContain('line-height: 1;');
  });

  test('Home header structure remains the shared Shell without layout changes', () => {
    expect(builder).toContain('className="topbar"');
    expect(builder).toContain('brand-logo');
    expect(css).toContain('.topbar {');
    // R06 must not alter the frozen Home topbar.
    expect(r06).not.toMatch(/^\.topbar \{/m);
  });
});

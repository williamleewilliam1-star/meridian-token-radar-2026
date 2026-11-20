import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('detail dialog confines Tab and restores focus after Escape or route changes', () => {
  const listeners: Record<string, (event: any) => void> = {};
  const row = {
    slug: 'sample', name: 'Sample', rank: 1, chains: ['Ethereum'], category: 'Yield',
    confidence: 'Higher', tvl_usd: 1000, change_7d: 2, age_days: 100,
    implied_value_usd: 2000, value_low_usd: 1000, value_high_usd: 3000,
    token_status: 'No token recorded', farm_steps: Array(5).fill('Check official terms before acting.'),
    model: { category_median: 2, peer_count: 3, baseline_ratio: 2, momentum_factor: 1,
      maturity_factor: 1, breadth_factor: 1, confidence_factor: 1, formula: 'TVL × peers', global_median: 2 },
  };
  const document: any = { activeElement: null, addEventListener: (type: string, fn: any) => { listeners[type] = fn; } };
  const element = (props: Record<string, any> = {}) => ({ ...props,
    focus() { document.activeElement = this; },
    matches(selector: string) { return selector === '[data-slug]' && !!this.dataset?.slug; },
  });
  const app: any = { addEventListener: (type: string, fn: any) => { listeners['app:' + type] = fn; } };
  let current: Record<string, any> = {};
  Object.defineProperty(app, 'innerHTML', { set(html: string) {
    const close = element({ id: 'close' });
    const plan = element({ id: 'tab-plan' });
    const model = element({ id: 'tab-model' });
    const rowElement = html.includes('data-slug="sample"') ? element({ dataset: { slug: 'sample' } }) : null;
    const dialog = html.includes('role="dialog"') ? {
      contains: (node: any) => [close, plan, model].includes(node),
      querySelectorAll: () => [close, html.includes('id="tab-plan" type="button" role="tab" data-tab="plan" aria-selected="true"') ? plan : model],
    } : null;
    current = { close, plan, model, row: rowElement, dialog,
      search: element({ id: 'search' }), side: element(), main: element() };
  } });
  app.querySelectorAll = (selector: string) => selector === '[data-slug]'
    ? (current.row ? [current.row] : []) : [current.side, current.main];
  app.querySelector = (selector: string) => selector === '[role="dialog"]' ? current.dialog : null;
  document.getElementById = (id: string) => id === 'app' ? app : current[id.replace('tab-', '')] || current[id];
  const location = { hash: '', pathname: '/index.html' };
  const history = { replaceState(_state: any, _title: string, url: string) { location.hash = url.slice(url.indexOf('#')); } };
  const window = { MERIDIAN: { rows: [row], as_of: '2026-11-20', watchlist_size: 40, comparable_count: 3, global_ratio: 2 },
    addEventListener: (type: string, fn: any) => { listeners[type] = fn; } };
  runInNewContext(readFileSync(new URL('../dashboard/app.js', import.meta.url), 'utf8'),
    { window, document, location, history, URLSearchParams });

  const key = (name: string, target: any, shiftKey = false) => {
    let prevented = false;
    listeners.keydown({ key: name, target, shiftKey, preventDefault() { prevented = true; } });
    return prevented;
  };
  assert.equal(key(' ', current.row), true);
  assert.equal(document.activeElement, current.plan);
  assert.equal(current.side.inert, true);
  assert.equal(current.main.inert, true);
  assert.equal(key('Tab', current.plan), true);
  assert.equal(document.activeElement, current.close);
  assert.equal(key('Tab', current.close, true), true);
  assert.equal(document.activeElement, current.plan);
  assert.equal(key('Escape', current.plan), true);
  assert.equal(document.activeElement, current.row);
  assert.equal(current.side.inert, false);

  key('Enter', current.row);
  location.hash = '#chain=Other';
  listeners.hashchange({});
  assert.equal(document.activeElement, current.search);
});

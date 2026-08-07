/**
 * ChooseVS Embeddable Comparison Widget
 *
 * Usage:
 *   <script src="https://choosevs.com/vs-embed.js" data-compare="iphone-vs-samsung"><\/script>
 *
 * Optional attributes:
 *   data-height="900"        Initial iframe height in px (default 800)
 *   data-theme="light|dark"  Colour theme hint (default light)
 *   data-width="100%"        Container width (default 100%)
 *   data-target="#el"        CSS selector to render into instead of inline
 */
(function () {
  'use strict';

  var ORIGIN = 'https://choosevs.com';
  var DEFAULT_HEIGHT = 800;

  function currentScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('vs-embed.js') !== -1) return scripts[i];
    }
    return null;
  }

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function resolveSlug(script) {
    var compare = script.getAttribute('data-compare');
    if (compare) return slugify(compare);

    var a = script.getAttribute('data-a');
    var b = script.getAttribute('data-b');
    if (a && b) return slugify(a) + '-vs-' + slugify(b);

    return null;
  }

  function buildContainer(script, slug) {
    var width = script.getAttribute('data-width') || '100%';
    var height = parseInt(script.getAttribute('data-height'), 10) || DEFAULT_HEIGHT;
    var theme = script.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

    var wrapper = document.createElement('div');
    wrapper.className = 'choosevs-embed';
    wrapper.setAttribute('data-choosevs-slug', slug);
    wrapper.style.cssText = [
      'width:' + width,
      'max-width:100%',
      'margin:24px auto',
      'border:1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'),
      'border-radius:16px',
      'overflow:hidden',
      'background:' + (theme === 'dark' ? '#0f172a' : '#ffffff'),
      'box-shadow:0 4px 16px rgba(15,23,42,0.08)',
      'font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif'
    ].join(';');

    var iframe = document.createElement('iframe');
    iframe.src = ORIGIN + '/compare/' + slug + '?embed=1&theme=' + theme;
    iframe.title = 'ChooseVS comparison: ' + slug.replace(/-/g, ' ');
    iframe.loading = 'lazy';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.style.cssText = 'display:block;width:100%;height:' + height + 'px;border:0;';

    var footer = document.createElement('div');
    footer.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'gap:8px',
      'padding:10px 14px',
      'font-size:12px',
      'border-top:1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'),
      'background:' + (theme === 'dark' ? '#020617' : '#f8fafc'),
      'color:' + (theme === 'dark' ? '#94a3b8' : '#64748b')
    ].join(';');

    var brand = document.createElement('span');
    brand.textContent = 'Comparison powered by ChooseVS';

    var link = document.createElement('a');
    link.href = ORIGIN + '/compare/' + slug;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'View full comparison →';
    link.style.cssText = 'color:#2563eb;text-decoration:none;font-weight:600;';

    footer.appendChild(brand);
    footer.appendChild(link);
    wrapper.appendChild(iframe);
    wrapper.appendChild(footer);

    return wrapper;
  }

  function renderError(script, message) {
    var box = document.createElement('div');
    box.style.cssText = 'padding:16px;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;font-size:14px;font-family:Inter,system-ui,sans-serif;';
    box.textContent = 'ChooseVS embed: ' + message;
    if (script && script.parentNode) script.parentNode.insertBefore(box, script);
  }

  function mount(script) {
    if (script.getAttribute('data-choosevs-mounted') === 'true') return;
    script.setAttribute('data-choosevs-mounted', 'true');

    var slug = resolveSlug(script);
    if (!slug) {
      renderError(script, 'missing data-compare attribute (e.g. data-compare="iphone-vs-samsung").');
      return;
    }

    var container = buildContainer(script, slug);
    var targetSelector = script.getAttribute('data-target');
    var target = targetSelector ? document.querySelector(targetSelector) : null;

    if (target) target.appendChild(container);
    else if (script.parentNode) script.parentNode.insertBefore(container, script);
    else document.body.appendChild(container);
  }

  // Resize messages from the embedded page
  window.addEventListener('message', function (event) {
    if (event.origin !== ORIGIN) return;
    var data = event.data;
    if (!data || data.type !== 'choosevs:resize' || !data.slug || !data.height) return;

    var frames = document.querySelectorAll('[data-choosevs-slug="' + data.slug + '"] iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].style.height = parseInt(data.height, 10) + 'px';
    }
  });

  var script = currentScript();
  if (!script) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(script); });
  } else {
    mount(script);
  }
})();

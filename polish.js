(() => {
  const data = window.ENS_HDR_DATA;
  if (!data) return;
  const applyGlyphs = () => document.querySelectorAll('.layer-row').forEach(row => {
    const name = row.querySelector('.layer-name')?.textContent;
    const layer = data.layers.find(item => item.name === name);
    const icon = row.querySelector('.layer-icon');
    if (layer && icon) {
      icon.replaceChildren(document.createTextNode(layer.emoji || '✦'));
      icon.setAttribute('aria-label', layer.name);
    }
  });
  applyGlyphs();
  const groups = document.querySelector('#groups');
  if (groups) new MutationObserver(applyGlyphs).observe(groups, { childList: true, subtree: true });
})();

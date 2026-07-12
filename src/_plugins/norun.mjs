/**
 * markdown-it plugin: <!-- norun --> comment before a fence block
 * wraps the rendered <pre> element in <div data-norun>.
 *
 * Usage in Markdown:
 *   <!-- norun -->
 *
 *   ```python
 *   pip install requests
 *   ```
 */
export default function norunPlugin(md) {
  md.core.ruler.push('norun', function (state) {
    const tokens = state.tokens;
    let marked = false;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.type === 'html_block' && /<!--\s*norun\s*-->/.test(t.content)) {
        t.content = '';
        marked = true;
        continue;
      }

      if (marked && t.type === 'fence') {
        const map = t.map ? [t.map[0], t.map[0] + 1] : null;

        const open = new state.Token('html_block', '', 0);
        open.content = '<div data-norun>\n';
        open.map = map;

        const close = new state.Token('html_block', '', 0);
        close.content = '</div>\n';
        close.map = map;

        tokens.splice(i + 1, 0, close);
        tokens.splice(i, 0, open);
        marked = false;
      } else if (t.type !== 'html_block' || t.content !== '') {
        marked = false;
      }
    }
  });
}

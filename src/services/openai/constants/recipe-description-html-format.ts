/** Instructions + example for react-quill compatible recipe steps HTML. */
export const RECIPE_DESCRIPTION_HTML_INSTRUCTIONS = `description must be cooking steps as HTML for react-quill (Ukrainian):
- One step per block: <p><strong>Крок N. </strong>Step text here.</p>
- Between steps add a spacer: <p><br></p>
- Use only tags: <p>, <strong>, <br> (no markdown, no <ul>/<li>, no headings).
- Write detailed steps (amounts, times, heat) when the source text allows it.
- Do not wrap the whole answer in a single <p>; split every step into its own block.

Example shape:
<p><strong>Крок 1. </strong>Очистьте овочі та наріжте їх.</p><p><br></p><p><strong>Крок 2. </strong>Зваріть у каструлі 25 хвилин.</p>`;

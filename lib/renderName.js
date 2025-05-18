// lib/renderName.js

const colorMap = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
};

/**
 * Turn a string like "§4Dark §6Gold §fText" into an array of
 * <span style={{ color }} key=...>chunks</span>
 */
export function renderNameWithColors(rawName) {
  const parts = rawName.split(/(§[0-9a-fA-F])/);
  let currentColor = colorMap['f']; // default white
  return parts.map((part, i) => {
    const m = /^§([0-9a-fA-F])$/.exec(part);
    if (m) {
      currentColor = colorMap[m[1].toLowerCase()] || currentColor;
      return null;
    }
    return (
      <span key={i} style={{ color: currentColor }}>
        {part}
      </span>
    );
  });
}

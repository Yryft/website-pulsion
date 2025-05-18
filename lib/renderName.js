import React from "react";

const colorMap = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
};

const mcPink = '#FF55FF';

/**
 * Turn a string like "§4Dark §6Gold §fText" into an array of
 * <span style={{ color }} key=...>chunks</span>,
 * OR render entire name in pink if id starts with ULTIMATE_
 *
 * @param {string} name - The pretty name (may contain § color codes)
 * @param {string} id - The item ID (used to detect Ultimate)
 */
export function renderNameWithColors(name, id) {
  if (id?.startsWith("ULTIMATE_")) {
    const plainName = name.replace(/§[0-9a-fA-F]/g, '');
    return <span style={{ color: mcPink }}>{plainName}</span>;
  }

  const parts = name.split(/(§[0-9a-fA-F])/g).filter(Boolean);
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

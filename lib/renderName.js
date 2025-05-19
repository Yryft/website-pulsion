const tailwindColorMap = {
  '0': 'text-black',
  '1': 'text-blue-900',
  '2': 'text-green-700',
  '3': 'text-cyan-700',
  '4': 'text-red-800',
  '5': 'text-purple-700',
  '6': 'text-yellow-600',
  '7': 'text-gray-500',
  '8': 'text-gray-700',
  '9': 'text-blue-600',
  'a': 'text-green-500',
  'b': 'text-cyan-400',
  'c': 'text-red-500',
  'd': 'text-pink-500',
  'e': 'text-yellow-400',
  'f': 'text-black dark:text-white', // 👈 support light + dark mode
};

export function renderNameWithColors(name, id) {
  if (id?.startsWith("ENCHANTMENT_ULTIMATE_")) {
    const plainName = name.replace(/§[0-9a-fA-F]/g, '');
    return <span className="text-pink-400">{plainName}</span>;
  }

  const parts = name.split(/(§[0-9a-fA-F])/g).filter(Boolean);
  let currentClass = tailwindColorMap['f']; // default

  return parts.map((part, i) => {
    const m = /^§([0-9a-fA-F])$/.exec(part);
    if (m) {
      currentClass = tailwindColorMap[m[1].toLowerCase()] || currentClass;
      return null;
    }

    return (
      <span key={i} className={currentClass}>
        {part}
      </span>
    );
  });
}

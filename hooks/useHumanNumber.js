import { useState } from 'react';

export function useHumanNumber(initial = 0) {
  // raw is the exact string in the input, value is the numeric interpretation
  const [raw, setRaw] = useState(initial.toLocaleString());
  const [value, setValue] = useState(initial);

  const parse = (input) => {
    // 1) remove commas & trim
    const cleaned = input.toLowerCase().replace(/,/g, '').trim();
    // 2) capture digits+dot, optional suffix k/m/b
    const m = cleaned.match(/^([\d.]+)\s*([kmb])?$/);
    if (!m) {
      // not a valid pattern → leave raw alone, zero out
      return { display: input, number: 0 };
    }

    const numberPart = parseFloat(m[1]);
    const suffix = m[2];
    // choose multiplier if suffix is present, else 1
    const multiplier = suffix
      ? { k: 1e3, m: 1e6, b: 1e9, }[suffix]
      : 1;
    const num = numberPart * multiplier;

    // If the user used a suffix, we’ll normalize on display (e.g. “1.5m” → “1,500,000”)
    // If no suffix, leave the raw string as‐typed (so typing “10000000” stays “10000000”)
    const display = suffix
      ? num.toLocaleString()
      : m[1];  

    return { display, number: num };
  };

  const onChange = (e) => {
    const { display, number } = parse(e.target.value);
    setRaw(display);
    setValue(number);
  };

  return { raw, value, onChange, setRaw, setValue };
}

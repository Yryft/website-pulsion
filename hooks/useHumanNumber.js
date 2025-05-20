import { useState } from 'react';

export function useHumanNumber(initial = 0) {
  // raw string shown in the input, numeric value parsed
  const [raw, setRaw] = useState(initial.toLocaleString());
  const [value, setValue] = useState(initial);

  // parse “10k”, “1.5m”, “2b”, or plain numbers
  const parse = (input) => {
    const cleaned = input.toLowerCase().replace(/,/g, '').trim();
    const m = cleaned.match(/^([\d.]+)\s*([kmb]?)$/);
    if (!m) return { display: input, number: 0 };
    const n = parseFloat(m[1]);
    const mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1;
    const num = n * mult;
    return { display: num.toLocaleString(), number: num };
  };

  const onChange = (e) => {
    const { display, number } = parse(e.target.value);
    setRaw(display);
    setValue(number);
  };

  return { raw, value, onChange, setRaw, setValue };
}

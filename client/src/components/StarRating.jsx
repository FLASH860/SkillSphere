import { useState } from 'react';

export default function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`text-2xl transition ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
            star <= (hover || value) ? 'text-amber' : 'text-text-muted'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}


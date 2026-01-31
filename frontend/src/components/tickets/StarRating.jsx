'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

export default function StarRating({ rating, onRatingChange, disabled = false }) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Star
                        className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

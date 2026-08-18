// src/components/common/RatingStars.jsx
import { Star, StarHalf } from 'lucide-react';

/**
 * Reusable component for rendering star ratings.
 * @param {number} rating - The rating value (0 to 5)
 * @param {number} size - The size of the stars (default 16)
 * @param {string} className - Additional CSS classes
 */
export default function RatingStars({ rating = 0, size = 16, color = "#fbbf24", className = "" }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starStyle = { color: color, fill: color };

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} size={size} style={starStyle} />
            ))}
            {hasHalfStar && (
                <div className="relative text-gray-200 fill-gray-200">
                    <Star size={size} />
                    <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                        <Star size={size} style={starStyle} />
                    </div>
                </div>
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} size={size} className="text-gray-200 fill-gray-200" />
            ))}
        </div>
    );
}

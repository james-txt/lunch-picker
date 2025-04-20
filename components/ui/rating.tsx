import { FaStar } from "react-icons/fa6";
import { twMerge } from "tailwind-merge";

interface RatingProps {
  rating?: number;
  maxStars?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

export function Rating({ 
  rating, 
  maxStars = 5, 
  size = 14, 
  className,
  showValue = false
}: RatingProps) {
  const stars = rating !== undefined ? rating : undefined;

  return (
    <div className={twMerge("flex items-center", className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          if (stars === undefined) return <FaStar key={i} className="text-neutral-400" size={size} />;
          
          const diff = stars - i;
          if (diff >= 1) {
            return <FaStar key={i} className="text-yellow-400" size={size} />;
          } else if (diff > 0 && diff < 1) {
            return (
              <div key={i} className="relative w-fit">
                <FaStar className="text-neutral-400 dark:text-neutral-300" size={size} />
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${diff * 100}%` }}>
                  <FaStar className="text-yellow-400" size={size} />
                </div>
              </div>
            );
          } else {
            return <FaStar key={i} className="text-neutral-400 dark:text-neutral-300" size={size} />;
          }
        })}
      </div>
      {showValue && rating !== undefined && (
        <span className="text-sm font-bold font-title ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export default Rating;
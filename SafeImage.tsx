import { useState } from "react";
import { cn } from "../utils/cn";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  seed: string | number;
  wrapperClassName?: string;
}

export default function SafeImage({ seed, className, wrapperClassName, alt = "", ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-panel2", wrapperClassName)}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-panel2">
          <div className="absolute inset-0 dot-grid opacity-40" />
        </div>
      )}
      <img
        {...rest}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (!failed) {
            setFailed(true);
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/cinenova${seed}/600/900`;
          }
        }}
        src={failed ? `https://picsum.photos/seed/cinenova${seed}/600/900` : rest.src}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded || failed ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}

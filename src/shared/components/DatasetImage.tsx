/**
 * DatasetImage Component
 * 
 * A flexible image component that supports:
 * - Web URLs (http/https)
 * - Windows paths (C:\path\to\image.jpg)
 * - Unix paths (/path/to/image.jpg)
 * - Relative paths with configurable base path
 * 
 * Usage:
 * ```tsx
 * // Basic usage with relative path
 * <DatasetImage src="characters/kasumi.png" alt="Kasumi" />
 * 
 * // Web URL
 * <DatasetImage src="https://example.com/image.jpg" alt="Example" />
 * 
 * // Windows path
 * <DatasetImage src="C:\Users\data\images\kasumi.png" alt="Kasumi" />
 * 
 * // Custom base path
 * <DatasetImage src="kasumi.png" basePath="/custom/images" alt="Kasumi" />
 * ```
 */

import { useState, useCallback, ImgHTMLAttributes } from 'react';
import { useImage } from '@/content/hooks/useImageLoader';

export interface DatasetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image source path (URL, Windows path, Unix path, or relative path) */
  src: string;
  /** Custom base path for relative images */
  basePath?: string;
  /** Fallback image when loading fails */
  fallback?: string;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Native loading attribute - defaults to 'lazy' for performance */
  loading?: 'lazy' | 'eager';
}

export function DatasetImage({
  src,
  basePath,
  fallback = '/placeholder.svg',
  showLoading = false,
  loadingComponent,
  errorComponent,
  alt = '',
  className = '',
  onError,
  onLoad,
  loading = 'lazy', // Default to lazy loading for performance
  ...props
}: DatasetImageProps) {
  const { src: resolvedSrc, isLoading, hasError } = useImage(src, {
    basePath,
    fallback,
    preload: showLoading,
  });

  const [imgError, setImgError] = useState(false);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImgError(true);
      onError?.(e);
    },
    [onError]
  );

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImgError(false);
      onLoad?.(e);
    },
    [onLoad]
  );

  // Show loading state
  if (showLoading && isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className={`animate-pulse bg-muted ${className}`} {...props}>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Show error state
  if (hasError || imgError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}

export default DatasetImage;

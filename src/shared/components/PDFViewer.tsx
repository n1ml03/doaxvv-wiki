import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X,
  Maximize2, Minimize2, RotateCw, PanelLeftClose, PanelLeft,
  Maximize, AlignHorizontalJustifyCenter, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFViewerProps {
  filePath: string;
  className?: string;
  initialPage?: number;
  isModal?: boolean;
  onClose?: () => void;
  title?: string;
  onLoadSuccess?: (numPages: number) => void;
}

type FitMode = 'custom' | 'fit-width' | 'fit-page';

const LoadingSpinner = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

const PDFViewer = ({
  filePath, className, initialPage = 1, isModal = false, onClose, title,
  onLoadSuccess: onLoadSuccessProp,
}: PDFViewerProps) => {
  const [viewState, setViewState] = useState({
    numPages: 0,
    pageNumber: initialPage,
    scale: 1.0,
    rotation: 0,
    isFullscreen: isModal,
    error: null as string | null,
    isLoading: true,
  });
  const [uiState, setUiState] = useState({
    showToolbar: true,
    showThumbnails: false,
    fitMode: 'custom' as FitMode,
  });
  const [pageInputValue, setPageInputValue] = useState(String(initialPage));
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageChangeIndicator, setPageChangeIndicator] = useState<'prev' | 'next' | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseOverToolbar = useRef(false);
  const pageDimensions = useRef({ width: 0, height: 0, ready: false });
  const lastScrollTime = useRef(0);
  const announceRef = useRef<HTMLDivElement>(null);

  const normalizedPath = useMemo(() => filePath.replace(/\\/g, '/'), [filePath]);
  const { numPages, pageNumber, scale, rotation, isFullscreen, error, isLoading } = viewState;
  const { showToolbar, showThumbnails, fitMode } = uiState;

  const announce = useCallback((message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
      setTimeout(() => { if (announceRef.current) announceRef.current.textContent = ''; }, 1000);
    }
  }, []);

  const resetToolbarTimeout = useCallback(() => {
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    setUiState(s => ({ ...s, showToolbar: true }));
    toolbarTimeoutRef.current = setTimeout(() => {
      if (!isMouseOverToolbar.current) setUiState(s => ({ ...s, showToolbar: false }));
    }, 3000);
  }, []);

  // Toolbar auto-hide
  useEffect(() => {
    resetToolbarTimeout();
    return () => { if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current); };
  }, [resetToolbarTimeout]);

  // Container size observer - using ResizeObserver for better performance
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width: width - 48, height: height - 48 });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Fit mode calculation
  useEffect(() => {
    if (fitMode === 'custom' || !pageDimensions.current.ready) return;
    const { width: pageW, height: pageH } = pageDimensions.current;
    const { width: containerW, height: containerH } = containerSize;
    if (!pageW || !pageH || !containerW || !containerH) return;

    const newScale = fitMode === 'fit-width'
      ? containerW / pageW
      : Math.min(containerW / pageW, containerH / pageH);
    setViewState(s => ({ ...s, scale: Math.max(0.5, Math.min(3, newScale)) }));
  }, [fitMode, containerSize]);

  const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setViewState(s => ({ ...s, numPages: pages, error: null, isLoading: false }));
    onLoadSuccessProp?.(pages);
    announce(`PDF loaded with ${pages} pages`);
  }, [onLoadSuccessProp, announce]);

  const onPageLoadSuccess = useCallback(({ width, height }: { width: number; height: number }) => {
    if (!pageDimensions.current.ready) {
      pageDimensions.current = { width: width / scale, height: height / scale, ready: true };
    }
  }, [scale]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages || 1));
    if (validPage !== pageNumber) {
      pageDimensions.current.ready = false;
      setViewState(s => ({ ...s, pageNumber: validPage }));
      setPageInputValue(String(validPage));
      announce(`Page ${validPage} of ${numPages}`);
    }
  }, [numPages, pageNumber, announce]);

  const handlePageInputSubmit = useCallback(() => {
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page)) goToPage(page);
    else setPageInputValue(String(pageNumber));
  }, [pageInputValue, goToPage, pageNumber]);

  // Scroll wheel navigation with reduced sensitivity
  const scrollAccumulator = useRef(0);
  const SCROLL_THRESHOLD = 150; // Accumulated scroll delta needed to trigger page change
  
  useEffect(() => {
    const container = contentRef.current;
    if (!container || numPages <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      // Reset accumulator if too much time passed
      if (now - lastScrollTime.current > 500) scrollAccumulator.current = 0;
      lastScrollTime.current = now;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

      // Accumulate scroll delta when at boundaries
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        scrollAccumulator.current += Math.abs(e.deltaY);
      } else {
        scrollAccumulator.current = 0;
        return;
      }

      // Only change page when threshold is reached
      if (scrollAccumulator.current < SCROLL_THRESHOLD) return;
      scrollAccumulator.current = 0;

      if (e.deltaY < 0 && isAtTop && pageNumber > 1) {
        goToPage(pageNumber - 1);
        setPageChangeIndicator('prev');
        requestAnimationFrame(() => {
          if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
        });
      } else if (e.deltaY > 0 && isAtBottom && pageNumber < numPages) {
        goToPage(pageNumber + 1);
        setPageChangeIndicator('next');
        requestAnimationFrame(() => {
          if (contentRef.current) contentRef.current.scrollTop = 0;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [numPages, pageNumber, goToPage]);

  // Auto-hide page change indicator
  useEffect(() => {
    if (!pageChangeIndicator) return;
    const timer = setTimeout(() => setPageChangeIndicator(null), 800);
    return () => clearTimeout(timer);
  }, [pageChangeIndicator]);

  const zoom = useCallback((delta: number) => {
    setUiState(s => ({ ...s, fitMode: 'custom' }));
    setViewState(s => ({ ...s, scale: Math.max(0.5, Math.min(3, s.scale + delta)) }));
  }, []);

  const toggleFit = useCallback((mode: FitMode) => {
    setUiState(s => ({ ...s, fitMode: s.fitMode === mode ? 'custom' : mode }));
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = normalizedPath;
    link.download = normalizedPath.split('/').pop() || 'document.pdf';
    link.click();
  }, [normalizedPath]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => goToPage(pageNumber - 1),
      ArrowUp: () => goToPage(pageNumber - 1),
      ArrowRight: () => goToPage(pageNumber + 1),
      ArrowDown: () => goToPage(pageNumber + 1),
      Escape: () => isFullscreen && onClose?.(),
      '+': () => zoom(0.25),
      '=': () => zoom(0.25),
      '-': () => zoom(-0.25),
      Home: () => goToPage(1),
      End: () => goToPage(numPages),
    };
    if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
  }, [pageNumber, isFullscreen, onClose, goToPage, numPages, zoom]);

  // Memoized thumbnail pages for performance
  const thumbnailPages = useMemo(() => 
    Array.from({ length: numPages }, (_, i) => i + 1),
  [numPages]);

  const progressWidth = useMemo(() => 
    numPages ? `${(pageNumber / numPages) * 100}%` : '0%',
  [pageNumber, numPages]);

  return (
    <div
      className={cn(
        'flex flex-col bg-background rounded-xl overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'border border-border/50 shadow-card',
        className
      )}
      onKeyDown={handleKeyDown}
      onMouseMove={resetToolbarTimeout}
      tabIndex={0}
      role="application"
      aria-label="PDF Viewer"
      aria-describedby="pdf-status"
    >
      <div ref={announceRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      <div id="pdf-status" className="sr-only">{`Viewing page ${pageNumber} of ${numPages}. Use arrow keys to navigate.`}</div>

      {/* Toolbar */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 bg-card/90 backdrop-blur-md border-b border-border/50 transition-all duration-300 relative z-[60]',
          showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        )}
        onMouseEnter={() => { isMouseOverToolbar.current = true; setUiState(s => ({ ...s, showToolbar: true })); }}
        onMouseLeave={() => { isMouseOverToolbar.current = false; resetToolbarTimeout(); }}
      >
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setUiState(s => ({ ...s, showThumbnails: !s.showThumbnails }))} className="h-8 w-8" aria-label="Toggle thumbnails" aria-pressed={showThumbnails}>
            {showThumbnails ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          {title && <span className="text-sm font-medium truncate max-w-[120px] hidden sm:block">{title}</span>}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="h-8 w-8" aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="text"
              value={pageInputValue}
              onChange={e => setPageInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePageInputSubmit()}
              onBlur={handlePageInputSubmit}
              className="w-12 h-7 text-center text-sm bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Current page"
            />
            <span className="text-muted-foreground">/ {numPages || '...'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages} className="h-8 w-8" aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => zoom(-0.25)} disabled={scale <= 0.5} className="h-8 w-8" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center" aria-label={`Zoom level ${Math.round(scale * 100)}%`}>{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => zoom(0.25)} disabled={scale >= 3} className="h-8 w-8" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
          <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
          <Button variant={fitMode === 'fit-width' ? 'secondary' : 'ghost'} size="icon" onClick={() => toggleFit('fit-width')} className="h-8 w-8 hidden sm:flex" title="Fit to width" aria-label="Fit to width" aria-pressed={fitMode === 'fit-width'}>
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button variant={fitMode === 'fit-page' ? 'secondary' : 'ghost'} size="icon" onClick={() => toggleFit('fit-page')} className="h-8 w-8 hidden sm:flex" title="Fit to page" aria-label="Fit to page" aria-pressed={fitMode === 'fit-page'}>
            <Maximize className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
          <Button variant="ghost" size="icon" onClick={() => setViewState(s => ({ ...s, rotation: (s.rotation + 90) % 360 }))} className="h-8 w-8" aria-label="Rotate"><RotateCw className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8" aria-label="Download"><Download className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setViewState(s => ({ ...s, isFullscreen: !s.isFullscreen }))} className="h-8 w-8" aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {isFullscreen && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 ml-1" aria-label="Close"><X className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Thumbnails Sidebar */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 z-10 bg-card/95 backdrop-blur-sm border-r border-border/50 overflow-y-auto transition-all duration-300',
          showThumbnails ? 'w-36 sm:w-44 opacity-100' : 'w-0 opacity-0 -translate-x-full'
        )} role="navigation" aria-label="Page thumbnails">
          {showThumbnails && numPages > 0 && (
            <div className="p-2 space-y-2">
              <Document file={normalizedPath} loading={null}>
                {thumbnailPages.map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      'w-full rounded-lg overflow-hidden transition-all relative',
                      pageNumber === page ? 'ring-2 ring-primary shadow-md' : 'hover:ring-2 hover:ring-primary/50 opacity-70 hover:opacity-100'
                    )}
                    aria-label={`Go to page ${page}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    <Page pageNumber={page} width={128} renderTextLayer={false} renderAnnotationLayer={false}
                      loading={<div className="h-40 bg-muted/50 animate-pulse flex items-center justify-center"><span className="text-xs text-muted-foreground">{page}</span></div>}
                    />
                    <div className={cn('absolute bottom-0 inset-x-0 py-1 text-xs font-medium text-center',
                      pageNumber === page ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white'
                    )}>{page}</div>
                  </button>
                ))}
              </Document>
            </div>
          )}
        </div>

        {/* PDF Content */}
        <div ref={contentRef} className={cn('w-full h-full overflow-auto flex items-start justify-center p-6', isFullscreen ? 'bg-muted/30' : 'bg-muted/20')}>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8" role="alert">
              <X className="h-12 w-12 text-destructive opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">Unable to load PDF</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{error}</p>
            </div>
          ) : (
            <Document
              file={normalizedPath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err: Error) => setViewState(s => ({ ...s, error: err.message || 'Failed to load PDF', isLoading: false }))}
              loading={<LoadingSpinner text="Loading PDF document..." />}
            >
              {isLoading ? (
                <LoadingSpinner text="Preparing document..." />
              ) : (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  onLoadSuccess={onPageLoadSuccess}
                  loading={<LoadingSpinner text={`Loading page ${pageNumber}...`} />}
                  className="shadow-lg rounded-lg overflow-hidden transition-transform duration-200 [&_.react-pdf__Page__textContent]:select-text"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              )}
            </Document>
          )}
        </div>

        {/* Page change indicator */}
        {pageChangeIndicator && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-20">
            <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              {pageChangeIndicator === 'prev' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Page {pageNumber} of {numPages}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
          <div className="h-full bg-primary/60 transition-all duration-300" style={{ width: progressWidth }} role="progressbar" aria-valuenow={pageNumber} aria-valuemin={1} aria-valuemax={numPages} />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

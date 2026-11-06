"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronIcon } from "@/components/icons";

type ArticleImageCarouselProps = {
  images: string[];
  onRemove?: (url: string) => void;
  removingUrl?: string | null;
};

export function ArticleImageCarousel({ images, onRemove, removingUrl }: ArticleImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(images.length);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const dragStart = useRef<number | null>(null);

  if (knownCount !== images.length) {
    setKnownCount(images.length);
    if (images.length > knownCount || index > images.length - 1) {
      setIndex(Math.max(0, images.length - 1));
    }
  }

  if (images.length === 0) return null;

  const active = Math.min(index, images.length - 1);
  const multiple = images.length > 1;
  const currentUrl = images[active];
  const removing = removingUrl === currentUrl;

  function go(next: number) {
    const count = images.length;
    setIndex((next + count) % count);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!multiple) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(active - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!multiple) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current == null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    if (delta <= -48) go(active + 1);
    else if (delta >= 48) go(active - 1);
  }

  const positionLabel = multiple ? `${active + 1} of ${images.length}` : "Hero image";

  return (
    <section
      className="article-carousel"
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label={multiple ? "Article images" : "Article image"}
      onKeyDown={onKeyDown}
    >
      <div
        className="article-carousel__frame"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        <div
          className="article-carousel__track"
          style={{ transform: `translate3d(${-active * 100}%, 0, 0)` }}
        >
          {images.map((src, slideIndex) => {
            const isActive = slideIndex === active;
            return (
              <div
                key={src}
                className="article-carousel__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`Image ${slideIndex + 1} of ${images.length}`}
                aria-hidden={!isActive}
              >
                {failed[src] ? (
                  <p className="article-carousel__missing">This image could not be loaded.</p>
                ) : (
                  // Uploaded files and pasted https links are not in next/image remote patterns.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={slideIndex === 0 ? "Article hero" : `Article image ${slideIndex + 1}`}
                    width={1200}
                    height={675}
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={slideIndex === 0 ? "high" : "auto"}
                    draggable={false}
                    onError={() => setFailed((current) => ({ ...current, [src]: true }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {multiple || onRemove ? (
        <div className="article-carousel__bar">
          {multiple ? (
            <button type="button" className="btn btn--sm article-carousel__nav" onClick={() => go(active - 1)}>
              <span className="article-carousel__chevron article-carousel__chevron--back" aria-hidden="true">
                <ChevronIcon />
              </span>
              Previous
            </button>
          ) : (
            <span />
          )}
          <p className="article-carousel__count" aria-live="polite">
            {positionLabel}
          </p>
          {multiple ? (
            <button
              type="button"
              className="btn btn--sm article-carousel__nav article-carousel__nav--next"
              onClick={() => go(active + 1)}
            >
              Next
              <span className="article-carousel__chevron" aria-hidden="true">
                <ChevronIcon />
              </span>
            </button>
          ) : (
            <span />
          )}
        </div>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          className="btn btn--sm btn--ghost article-carousel__remove"
          disabled={removing}
          onClick={() => onRemove(currentUrl)}
        >
          {removing ? "Removing…" : active === 0 ? "Remove hero image" : "Remove this image"}
        </button>
      ) : null}
    </section>
  );
}

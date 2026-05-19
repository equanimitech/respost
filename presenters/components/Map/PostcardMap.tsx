"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatDistanceToNowStrict, type Locale as DateLocale } from "date-fns";
import { enUS, ptBR, es, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import type { PostcardMarker } from "@/domain/types";
import type { Locale as AppLocale } from "@/i18n/locales";

const DATE_LOCALES: Record<AppLocale, DateLocale> = {
  en: enUS,
  pt: ptBR,
  es,
  fr,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type PostcardMapProps = {
  markers: PostcardMarker[];
  hrefBase?: string;
};

/**
 * The main map view. This IS the feed.
 * No scroll. No timeline. Just geography with dots.
 */
export function PostcardMap({ markers, hrefBase = "/p" }: PostcardMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const t = useTranslations("map");
  const locale = useLocale() as AppLocale;
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const popupFallback = t("popupFallback");
  const viewLabel = t("viewPostcard");

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [0, 20],
      zoom: 2,
    });

    mapRef.current = map;

    // Center on user's location
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    });
    map.addControl(geolocate);

    // Trigger geolocation once the map loads (before adding markers)
    map.on("load", () => {
      if (markers.length === 0) {
        geolocate.trigger();
      }
      // Add markers for each postcard
      for (const marker of markers) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "postcard-marker";
        el.setAttribute(
          "aria-label",
          `Postcard${marker.title ? ": " + marker.title : ""}`,
        );
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.padding = "0";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#e07a5f";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.25)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });
        el.addEventListener("focus", () => {
          el.style.outline = "2px solid #4a6378";
          el.style.outlineOffset = "2px";
        });
        el.addEventListener("blur", () => {
          el.style.outline = "none";
        });

        const ageMs = Date.now() - marker.createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const opacity = Math.max(0.3, 1 - ageDays / 30);
        el.style.opacity = String(opacity);

        const title = marker.title ? escapeHtml(marker.title) : popupFallback;
        const brief = marker.brief ? escapeHtml(marker.brief) : "";
        const place = marker.place ? escapeHtml(marker.place) : "";
        const ago = formatDistanceToNowStrict(marker.createdAt, {
          addSuffix: true,
          locale: dateLocale,
        });
        const meta = [place, ago].filter(Boolean).join(" · ");

        const popup = new maplibregl.Popup({ offset: 12, maxWidth: "260px" })
          .setHTML(
            `<div style="font-family: system-ui; padding: 4px; max-width: 240px;">
              <p style="margin: 0; font-size: 13px; font-weight: 500; line-height: 1.25;">${title}</p>
              ${brief ? `<p style="margin: 4px 0 0; font-size: 12px; color: #444; line-height: 1.35;">${brief}</p>` : ""}
              <p style="margin: 6px 0 0; font-size: 10px; color: #888; letter-spacing: 0.6px; text-transform: uppercase;">${meta}</p>
              <a href="${hrefBase}/${marker.id}" style="display: inline-block; margin-top: 6px; font-size: 11px; color: #b8634a;">
                ${escapeHtml(viewLabel)}
              </a>
            </div>`
          );

        new maplibregl.Marker({ element: el })
          .setLngLat([marker.longitude, marker.latitude])
          .setPopup(popup)
          .addTo(map);
      }

      // Fit bounds to markers if we have any
      if (markers.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const m of markers) {
          bounds.extend([m.longitude, m.latitude]);
        }
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers, hrefBase, popupFallback, viewLabel, dateLocale]);

  return (
    <div
      ref={mapContainer}
      role="region"
      aria-label="Map of postcards"
      className="h-full w-full"
    />
  );
}

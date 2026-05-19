"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PostcardMarker } from "@/domain/types";

type PostcardMapProps = {
  markers: PostcardMarker[];
};

/**
 * The main map view. This IS the feed.
 * No scroll. No timeline. Just geography with dots.
 */
export function PostcardMap({ markers }: PostcardMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

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
        const el = document.createElement("div");
        el.className = "postcard-marker";
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#e07a5f";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";

        // Fade based on age — newer = brighter
        const ageMs = Date.now() - marker.createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const opacity = Math.max(0.3, 1 - ageDays / 30); // fade over 30 days
        el.style.opacity = String(opacity);

        const popup = new maplibregl.Popup({ offset: 12 })
          .setHTML(
            `<div style="font-family: system-ui; padding: 4px;">
              <p style="margin: 0; font-size: 13px; font-weight: 500;">Postcard</p>
              <p style="margin: 2px 0 0; font-size: 11px; color: #666;">
                ${marker.createdAt.toLocaleDateString()}
              </p>
              <a href="/p/${marker.id}" style="font-size: 11px; color: #b8634a;">
                View postcard →
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
  }, [markers]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}

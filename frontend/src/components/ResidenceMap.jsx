import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const defaultCenter = [31.4117, 34.6753];

const townCoordinates = {
  אשדוד: { lat: 31.8014, lng: 34.6435 },
  אשקלון: { lat: 31.6688, lng: 34.5743 },
  "באר שבע": { lat: 31.252, lng: 34.7915 },
  "גן יבנה": { lat: 31.7889, lng: 34.7066 },
  יבנה: { lat: 31.8781, lng: 34.7398 },
  רחובות: { lat: 31.8948, lng: 34.8113 },
  "ראשון לציון": { lat: 31.973, lng: 34.7925 },
  "נס ציונה": { lat: 31.9307, lng: 34.7987 },
  "קריית גת": { lat: 31.61, lng: 34.7642 },
  "קריית מלאכי": { lat: 31.7306, lng: 34.7468 },
  "תל אביב": { lat: 32.0853, lng: 34.7818 },
  חולון: { lat: 32.0158, lng: 34.7874 },
  "בת ים": { lat: 32.0231, lng: 34.7503 },
  רמלה: { lat: 31.9316, lng: 34.8656 },
  לוד: { lat: 31.951, lng: 34.8881 },
  נהריה: { lat: 33.0059, lng: 35.0941 },
};

function createDivIcon(isActive) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${isActive ? 26 : 22}px;
        height: ${isActive ? 26 : 22}px;
        border-radius: 9999px;
        background: ${isActive ? "#38bdf8" : "#60a5fa"};
        border: 3px solid white;
        box-shadow: 0 10px 22px rgba(0,0,0,0.35);
        transform: translate(-50%, -50%);
      "></div>
    `,
    iconSize: [isActive ? 26 : 22, isActive ? 26 : 22],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

function MapAutoFocus({ points, activeTown }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const activePoint = points.find((point) => point.town === activeTown);

    if (activePoint) {
      map.setView([activePoint.lat, activePoint.lng], 10, {
        animate: true,
      });
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(
      points.map((point) => [point.lat, point.lng])
    );

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 10,
    });
  }, [map, points, activeTown]);

  return null;
}

export default function ResidenceMap({ points = [], activeTown, onSelectTown }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const enrichedPoints = useMemo(() => {
    return points
      .map((point) => {
        const coords = townCoordinates[point.town];

        if (!coords) return null;

        return {
          ...point,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter(Boolean);
  }, [points]);

  useEffect(() => {
    if (!selectedPoint) return;

    const stillExists = enrichedPoints.some(
      (point) => point.town === selectedPoint.town
    );

    if (!stillExists) {
      setSelectedPoint(null);
    }
  }, [enrichedPoints, selectedPoint]);

  if (!enrichedPoints.length) {
    return (
      <div className="flex h-[650px] items-center justify-center rounded-2xl bg-[#2e3038] text-center text-white/70 ring-1 ring-white/10">
        <div>
          <div className="text-lg font-bold text-white">אין נתוני מפה להצגה</div>
          <div className="mt-2 text-sm">
            לא נמצאו קואורדינטות עבור היישובים שנבחרו.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="residence-map-wrapper overflow-hidden rounded-[24px]">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        scrollWheelZoom
        attributionControl={false}
        style={{
          width: "100%",
          height: "650px",
          borderRadius: "24px",
        }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoFocus points={enrichedPoints} activeTown={activeTown} />

        {enrichedPoints.map((point) => {
          const isActive = point.town === activeTown;

          return (
            <Marker
              key={point.town}
              position={[point.lat, point.lng]}
              icon={createDivIcon(isActive)}
              eventHandlers={{
                click: () => {
                  setSelectedPoint(point);
                  onSelectTown?.(point.town);
                },
              }}
            >
              <Popup>
                <div
                  style={{
                    minWidth: 120,
                    direction: "rtl",
                    textAlign: "right",
                    color: "#111827",
                    fontFamily: "Arial, sans-serif",
                    lineHeight: 1.6,
                    padding: "4px 2px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "16px",
                      marginBottom: "6px",
                    }}
                  >
                    {point.town}
                  </div>

                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>מספר נרשמים:</strong> {point.count}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
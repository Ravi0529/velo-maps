import { useEffect, useRef } from "react";
import { socket } from "./socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const markers = new Map<string, L.Marker>();

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const map = L.map("map").setView([20.5937, 78.9629], 5);
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    socket.on("server:location:update", (data) => {
      const { userId, latitude, longitude } = data;

      if (!markers.has(userId)) {
        const marker = L.marker([latitude, longitude])
          .addTo(mapRef.current!)
          .bindPopup(userId);

        markers.set(userId, marker);
      } else {
        markers.get(userId)!.setLatLng([latitude, longitude]);
      }
    });

    return () => {
      socket.off("server:location:update");
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit("client:location:update", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return <div id="map" className="h-screen w-full" />;
}

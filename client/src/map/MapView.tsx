import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markers = new Map<string, L.Marker>();
const paths = new Map<string, L.Polyline>();
const lastPositions = new Map<string, [number, number]>();

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const myUserId = localStorage.getItem("userId");

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

  const createAvatarIcon = (user: any) => {
    const avatarUrl =
      user.avatar ||
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name);

    return L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%)">
          <img 
            src="${avatarUrl}" 
            style="width:40px;height:40px;border-radius:50%;border:2px solid white;object-fit:cover"
          />
          <span style="font-size:12px;color:black;background:white;padding:2px 6px;border-radius:6px;margin-top:2px;white-space:nowrap">
            ${user.name}
          </span>
        </div>
      `,
      className: "",
      iconSize: [50, 60],
      iconAnchor: [25, 60],
    });
  };

  const animateMarker = (
    marker: L.Marker,
    from: [number, number],
    to: [number, number],
  ) => {
    const duration = 1000;
    const start = performance.now();

    function animate(time: number) {
      const t = Math.min((time - start) / duration, 1);

      const lat = from[0] + (to[0] - from[0]) * t;
      const lng = from[1] + (to[1] - from[1]) * t;

      marker.setLatLng([lat, lng]);

      if (t < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    socket.on("server:location:update", (data) => {
      const { userId, latitude, longitude, name, avatar, timestamp } = data;

      const latlng: [number, number] = [latitude, longitude];
      const prev = lastPositions.get(userId);

      if (!markers.has(userId)) {
        const marker = L.marker(latlng, {
          icon: createAvatarIcon({ name, avatar }),
        }).addTo(mapRef.current!);

        marker.bindPopup("");

        markers.set(userId, marker);
      } else {
        const marker = markers.get(userId)!;

        if (prev) {
          animateMarker(marker, prev, latlng);
        } else {
          marker.setLatLng(latlng);
        }

        marker.setIcon(createAvatarIcon({ name, avatar }));
      }

      lastPositions.set(userId, latlng);

      if (!paths.has(userId)) {
        const polyline = L.polyline([latlng], {
          weight: 4,
          opacity: 0.7,
        }).addTo(mapRef.current!);

        paths.set(userId, polyline);
      } else {
        const polyline = paths.get(userId)!;
        polyline.addLatLng(latlng);

        const latlngs = polyline.getLatLngs() as L.LatLng[];
        if (latlngs.length > 20) {
          latlngs.shift();
          polyline.setLatLngs(latlngs);
        }
      }

      const marker = markers.get(userId)!;
      const lastSeenText = new Date(timestamp).toLocaleTimeString();

      marker.setPopupContent(`
        <div style="text-align:center">
          <b>${name}</b><br/>
          Last update: ${lastSeenText}
        </div>
      `);

      if (userId === myUserId) {
        mapRef.current?.setView(latlng, 15);
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

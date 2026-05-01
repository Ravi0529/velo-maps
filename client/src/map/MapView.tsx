import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markers = new Map<string, L.Marker>();
const paths = new Map<string, L.Polyline>();

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

  useEffect(() => {
    socket.on("server:location:update", (data) => {
      const { userId, latitude, longitude, name, avatar } = data;

      console.log("AVATAR", avatar);

      const latlng: [number, number] = [latitude, longitude];

      if (!markers.has(userId)) {
        const marker = L.marker(latlng, {
          icon: createAvatarIcon({ name, avatar }),
        }).addTo(mapRef.current!);

        markers.set(userId, marker);
      } else {
        const marker = markers.get(userId)!;
        marker.setLatLng(latlng);
        marker.setIcon(createAvatarIcon({ name, avatar }));
      }

      if (!paths.has(userId)) {
        const polyline = L.polyline([latlng], {
          weight: 4,
        }).addTo(mapRef.current!);

        paths.set(userId, polyline);
      } else {
        const polyline = paths.get(userId)!;
        polyline.addLatLng(latlng);
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

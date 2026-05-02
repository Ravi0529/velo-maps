import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { socket } from "../lib/socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markers = new Map<string, L.Marker>();
const paths = new Map<string, L.Polyline>();
const lastPositions = new Map<string, [number, number]>();
const userStatus = new Map<string, "online" | "offline">();
const userMeta = new Map<string, { name: string; avatar: string | null }>();

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const storedUser = localStorage.getItem("user");
  const myUserId = storedUser ? JSON.parse(storedUser).id : null;
  const hasCentered = useRef(false);

  function handleLogout() {
    socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.reload();
  }

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
    socket.on("server:users:init", (users) => {
      users.forEach((user: any) => {
        if (!user.latitude || !user.longitude) return;

        const latlng: [number, number] = [user.latitude, user.longitude];

        userStatus.set(user.id, "offline");
        userMeta.set(user.id, {
          name: user.name,
          avatar: user.avatar ?? null,
        });

        if (!markers.has(user.id)) {
          const marker = L.marker(latlng, {
            icon: createAvatarIcon(user, "offline"),
          }).addTo(mapRef.current!);

          marker.bindPopup(`
          <div style="text-align:center">
            <b>${user.name}</b><br/>
            Last seen: ${
              user.updatedAt
                ? new Date(user.updatedAt).toLocaleTimeString()
                : "N/A"
            }
          </div>
        `);

          markers.set(user.id, marker);
          lastPositions.set(user.id, latlng);
        }
      });
    });

    return () => {
      socket.off("server:users:init");
    };
  }, []);

  const createAvatarIcon = (user: any, status: "online" | "offline") => {
    const avatarUrl =
      user.avatar ||
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name);
    const dotColor = status === "online" ? "#22c55e" : "#ef4444";

    return L.divIcon({
      html: `
        <div style="position:relative;width:64px;height:64px;">
          <img 
            src="${avatarUrl}" 
            style="
              width:40px;
              height:40px;
              border-radius:50%;
              border:2px solid white;
              object-fit:cover;
              transform: translate(-50%, -100%);
              position:absolute;
              left:50%;
              top:10px;
            "
          />
          <span style="
            position:absolute;
            left:calc(50% + 10px);
            top:-2px;
            width:12px;
            height:12px;
            border-radius:999px;
            background:${dotColor};
            border:2px solid white;
            box-shadow:0 0 0 1px rgba(15,23,42,0.15);
            z-index:2;
          "></span>
          <span style="
            position:absolute;
            top:16px;
            left:50%;
            transform:translateX(-50%);
            font-size:12px;
            color:black;
            background:white;
            padding:2px 6px;
            border-radius:6px;
            white-space:nowrap;
          ">
            ${user.name.split(" ")[0]}
          </span>
        </div>
      `,
      className: "",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
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
      const progress = Math.min((time - start) / duration, 1);

      const t =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = from[0] + (to[0] - from[0]) * t;
      const lng = from[1] + (to[1] - from[1]) * t;

      marker.setLatLng([lat, lng]);

      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    socket.on("server:location:update", (data) => {
      const { userId, latitude, longitude, name, avatar, timestamp } = data;

      const latlng: [number, number] = [latitude, longitude];
      const prev = lastPositions.get(userId);

      userStatus.set(userId, "online");
      userMeta.set(userId, { name, avatar: avatar ?? null });

      if (!markers.has(userId)) {
        const marker = L.marker(latlng, {
          icon: createAvatarIcon({ name, avatar }, "online"),
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

        const status = userStatus.get(userId) || "online";
        marker.setIcon(createAvatarIcon({ name, avatar }, status));
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

      if (userId === myUserId && !hasCentered.current) {
        mapRef.current?.setView(latlng, 15);
        hasCentered.current = true;
      }
    });

    return () => {
      socket.off("server:location:update");
    };
  }, []);

  useEffect(() => {
    socket.on("server:user:inactive", ({ userId }) => {
      userStatus.set(userId, "offline");

      const marker = markers.get(userId);
      if (marker) {
        const meta = userMeta.get(userId) ?? { name: "User", avatar: null };
        marker.setIcon(createAvatarIcon(meta, "offline"));
      }
    });

    return () => {
      socket.off("server:user:inactive");
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

  return (
    <div className="h-screen w-full bg-slate-100 p-3 sm:p-4">
      <div className="relative h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
        <div className="pointer-events-none absolute left-4 top-4 z-500 rounded-2xl border border-white/90 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Live map
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Active locations update in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="absolute right-4 top-4 z-500 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg transition hover:border-slate-300 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>

        <div id="map" className="h-full w-full" />
      </div>
    </div>
  );
}

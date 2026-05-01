import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { socket } from "../lib/socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markers = new Map<string, L.Marker>();
const paths = new Map<string, L.Polyline>();
const lastPositions = new Map<string, [number, number]>();

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const storedUser = localStorage.getItem("user");
  const myUserId = storedUser ? JSON.parse(storedUser).id : null;

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

  const createAvatarIcon = (user: any) => {
    const avatarUrl =
      user.avatar ||
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name);

    return L.divIcon({
      html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center">
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
          top:0;
        "
      />
      <span style="
        position:absolute;
        top:2px;
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

  // const getHeading = (from: [number, number], to: [number, number]) => {
  //   const dy = to[0] - from[0];
  //   const dx = to[1] - from[1];
  //   return (Math.atan2(dx, dy) * 180) / Math.PI;
  // };

  const animateMarker = (
    marker: L.Marker,
    from: [number, number],
    to: [number, number],
  ) => {
    const duration = 1000;
    const start = performance.now();
    // const heading = getHeading(from, to);

    function animate(time: number) {
      const progress = Math.min((time - start) / duration, 1);

      const t =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = from[0] + (to[0] - from[0]) * t;
      const lng = from[1] + (to[1] - from[1]) * t;

      marker.setLatLng([lat, lng]);

      // rotate avatar
      // const el = marker.getElement();
      // if (el) {
      //   const img = el.querySelector("img");
      //   if (img) {
      //     img.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
      //   }
      // }

      if (progress < 1) requestAnimationFrame(animate);
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

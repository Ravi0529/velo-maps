import { Globe, Route, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

declare global {
  interface Window {
    google: any;
  }
}

type CommunityUser = {
  id: string;
  name: string;
  avatar: string;
  lastSeen: string | null;
  createdAt: string;
};

export default function GoogleLogin() {
  const [communityUsers, setCommunityUsers] = useState<CommunityUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        width: 260,
      },
    );
  }, []);

  useEffect(() => {
    async function loadCommunity() {
      try {
        const response = await api.get("/api/auth/community");
        setCommunityUsers(response.data.users ?? []);
      } catch (error) {
        console.error("Failed to load community avatars", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCommunity();
  }, []);

  async function handleCredentialResponse(response: any) {
    const idToken = response.credential;

    const res = await api.post("/api/auth/google", {
      token: idToken,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("userId", user.id);
    localStorage.setItem("user", JSON.stringify(user));

    window.location.reload();
  }

  const positionedUsers = useMemo(
    () =>
      communityUsers.map((user, index) => ({
        ...user,
        top: `${12 + ((index * 17) % 68)}%`,
        left: `${10 + ((index * 13) % 76)}%`,
        size:
          index % 3 === 0
            ? "h-16 w-16"
            : index % 3 === 1
              ? "h-14 w-14"
              : "h-12 w-12",
      })),
    [communityUsers],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:min-h-130 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-between gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:px-9 lg:py-7">
          <div className="space-y-5">
            <div className="space-y-2">
              <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                Join Velo Maps
              </h1>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                Sign in once and jump straight into the shared live map.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <Globe className="h-4.5 w-4.5 text-slate-700" />
                <p className="mt-2.5 text-sm font-semibold text-slate-900">
                  Shared team view
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Everyone appears on a single live map.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <Route className="h-4.5 w-4.5 text-slate-700" />
                <p className="mt-2.5 text-sm font-semibold text-slate-900">
                  Smooth path updates
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Track motion as positions stream in.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <ShieldCheck className="h-4.5 w-4.5 text-slate-700" />
                <p className="mt-2.5 text-sm font-semibold text-slate-900">
                  Google-only access
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Fast sign-in with the auth flow you already use.
                </p>
              </div>
            </div>
          </div>

          <div
            id="googleBtn"
            className="flex min-h-18 w-fit items-center justify-center"
          />
        </section>

        <section className="relative hidden overflow-hidden border-l border-slate-200 bg-sky-100 p-4 lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.26)_1px,transparent_1px)] bg-size-[64px_64px]" />

          <div className="relative flex h-full min-h-110 flex-col rounded-[1.75rem] border border-sky-200 bg-sky-50 p-4">
            {positionedUsers.map((user) => (
              <div
                key={user.id}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: user.top, left: user.left }}
              >
                <div className="rounded-full border-4 border-white bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={`${user.size} rounded-full object-cover`}
                  />
                </div>
                <div className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-center text-xs font-medium text-slate-700 shadow-sm">
                  {user.name.split(" ")[0]}
                </div>
              </div>
            ))}

            {!isLoading && communityUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="max-w-xs rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm leading-6 text-slate-600 shadow-sm">
                  The map will fill with profile circles as soon as users sign
                  in with Google.
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  Loading community avatars...
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

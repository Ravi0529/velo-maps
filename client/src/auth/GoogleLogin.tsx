import { useEffect } from "react";
import axios from "axios";

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleLogin() {
  useEffect(() => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      { theme: "outline", size: "large" },
    );
  }, []);

  async function handleCredentialResponse(response: any) {
    const idToken = response.credential;

    const res = await axios.post("http://localhost:8000/api/auth/google", {
      token: idToken,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    window.location.reload();
  }

  return <div id="googleBtn" />;
}

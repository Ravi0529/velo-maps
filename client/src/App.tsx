import GoogleLogin from "./auth/GoogleLogin";
import MapView from "./map/MapView";

function App() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <GoogleLogin />;
  }

  return <MapView />;
}

export default App;

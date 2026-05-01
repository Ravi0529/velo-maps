import GoogleLogin from "./auth/GoogleLogin";
import MapView from "./map/MapView";

function App() {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center">
        <GoogleLogin />
      </div>
    );
  }

  return <MapView />;
}

export default App;

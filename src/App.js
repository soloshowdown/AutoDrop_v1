import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/Home";
import VideoCall from "./components/VideoCall";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/videocall/:roomID",
      element: <VideoCall />,
    },
  ]);

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

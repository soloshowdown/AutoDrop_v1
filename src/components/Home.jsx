import React, { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomID, setRoomID] = useState("");
  const navigate = useNavigate();

  const handleJoinVideoCall = () => {
    if (roomID.trim() === "") {
      alert("⚠️ Please enter a Room ID before joining.");
      return;
    }
    navigate(`/videocall/${roomID}`);
  };

  return (
    <div className="container">
      <div className="home">
        <h1>Video Call App</h1>
        <div>
          <input
            type="text"
            placeholder="Enter Your Room ID"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
          />
          <button onClick={handleJoinVideoCall}>JOIN</button>
        </div>
      </div>
    </div>
  );
};

export default Home;

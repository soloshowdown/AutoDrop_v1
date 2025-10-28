import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { APP_ID, SERVER_SECRET } from "./variables";

const VideoCall = () => {
  const { roomID } = useParams();
  const containerRef = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const appID = APP_ID;
    const serverSecret = SERVER_SECRET;
    const userID = `USER_${Date.now()}`;
    const userName = "Kaushal";

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current,
      sharedLinks: [
        {
          name: "Join Room",
          url: `${window.location.origin}/videocall/${roomID}`,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true, // 👈 this line is important
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showScreenSharingButton: true,
    });
  }, [roomID]);

  // ✅ Start screen recording manually
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording_${roomID}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      alert("Recording started. Screen and audio are being captured.");
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please allow screen permissions.");
    }
  };

  // ✅ Stop recording
  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      alert("Recording stopped and saved!");
    }
  };

  return (
    <>
      <div ref={containerRef} style={{ width: "100vw", height: "90vh" }}></div>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        {!isRecording ? (
          <button onClick={handleStartRecording}>Start Recording</button>
        ) : (
          <button onClick={handleStopRecording}>Stop Recording</button>
        )}
      </div>
    </>
  );
};

export default VideoCall;

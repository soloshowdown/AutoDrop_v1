import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ZEGO_APP_ID, ZEGO_SERVER_SECRET } from './variables';

interface VideoCallProps {
  defaultRoomId?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ defaultRoomId }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [roomId, setRoomId] = useState<string>(defaultRoomId || 'autoscrum-' + new Date().toISOString().slice(0, 10));
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const appID = ZEGO_APP_ID;
    const serverSecret = ZEGO_SERVER_SECRET;
    if (!appID || !serverSecret) return;

    const userID = `USER_${Date.now()}`;
    const userName = 'AutoScrum User';

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current as HTMLDivElement,
      sharedLinks: [
        {
          name: 'Join Room',
          url: `${window.location.origin}/videocall/${roomId}`,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showScreenSharingButton: true,
    });
  }, [roomId]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${roomId}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      // eslint-disable-next-line no-alert
      alert('Recording started. Screen and audio are being captured.');
    } catch (err) {
      console.error('Error starting recording:', err);
      // eslint-disable-next-line no-alert
      alert('Could not start recording. Please allow screen permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // eslint-disable-next-line no-alert
      alert('Recording stopped and saved!');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-3 flex items-center gap-2 border-b">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        {!isRecording ? (
          <button className="text-sm px-3 py-2 rounded bg-blue-600 text-white" onClick={handleStartRecording}>Start Recording</button>
        ) : (
          <button className="text-sm px-3 py-2 rounded bg-red-600 text-white" onClick={handleStopRecording}>Stop Recording</button>
        )}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '70vh' }} />
    </div>
  );
};

export default VideoCall;



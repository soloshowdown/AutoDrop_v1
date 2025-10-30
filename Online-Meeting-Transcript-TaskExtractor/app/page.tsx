"use client";

import React, { useState } from "react";

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      alert("Please upload an audio file first.");
      return;
    }


    setIsLoading(true);
    setError("");
    setTranscript("");
    setSegments([]);
    setTasks([]);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription failed");
      }

      const data = await res.json();
      setTranscript(data.transcript || "");
      setSegments(data.result?.segments || []);
      setTasks(data.result?.tasks || []);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong during transcription or analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          🎙️ Meeting Transcription & Task Extractor
        </h1>

        {/* File Upload */}
        <div className="flex flex-col items-center space-y-3">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block text-sm text-gray-900"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !audioFile}
            className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
              isLoading || !audioFile
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {isLoading ? "Processing..." : "Transcribe & Analyze"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-700 text-center font-medium">{error}</div>
        )}

        {/* Transcript Section */}
        {transcript && (
          <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              🗒️ Full Transcript
            </h2>
            <p className="whitespace-pre-wrap text-gray-900 text-sm leading-relaxed">
              {transcript}
            </p>
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              🗣️ Speaker Segments
            </h2>
            <div className="space-y-2">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className="p-3 border border-gray-300 rounded-lg bg-white"
                >
                  <p className="font-medium text-blue-800">{seg.speaker}</p>
                  <p className="text-gray-900 text-sm">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">
            ✅ Extracted Tasks
          </h2>

          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-gray-900">
                    <span className="font-semibold text-gray-900">Who:</span>{" "}
                    <span className="text-gray-900 font-medium">
                      {task.who || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-900">
                    <span className="font-semibold text-gray-900">To Whom:</span>{" "}
                    <span className="text-gray-900 font-medium">
                      {task.to_whom || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-900">
                    <span className="font-semibold text-gray-900">Task:</span>{" "}
                    <span className="text-gray-900 font-medium">
                      {task.task || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-900">
                    <span className="font-semibold text-gray-900">Due:</span>{" "}
                    <span className="text-gray-900 font-medium">
                      {task.due_date || "N/A"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-900 italic">
              No actionable tasks detected in this conversation.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

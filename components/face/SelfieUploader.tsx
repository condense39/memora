"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Loader2, UploadCloud } from "lucide-react";
import Webcam from "react-webcam";

interface SelfieUploaderProps {
  onSuccess: (selfieUrl: string) => void;
}

export default function SelfieUploader({ onSuccess }: SelfieUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const newFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          setFile(newFile);
          setPreview(imageSrc);
          setShowWebcam(false);
          setError(null);
        });
    }
  }, [webcamRef]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/face/enroll", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to enroll face");
      }

      onSuccess(data.selfieUrl);
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setError(err.message || "Failed to enroll face.");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (uploading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="animate-spin text-yellow-500 w-10 h-10 mx-auto" />
        <p className="text-gray-600 font-medium">Enrolling your face...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <p className="text-red-500 font-medium max-w-sm mx-auto">{error}</p>
        <button onClick={clearSelection} className="btn-secondary">
          Try again
        </button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Selfie preview"
          className="rounded-full w-32 h-32 object-cover mx-auto border-4 border-yellow-400 shadow-md"
        />
        <p className="text-gray-500 text-sm">{file?.name}</p>
        
        <div className="flex items-center gap-3">
          <button onClick={handleUpload} className="btn-primary">
            Use this photo
          </button>
          <button onClick={clearSelection} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            Choose different
          </button>
        </div>
      </div>
    );
  }

  if (showWebcam) {
    return (
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden border-4 border-yellow-400">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full max-w-sm rounded-2xl object-cover"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={capture} className="btn-primary flex items-center gap-2">
            <Camera size={18} /> Take Photo
          </button>
          <button onClick={() => setShowWebcam(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="user"
        hidden
        ref={inputRef}
        onChange={handleFileChange}
      />
      <div
        onClick={() => setShowWebcam(true)}
        className="border-2 border-dashed border-yellow-300 rounded-2xl p-8 cursor-pointer hover:bg-yellow-50 transition text-center"
      >
        <Camera className="text-yellow-400 w-12 h-12 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">
          Click to open camera and take a selfie
        </p>
        <p className="text-gray-400 text-sm mt-1 mb-4">
          Use a clear, front-facing photo for best results
        </p>
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
          >
            <UploadCloud size={16} /> or upload file
          </button>
        </div>
      </div>
    </div>
  );
}

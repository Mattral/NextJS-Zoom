// components/Transcription.tsx
import { useEffect, useState } from "react";

const Transcription = ({ userName }: { userName: string }) => {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Check for SpeechRecognition API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      console.error("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const startRecognition = () => {
      recognition.start();
      setIsListening(true);
    };

    const stopRecognition = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setTranscription(transcript);

      // Clear the transcription after 2 seconds
      setTimeout(() => setTranscription(null), 2000);
    };

    recognition.onend = () => {
      if (isListening) startRecognition(); // Automatically restart if still in session
    };

    // Start recognition when component mounts
    startRecognition();

    // Cleanup function to stop recognition when component unmounts
    return () => {
      stopRecognition();
      recognition.onend = null;
    };
  }, [isListening]);

  if (!transcription) return null;

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "8px",
        textAlign: "center",
        width: "100%",
        maxWidth: "500px", // Limit width for wrapping
        marginBottom: "2rem",
        whiteSpace: "normal", // Allow wrapping
        wordBreak: "break-word", // Wrap long words to the next line if necessary
        fontSize: "1rem", // Adjust font size as needed
      }}
    >
      <strong>{userName}:</strong> {transcription}
    </div>
  );
};

export default Transcription;

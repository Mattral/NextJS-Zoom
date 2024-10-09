"use client";

import { CSSProperties, useRef, useState, useEffect } from "react";
import ZoomVideo, { VideoClient, VideoQuality, VideoPlayer } from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { WorkAroundForSafari } from "@/lib/utils";
import { PhoneOff } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";
import ChatPopup from "./ChatPopup"; // New chat component
import { styled } from "@mui/material/styles";

// Styled components for better visual aesthetics
const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  alignItems: "center",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
}));

const VideoPlayerContainer = styled("div")(({ theme }) => ({
  height: "60vh",
  width: "90%",
  marginTop: theme.spacing(2),
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: theme.shadows[5],
  backgroundColor: theme.palette.grey[100],
}));

const ButtonGroup = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-around",
  width: "100%",
  maxWidth: "400px",
  marginTop: theme.spacing(2),
}));

const Title = styled("h1")(({ theme }) => ({
  textAlign: "center",
  fontSize: "2rem",
  fontWeight: "bold",
  marginBottom: theme.spacing(2),
}));

const TimeCounter = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: theme.palette.text.primary,
}));

const ChatButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const Videocall = ({ slug, JWT }: { slug: string; JWT: string }) => {
  const session = slug;
  const jwt = JWT;
  const [inSession, setInSession] = useState(false);
  const [userName, setUserName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat popup
  const [elapsedTime, setElapsedTime] = useState(0); // State for elapsed time

  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    if (userName && !isDialogOpen) {
      joinSession();
    }
  }, [userName, isDialogOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (inSession) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000); // Update every second
    }
    return () => clearInterval(timer);
  }, [inSession]);

  const handleJoin = () => {
    if (userName.trim() !== "") {
      setIsDialogOpen(false);
    }
  };

  const joinSession = async () => {
    console.log("Joining session...");
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      (payload) => void renderVideo(payload)
    );
    try {
      await client.current.join(session, jwt, userName);
      setInSession(true);
      const mediaStream = client.current.getMediaStream();
      //@ts-expect-error
      window.safari
        ? await WorkAroundForSafari(client.current)
        : await mediaStream.startAudio();
      setIsAudioMuted(false);
      await mediaStream.startVideo();
      setIsVideoMuted(false);
      await renderVideo({
        action: "Start",
        userId: client.current.getCurrentUserInfo().userId,
      });
    } catch (e) {
      console.log("Join error:", e);
    }
  };

  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element.remove();
    } else {
      const userVideo = await mediaStream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  const leaveSession = async () => {
    client.current.off("peer-video-state-change", (payload) => void renderVideo(payload));
    await client.current.leave();
    window.location.href = "/";
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Container>
      <Dialog open={isDialogOpen}>
        <DialogTitle>Enter Your Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJoin}>Join</Button>
        </DialogActions>
      </Dialog>

      <Title>Session: {session}</Title>

      <div className={`flex w-full flex-1 ${inSession ? "" : "hidden"} justify-center`}>
        {/* @ts-expect-error html component */}
        <video-player-container ref={videoContainerRef} style={videoPlayerStyle} />
      </div>

      {/* Time Counter Display */}
      {inSession && (
        <TimeCounter>
          Elapsed Time: {formatTime(elapsedTime)}
        </TimeCounter>
      )}

      {inSession && (
        <ButtonGroup>
          <CameraButton
            client={client}
            isVideoMuted={isVideoMuted}
            setIsVideoMuted={setIsVideoMuted}
            renderVideo={renderVideo}
          />
          <MicButton
            isAudioMuted={isAudioMuted}
            client={client}
            setIsAudioMuted={setIsAudioMuted}
          />
          <Button onClick={leaveSession}>
            <PhoneOff />
          </Button>
        </ButtonGroup>
      )}

      {/* Chat Popup Toggle Button */}
      {inSession && (
        <ChatButton onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? "Close Chat" : "Open Chat"}
        </ChatButton>
      )}

      {/* Chat Popup */}
      {inSession && isChatOpen && <ChatPopup onClose={() => setIsChatOpen(false)} />}
    </Container>
  );
};

export default Videocall;

// Responsive styling for video player
const videoPlayerStyle = {
  height: "75vh",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
  width: "90%", // Adjust width for mobile responsiveness
} as CSSProperties;

// Add responsive styles for mobile view
const responsiveStyles = {
  "@media (max-width: 768px)": {
    height: "90vh", // Make the video player larger on mobile
    width: "95%", // Full width on mobile
  },
};

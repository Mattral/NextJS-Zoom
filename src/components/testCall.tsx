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
import ChatPopup from "./ChatPopup"; // Existing chat component
import { styled } from "@mui/material/styles";
import ScreenShareIcon from "@mui/icons-material/ScreenShare"; // Icon for screen sharing
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare"; // Icon to stop screen sharing

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

const ButtonGroup = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-around",
  width: "100%",
  maxWidth: "500px",
  marginTop: theme.spacing(2),
  flexWrap: "wrap",
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
  const [isScreenSharing, setIsScreenSharing] = useState(false); // State for screen sharing

  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const screenShareContainerRef = useRef<HTMLDivElement>(null); // Ref for screen share container

  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    if (userName && !isDialogOpen) {
      joinSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    client.current.on(
      "peer-share-state-change",
      (payload) => void renderScreenShare(payload)
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

  const renderScreenShare = async (event: { action: "Start" | "Stop"; userId: number }) => {
    console.log("Screen share event:", event);
    const mediaStream = client.current.getMediaStream();
  
    if (event.action === "Stop") {
      // Stop screen sharing
      await mediaStream.stopShareScreen();
      setIsScreenSharing(false);
    } else if (event.action === "Start") {
      const canvas = document.createElement("canvas");
      screenShareContainerRef.current?.appendChild(canvas);
  
      await mediaStream.startShareScreen(canvas);
      setIsScreenSharing(true);
    }
  };
  
  

  const leaveSession = async () => {
    client.current.off("peer-video-state-change", (payload) =>
      void renderVideo(payload)
    );
    client.current.off("peer-share-state-change", (payload) =>
      void renderScreenShare(payload)
    );
    await client.current.leave();
    window.location.href = "/";
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
  
        const videoElement = document.createElement("video");
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true;
        screenShareContainerRef.current?.appendChild(videoElement);
  
        setIsScreenSharing(true);
  
        // Ensure proper cleanup when the stream ends
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          videoElement.remove();
        });
      } else {
        // Stop sharing if it's already active
        const videoElement = screenShareContainerRef.current?.querySelector("video");
        videoElement?.remove();
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };
  

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
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

      <div className="flex w-full flex-1" >
        {!isScreenSharing ? (
          /* @ts-expect-error html component */
          <video-player-container ref={videoContainerRef} style={videoPlayerStyle} />
        ) : (
          <>
          {/* @ts-expect-error html component */}
            <video-player-container ref={screenShareContainerRef} style={screenShareStyle} />
            <div style={smallVideoStyle}>
              {/* @ts-expect-error html component */}
              <video-player-container ref={videoContainerRef} />
            </div>
          </>
        )}
      </div>


      {/* Time Counter Display */}
      {inSession && (
        <TimeCounter>Elapsed Time: {formatTime(elapsedTime)}</TimeCounter>
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
          {/* Screen Share Button */}
          <Button onClick={toggleScreenShare}>
            {isScreenSharing ? (
              <>
                <StopScreenShareIcon /> Stop Share
              </>
            ) : (
              <>
                <ScreenShareIcon /> Share Screen
              </>
            )}
          </Button>
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
      {inSession && isChatOpen && (
        <ChatPopup onClose={() => setIsChatOpen(false)} />
      )}
    </Container>
  );
};

export default Videocall;

// Adjusted styles for responsiveness and screen share mode
const videoPlayerStyle: CSSProperties = {
  height: "75vh",
  width: "90%",
  marginTop: "1.5rem",
  borderRadius: "10px",
  overflow: "hidden",
};

const screenShareStyle: CSSProperties = {
  height: "75vh",
  width: "100%",
  marginTop: "1.5rem",
  borderRadius: "10px",
  overflow: "hidden",
};

const smallVideoStyle: CSSProperties = {
  height: "20vh",
  width: "25%",
  marginTop: "1rem",
  borderRadius: "10px",
  overflow: "hidden",
  position: "absolute",
  bottom: "1rem",
  right: "1rem",
};
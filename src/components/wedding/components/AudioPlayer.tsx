
import { Play, Pause } from "lucide-react";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioPlayerProps {
  fileUrl: string;
  fileName: string;
  fileId: string;
  playingAudio: string | null;
  onPlay: (audioUrl: string, audioId: string) => void;
  isUserMessage: boolean;
}

export const AudioPlayer = ({ 
  fileUrl, 
  fileName, 
  fileId, 
  playingAudio, 
  onPlay, 
  isUserMessage 
}: AudioPlayerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isPlaying = playingAudio === fileId;

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: isUserMessage ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.7)',
      progressColor: isUserMessage ? 'rgba(255, 255, 255, 1)' : 'rgba(75, 85, 99, 1)',
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 1,
      height: 30,
      interact: false,
      hideScrollbar: true,
    });

    wavesurferRef.current = wavesurfer;

    // Load the audio
    wavesurfer.load(fileUrl);

    return () => {
      wavesurfer.destroy();
    };
  }, [fileUrl, isUserMessage]);

  useEffect(() => {
    if (!wavesurferRef.current) return;

    const wavesurfer = wavesurferRef.current;
    
    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [isPlaying]);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isUserMessage ? 'bg-rose-600' : 'bg-gray-100'
    }`}>
      <button
        onClick={() => onPlay(fileUrl, fileId)}
        className={`flex-shrink-0 p-1.5 rounded-full hover:bg-opacity-80 transition ${
          isUserMessage ? 'hover:bg-rose-700' : 'hover:bg-gray-200'
        }`}
      >
        {isPlaying ? (
          <Pause size={16} className={isUserMessage ? 'text-white' : 'text-gray-700'} />
        ) : (
          <Play size={16} className={isUserMessage ? 'text-white' : 'text-gray-700'} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div 
          ref={waveformRef} 
          className="w-full"
          style={{ minHeight: '30px' }}
        />
      </div>
      <audio 
        id={fileId}
        src={fileUrl}
        className="hidden"
      />
    </div>
  );
};


import { Play, Pause } from "lucide-react";

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
  return (
    <div className={`flex items-center gap-2 p-2 rounded ${
      isUserMessage ? 'bg-rose-600' : 'bg-gray-100'
    }`}>
      <button
        onClick={() => onPlay(fileUrl, fileId)}
        className={`p-1 rounded-full hover:bg-opacity-80 transition ${
          isUserMessage ? 'hover:bg-rose-700' : 'hover:bg-gray-200'
        }`}
      >
        {playingAudio === fileId ? (
          <Pause size={16} className={isUserMessage ? 'text-white' : 'text-gray-700'} />
        ) : (
          <Play size={16} className={isUserMessage ? 'text-white' : 'text-gray-700'} />
        )}
      </button>
      <div className="flex-1">
        <p className={`text-xs ${
          isUserMessage ? 'text-rose-100' : 'text-gray-600'
        }`}>
          {fileName}
        </p>
        <audio 
          id={fileId}
          src={fileUrl}
          className="hidden"
        />
      </div>
    </div>
  );
};

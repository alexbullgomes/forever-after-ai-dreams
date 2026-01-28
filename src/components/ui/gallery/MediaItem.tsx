
import React, { useEffect, useRef, useState, memo } from 'react';
import { Play } from 'lucide-react';
import { MediaItemType } from './types';

interface MediaItemProps {
    item: MediaItemType;
    className?: string;
    onClick?: (e?: any) => void;
}

// Simple mobile detection utility
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

// iOS detection for autoplay handling
const isIOSDevice = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const MediaItem: React.FC<MediaItemProps> = memo(({ item, className, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [isMobile] = useState(isMobileDevice());
    const [isIOS] = useState(isIOSDevice());
    const [showPlayButton, setShowPlayButton] = useState(false);

    // Intersection Observer to detect if video is in view and play/pause accordingly
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                setIsInView(entry.isIntersecting);
            });
        }, options);

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    // Handle video play/pause based on whether the video is in view or not
    useEffect(() => {
        let mounted = true;

        const handleVideoPlay = async () => {
            if (!videoRef.current || !isInView || !mounted) return;

            try {
                if (videoRef.current.readyState >= 3) {
                    setIsBuffering(false);
                    await videoRef.current.play();
                    setShowPlayButton(false);
                } else {
                    setIsBuffering(true);
                    await new Promise((resolve) => {
                        if (videoRef.current) {
                            videoRef.current.oncanplay = resolve;
                        }
                    });
                    if (mounted) {
                        setIsBuffering(false);
                        await videoRef.current.play();
                        setShowPlayButton(false);
                    }
                }
            } catch (error) {
                console.warn("Video playback failed:", error);
                if (mounted) {
                    setShowPlayButton(true);
                }
            }
        };

        if (isInView) {
            handleVideoPlay();
        } else if (videoRef.current) {
            videoRef.current.pause();
        }

        return () => {
            mounted = false;
            if (videoRef.current) {
                videoRef.current.pause();
            }
        };
    }, [isInView]);

    if (item.type === 'video') {
        return (
            <div className={`${className} relative overflow-hidden`}>
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    onClick={onClick}
                    playsInline
                    muted
                    loop
                    autoPlay
                    preload={isIOS ? "metadata" : "auto"}
                    poster={item.posterUrl}
                    onPlaying={() => setShowPlayButton(false)}
                    style={{
                        opacity: isBuffering ? 0.8 : 1,
                        transition: 'opacity 0.2s',
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                    }}
                >
                    {/* iOS Priority: MP4 first with explicit codec */}
                    {isIOS && item.mp4Url && (
                        <source src={item.mp4Url} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                    )}
                    {/* For mobile devices, prioritize MP4 format */}
                    {isMobile && !isIOS && item.mp4Url && <source src={item.mp4Url} type="video/mp4" />}
                    {/* Desktop: WebM preferred */}
                    {!isMobile && !isIOS && <source src={item.url} type="video/webm" />}
                    {/* Fallback to MP4 */}
                    {item.mp4Url && <source src={item.mp4Url} type="video/mp4" />}
                    {/* Additional fallback if no MP4 is available */}
                    {!item.mp4Url && <source src={item.url} type="video/mp4" />}
                </video>
                {isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
                {showPlayButton && !isBuffering && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (videoRef.current) {
                                videoRef.current.play().catch(console.warn);
                                setShowPlayButton(false);
                            }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                        aria-label="Play video"
                    >
                        <div className="bg-white/90 rounded-full p-3 shadow-lg">
                            <Play className="w-6 h-6 text-gray-900" fill="currentColor" />
                        </div>
                    </button>
                )}
            </div>
        );
    }

    return (
        <img
            src={item.url}
            alt={item.title}
            className={`${className} object-cover cursor-pointer`}
            onClick={onClick}
            loading="lazy"
            decoding="async"
        />
    );
});

export default MediaItem;

// MediaItemType defines the structure of a media item
export interface MediaItemType {
    id: number;
    type: string;
    title: string;
    desc: string;
    url: string;
    span: string;
    mp4Url?: string;
    posterUrl?: string;
    fullVideoUrl?: string; // YouTube or external video URL for "Watch Full Video" button
}
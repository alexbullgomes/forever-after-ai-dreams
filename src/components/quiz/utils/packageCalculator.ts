
import { Camera, Video, Sparkles } from "lucide-react";
import { QuizAnswer } from "@/pages/WeddingQuiz";

export interface PackageInfo {
  name: string;
  price: string;
  type: string;
  icon: typeof Camera | typeof Video | typeof Sparkles;
  color: string;
}

export interface Recommendation {
  category: 'video' | 'both';
  intensity: 'essential' | 'mid' | 'premium';
}

export const calculateRecommendation = (answers: QuizAnswer[]): Recommendation => {
  const categoryCount = answers.reduce((acc, answer) => {
    acc[answer.category] = (acc[answer.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const intensityCount = answers.reduce((acc, answer) => {
    acc[answer.intensity] = (acc[answer.intensity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantCategory = Object.entries(categoryCount).reduce((a, b) => 
    categoryCount[a[0]] > categoryCount[b[0]] ? a : b
  )[0] as 'photo' | 'video' | 'both';
  
  const dominantIntensity = Object.entries(intensityCount).reduce((a, b) => 
    intensityCount[a[0]] > intensityCount[b[0]] ? a : b
  )[0] as 'essential' | 'mid' | 'premium';
  
  // Filter out photo-only packages - default to 'both' if photo is selected
  const filteredCategory = dominantCategory === 'photo' ? 'both' : dominantCategory as 'video' | 'both';
  
  return {
    category: filteredCategory,
    intensity: dominantIntensity
  };
};

export const getPackageInfo = (recommendation: Recommendation): PackageInfo => {
  if (recommendation.category === 'video') {
    if (recommendation.intensity === 'essential') return {
      name: "The Highlight Reel",
      price: "$2,500",
      type: "Videography Package",
      icon: Video,
      color: "blue"
    };
    if (recommendation.intensity === 'mid') return {
      name: "The Legacy Film",
      price: "$3,500",
      type: "Videography Package",
      icon: Video,
      color: "blue"
    };
    return {
      name: "The Cinematic Love Story",
      price: "$5,000",
      type: "Videography Package",
      icon: Video,
      color: "blue"
    };
  }

  // Both category (Photo + Video packages)
  if (recommendation.intensity === 'essential') return {
    name: "Essential Love",
    price: "$2,999",
    type: "Photo + Video Package",
    icon: Sparkles,
    color: "purple"
  };
  if (recommendation.intensity === 'mid') return {
    name: "Dream Wedding",
    price: "$4,999",
    type: "Photo + Video Package",
    icon: Sparkles,
    color: "purple"
  };
  return {
    name: "Luxury Experience",
    price: "$8,999",
    type: "Photo + Video Package",
    icon: Sparkles,
    color: "purple"
  };
};

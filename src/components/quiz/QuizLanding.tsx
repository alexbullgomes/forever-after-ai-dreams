import { Button } from "@/components/ui/button";
import { Heart, Camera, Video, Sparkles } from "lucide-react";
interface QuizLandingProps {
  onStartQuiz: () => void;
}
const QuizLanding = ({
  onStartQuiz
}: QuizLandingProps) => {
  return <div className="container mx-auto px-4 py-8 md:py-16 min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        {/* Icon Header */}
        <div className="flex justify-center items-center gap-6 mb-8">
          <div className="p-3 rounded-full bg-brand-light">
            <Heart className="w-8 h-8 text-brand-primary-from" />
          </div>
          <div className="p-3 rounded-full bg-info-light">
            <Camera className="w-8 h-8 text-info" />
          </div>
          <div className="p-3 rounded-full bg-info-light">
            <Video className="w-8 h-8 text-info" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-brand-gradient">
            What's Your Dream Wedding Style?
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">Find your perfect wedding vibe — and unlock a special offer!</p>

        {/* CTA Button - Moved up */}
        <div className="mb-12">
          <Button onClick={onStartQuiz} size="lg" className="text-lg px-8 py-6 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Sparkles className="w-5 h-5 mr-2" />
            Start the Quiz ✨
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Takes less than 2 minutes • No spam, ever
          </p>
        </div>

        {/* Service Options with Interactive Effects */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-brand-light group-hover:bg-brand-light/80 transition-colors duration-300">
              <Camera className="w-full h-full text-brand-primary-from group-hover:text-brand-primary-hover-from transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-brand-primary-from transition-colors duration-300">Photography</h3>
            <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors duration-300">
              Capture every precious moment with stunning photography packages
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-info-light group-hover:bg-info-light/80 transition-colors duration-300">
              <Video className="w-full h-full text-info group-hover:text-info transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-info transition-colors duration-300">Videography</h3>
            <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors duration-300">
              Relive your special day with cinematic video storytelling
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-brand-light group-hover:bg-brand-light/80 transition-colors duration-300">
              <Sparkles className="w-full h-full text-brand-primary-to group-hover:text-brand-primary-hover-to transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-brand-primary-to transition-colors duration-300">Both</h3>
            <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors duration-300">
              Complete coverage with our premium photo + video packages
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default QuizLanding;
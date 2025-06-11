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
          <div className="p-3 rounded-full bg-rose-100">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <div className="p-3 rounded-full bg-purple-100">
            <Camera className="w-8 h-8 text-purple-500" />
          </div>
          <div className="p-3 rounded-full bg-blue-100">
            <Video className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            What's Your Dream Wedding Style?
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">Find your wedding vibe — and unlock a special offer!</p>

        {/* CTA Button - Moved up */}
        <div className="mb-12">
          <Button onClick={onStartQuiz} size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 hover:from-rose-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Sparkles className="w-5 h-5 mr-2" />
            Start the Quiz ✨
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Takes less than 2 minutes • No spam, ever
          </p>
        </div>

        {/* Service Options with Interactive Effects */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-rose-100 group-hover:bg-rose-200 transition-colors duration-300">
              <Camera className="w-full h-full text-rose-500 group-hover:text-rose-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors duration-300">Photography</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
              Capture every precious moment with stunning photography packages
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300">
              <Video className="w-full h-full text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">Videography</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
              Relive your special day with cinematic video storytelling
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors duration-300">
              <Sparkles className="w-full h-full text-purple-500 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">Both</h3>
            <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
              Complete coverage with our premium photo + video packages
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default QuizLanding;
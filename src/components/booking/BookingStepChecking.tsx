import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CalendarCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface BookingStepCheckingProps {
  eventDate: Date;
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  'Checking calendar availability...',
  'Reviewing schedule conflicts...',
  'Confirming your date...',
  'Almost there...',
];

export function BookingStepChecking({ eventDate, onComplete }: BookingStepCheckingProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const duration = 5500; // 5.5 seconds
    const interval = 50;
    const step = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(progressTimer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return next;
      });
    }, interval);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1300);

    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center"
        >
          <CalendarCheck className="h-4 w-4 text-primary" />
        </motion.div>
      </motion.div>

      <div className="text-center space-y-2">
        <motion.h3
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-lg font-medium"
        >
          {LOADING_MESSAGES[messageIndex]}
        </motion.h3>
        <p className="text-sm text-muted-foreground">
          {format(eventDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
}

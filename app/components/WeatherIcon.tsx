"use client";

import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

interface WeatherIconProps {
  condition: string;
  size?: number;
  inline?: boolean;
}

export default function WeatherIcon({ condition, size = 20, inline = false }: WeatherIconProps) {
  const getWeatherIcon = () => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      return {
        icon: Sun,
        color: 'text-yellow-500',
        animation: { rotate: 360 },
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
      };
    }
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return {
        icon: CloudRain,
        color: 'text-blue-500',
        animation: { y: [0, 2, 0] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (lowerCondition.includes('snow')) {
      return {
        icon: CloudSnow,
        color: 'text-cyan-400',
        animation: { y: [0, 3, 0] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return {
        icon: CloudLightning,
        color: 'text-purple-500',
        animation: { opacity: [1, 0.5, 1] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (lowerCondition.includes('mist') || lowerCondition.includes('fog') || lowerCondition.includes('haze')) {
      return {
        icon: CloudFog,
        color: 'text-slate-400',
        animation: { opacity: [0.8, 0.5, 0.8] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    if (lowerCondition.includes('cloud')) {
      return {
        icon: Cloud,
        color: 'text-slate-500',
        animation: { x: [0, 2, 0] },
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      };
    }
    
    // Default to cloud
    return {
      icon: Cloud,
      color: 'text-slate-400',
      animation: {},
      transition: {}
    };
  };

  const { icon: Icon, color, animation, transition } = getWeatherIcon();

  return (
    <motion.span
      className={`${inline ? 'inline-flex' : 'flex'} items-center justify-center ${color}`}
      animate={animation}
      transition={transition}
    >
      <Icon size={size} />
    </motion.span>
  );
}


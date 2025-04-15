"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Define proper types for particles
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  
  // Properly type the canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const features = [
    {
      id: 1,
      title: "Neural Processing",
      description: "Tackle complex tasks with our cutting-edge neural network architecture that adapts to your specific needs.",
      icon: (
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" />
          <path d="M7.5 12.5L10.5 15.5L16.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8C12 8 14 10.5 17 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 16C12 16 9 13.5 6 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      color: "from-purple-600 to-indigo-700",
    },
    {
      id: 2,
      title: "Adaptive Learning",
      description: "Our AI continuously improves with each interaction, becoming more tailored to your specific requirements over time.",
      icon: (
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.5 8.5C16.5 10.5 14.5 11.5 12.5 11.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 17C12.224 17 12 16.776 12 16.5C12 16.224 12.224 16 12.5 16C12.776 16 13 16.224 13 16.5C13 16.776 12.776 17 12.5 17Z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      color: "from-indigo-600 to-blue-700",
    },
    {
      id: 3,
      title: "Enterprise Security",
      description: "Your data remains protected with military-grade encryption and our commitment to privacy-first design.",
      icon: (
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 10.5V8C9 5.79086 10.7909 4 13 4C15.2091 4 17 5.79086 17 8V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="7" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      color: "from-blue-600 to-cyan-700",
    },
    {
      id: 4,
      title: "Conversational Flow",
      description: "Experience natural dialogues with an AI that understands context, nuance, and continues conversations seamlessly.",
      icon: (
        <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 21H7C4 21 2 19 2 16V8C2 5 4 3 7 3H17C20 3 22 5 22 8V16C22 19 20 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: "from-cyan-600 to-teal-700",
    },
  ];

  const testimonials = [
    {
      id: 1,
      quote: "Loadant has transformed how our team handles customer inquiries. The AI's ability to understand context and provide accurate responses is remarkable.",
      author: "Sarah Johnson",
      position: "Customer Service Director, TechCorp",
      image: "/api/placeholder/64/64"
    },
    {
      id: 2,
      quote: "We've seen a 40% increase in productivity since implementing Loadant. The adaptive learning capabilities mean it gets better every day.",
      author: "Michael Chen",
      position: "CTO, Innovate Solutions",
      image: "/api/placeholder/64/64"
    },
    {
      id: 3,
      quote: "The enterprise-grade security was a key factor in our decision. Loadant delivers cutting-edge AI without compromising on data protection.",
      author: "Lisa Rodriguez",
      position: "Security Officer, Financial Plus",
      image: "/api/placeholder/64/64"
    }
  ];

  // Initialize particles and testimonial rotation after component is mounted
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 500);
    setTimeout(() => setShowParticles(true), 1500);

    // Feature rotation interval
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    // Testimonial rotation interval
    const testimonialInterval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => {
      clearInterval(featureInterval);
      clearInterval(testimonialInterval);
    };
  }, [features.length, testimonials.length]);

  // Neural network particle animation
  useEffect(() => {
    // Guard clause with proper type checking
    if (!showParticles || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Check if context was obtained successfully
    if (!ctx) return;
    
    const particles: Particle[] = [];
    const particleCount = 100;
    const connectionDistance = 100;
    let animationFrameId: number;

    // Set canvas size to fill container
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 - 0.5,
        color: `rgba(99, 102, 241, ${Math.random() * 0.5 + 0.25})`,
      });
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particles
        p.x += p.speedX;
        p.y += p.speedY;

        // Boundary check
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect particles
        for (let j = i; j < particles.length; j++) {
          const p2 = particles[j];
          const distance = Math.sqrt(
            Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2)
          );

          if (distance < connectionDistance) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${
              0.2 * (1 - distance / connectionDistance)
            })`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [showParticles]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Neural network background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <canvas
          ref={canvasRef}
          className={`w-full h-full transition-opacity duration-1000 ${
            showParticles ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            className="flex items-center gap-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 1, bounce: 0.4 }}
          >
            <div className="relative w-10 h-10">
              <motion.svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-indigo-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
              >
                <path
                  d="M29 30C26.5 33 25 35 20 35C14.5 35 10 30.5 10 25C10 19.5 14.5 15 20 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M20 15C25.5 15 30 10.5 30 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M20 15C15.5 15 13 12.5 10 10L6 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <motion.circle
                  cx="32"
                  cy="20"
                  r="3"
                  fill="currentColor"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{
                    duration: 0.5,
                    delay: 2,
                    times: [0, 0.7, 1],
                    ease: "easeOut",
                  }}
                />
                <motion.circle
                  cx="20"
                  cy="5"
                  r="2"
                  fill="currentColor"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{
                    duration: 0.5,
                    delay: 2.2,
                    times: [0, 0.7, 1],
                    ease: "easeOut",
                  }}
                />
                <motion.circle
                  cx="20"
                  cy="35"
                  r="2"
                  fill="currentColor"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{
                    duration: 0.5,
                    delay: 2.4,
                    times: [0, 0.7, 1],
                    ease: "easeOut",
                  }}
                />
                <motion.circle
                  cx="5"
                  cy="20"
                  r="2"
                  fill="currentColor"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{
                    duration: 0.5,
                    delay: 2.6,
                    times: [0, 0.7, 1],
                    ease: "easeOut",
                  }}
                />
              </motion.svg>
              <motion.div
                className="absolute top-0 right-0 w-3 h-3 bg-indigo-100 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 3 }}
              >
                <motion.div
                  className="w-2 h-2 bg-indigo-600 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              </motion.div>
            </div>
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 text-transparent bg-clip-text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Loadant
            </motion.h1>
          </motion.div>
          <motion.div
            className="flex space-x-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Link href="/chat" className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <button className="relative bg-gray-50 dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                Chat Now
              </button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero section */}
          <div className="py-20 sm:py-24 lg:py-28">
            <div className="max-w-4xl mx-auto">
              <motion.div
                className="text-center"
                initial="hidden"
                animate={isLoaded ? "visible" : "hidden"}
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.2,
                    },
                  },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
                  }}
                  className="relative mx-auto"
                >
                  <motion.h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl md:text-7xl">
                    <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                      Loadant
                    </span>
                  </motion.h1>
                  <motion.div
                    className="absolute -top-6 -right-6 w-12 h-12"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-indigo-500 opacity-70">
                      <path
                        d="M20.9994 8C20.9994 9.10457 20.104 10 18.9994 10C17.8948 10 16.9994 9.10457 16.9994 8C16.9994 6.89543 17.8948 6 18.9994 6C20.104 6 20.9994 6.89543 20.9994 8Z"
                        fill="currentColor"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M16.9994 8C16.9994 9.10457 16.104 10 14.9994 10C13.8948 10 12.9994 9.10457 12.9994 8C12.9994 6.89543 13.8948 6 14.9994 6C16.104 6 16.9994 6.89543 16.9994 8Z"
                        fill="currentColor"
                        fillOpacity="0.5"
                      />
                      <path
                        d="M12.9994 8C12.9994 9.10457 12.104 10 10.9994 10C9.8948 10 8.99939 9.10457 8.99939 8C8.99939 6.89543 9.8948 6 10.9994 6C12.104 6 12.9994 6.89543 12.9994 8Z"
                        fill="currentColor"
                        fillOpacity="0.7"
                      />
                      <path
                        d="M8.99938 8C8.99938 9.10457 8.10396 10 6.99938 10C5.89481 10 4.99939 9.10457 4.99939 8C4.99939 6.89543 5.89481 6 6.99938 6C8.10396 6 8.99938 6.89543 8.99938 8Z"
                        fill="currentColor"
                      />
                      <path
                        d="M6.99938 12C6.99938 13.1046 6.10396 14 4.99938 14C3.89481 14 2.99939 13.1046 2.99939 12C2.99939 10.8954 3.89481 10 4.99938 10C6.10396 10 6.99938 10.8954 6.99938 12Z"
                        fill="currentColor"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M10.9994 12C10.9994 13.1046 10.104 14 8.99938 14C7.89481 14 6.99939 13.1046 6.99939 12C6.99939 10.8954 7.89481 10 8.99938 10C10.104 10 10.9994 10.8954 10.9994 12Z"
                        fill="currentColor"
                        fillOpacity="0.5"
                      />
                      <path
                        d="M14.9994 12C14.9994 13.1046 14.104 14 12.9994 14C11.8948 14 10.9994 13.1046 10.9994 12C10.9994 10.8954 11.8948 10 12.9994 10C14.104 10 14.9994 10.8954 14.9994 12Z"
                        fill="currentColor"
                        fillOpacity="0.7"
                      />
                      <path
                        d="M18.9994 12C18.9994 13.1046 18.104 14 16.9994 14C15.8948 14 14.9994 13.1046 14.9994 12C14.9994 10.8954 15.8948 10 16.9994 10C18.104 10 18.9994 10.8954 18.9994 12Z"
                        fill="currentColor"
                      />
                      <path
                        d="M16.9994 16C16.9994 17.1046 16.104 18 14.9994 18C13.8948 18 12.9994 17.1046 12.9994 16C12.9994 14.8954 13.8948 14 14.9994 14C16.104 14 16.9994 14.8954 16.9994 16Z"
                        fill="currentColor"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M12.9994 16C12.9994 17.1046 12.104 18 10.9994 18C9.8948 18 8.99939 17.1046 8.99939 16C8.99939 14.8954 9.8948 14 10.9994 14C12.104 14 12.9994 14.8954 12.9994 16Z"
                        fill="currentColor"
                        fillOpacity="0.5"
                      />
                      <path
                        d="M8.99938 16C8.99938 17.1046 8.10396 18 6.99938 18C5.89481 18 4.99939 17.1046 4.99939 16C4.99939 14.8954 5.89481 14 6.99938 14C8.10396 14 8.99938 14.8954 8.99938 16Z"
                        fill="currentColor"
                        fillOpacity="0.7"
                      />
                      <path
                        d="M4.99938 16C4.99938 17.1046 4.10396 18 2.99938 18C1.89481 18 0.999389 17.1046 0.999389 16C0.999389 14.8954 1.89481 14 2.99938 14C4.10396 14 4.99938 14.8954 4.99938 16Z"
                        fill="currentColor"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
                <motion.p
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.6 } },
                  }}
                  className="mt-4 text-xl text-gray-500 dark:text-gray-400"
                >
                  <span className="font-semibold">A</span>utomated{" "}
                  <span className="font-semibold">N</span>eural{" "}
                  <span className="font-semibold">T</span>echnologies
                </motion.p>
                <motion.p
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { delay: 0.4, duration: 0.6 } },
                  }}
                  className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto"
                >
                  Experience the power of intelligent conversation with our advanced AI 
                  assistant. Designed to understand, adapt, and deliver.
                </motion.p>
                <motion.div
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.6 } },
                  }}
                  className="mt-12"
                >
                  <Link href="/chat">
                    <motion.button
                      className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium rounded-lg group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full group-hover:w-full group-hover:h-56"></span>
                      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent to-transparent group-hover:from-indigo-600 group-hover:to-purple-600"></span>
                      <span className="relative inline-flex items-center gap-2 text-lg font-bold text-white transition-colors duration-300 ease-in-out bg-indigo-600 rounded-lg px-8 py-3">
                        Start Chatting
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                          ></path>
                        </svg>
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Features section */}
          <div className="py-16 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800/30 dark:to-gray-900 -z-10 rounded-xl"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Intelligent Solutions for Modern Needs
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
                  Our neural technology adapts to your requirements, providing
                  intelligent assistance for a variety of tasks.
                </p>
              </motion.div>

              <div className="mt-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Interactive feature cards */}
                  <div className="col-span-1">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      {features.map((feature, index) => (
                        <motion.div
                          key={feature.id}
                          className={`rounded-xl shadow-md cursor-pointer transform transition-all duration-300 ${
                            activeFeature === index
                              ? "col-span-2 scale-100 z-10"
                              : "scale-95 hover:scale-100"
                          }`}
                          onClick={() => setActiveFeature(index)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                          <div
                            className={`h-full rounded-xl p-6 border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 overflow-hidden relative ${
                              activeFeature === index
                                ? "bg-white dark:bg-gray-800"
                                : "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                            }`}
                          >
                            <div
                              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`}
                            ></div>

                            <div className="flex gap-4 items-start">
                              <div
                                className={`p-3 rounded-lg bg-gradient-to-br ${feature.color}`}
                              >
                                {feature.icon}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {feature.title}
                                </h3>
                                {activeFeature === index && (
                                  <motion.p
                                    className="mt-2 text-gray-600 dark:text-gray-300"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {feature.description}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Feature visual */}
                  <div className="col-span-1 flex items-center justify-center">
                    <motion.div
                      className="relative w-full max-w-md aspect-square"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden w-full h-full flex items-center justify-center p-8">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeFeature}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                          >
                            <div
                              className={`mx-auto p-4 rounded-full bg-gradient-to-br ${features[activeFeature].color} mb-6`}
                            >
                              <div className="w-16 h-16 text-white">
                                {features[activeFeature].icon}
                              </div>
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                              {features[activeFeature].title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              {features[activeFeature].description}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials section */}
          <div className="py-16">
            <motion.div
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 sm:text-4xl mb-12">
                What Our Clients Say
              </h2>
              <div className="relative h-64 md:h-56 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl overflow-hidden shadow-lg">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/4 translate-y-1/4"></div>
                
                {/* Testimonial slider */}
                <div className="relative h-full flex items-center justify-center px-8 sm:px-16">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={testimonialIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-3xl text-center"
                    >
                      <p className="text-lg md:text-xl text-white font-medium">
                        "{testimonials[testimonialIndex].quote}"
                      </p>
                      <div className="mt-4 flex items-center justify-center">
                        <img 
                          src={testimonials[testimonialIndex].image} 
                          alt={testimonials[testimonialIndex].author}
                          className="w-10 h-10 rounded-full border-2 border-white"
                        />
                        <div className="ml-3 text-left">
                          <p className="text-white font-semibold">
                            {testimonials[testimonialIndex].author}
                          </p>
                          <p className="text-white opacity-80 text-sm">
                            {testimonials[testimonialIndex].position}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTestimonialIndex(i)}
                        className={`w-2 h-2 rounded-full ${
                          i === testimonialIndex 
                            ? "bg-white" 
                            : "bg-white/40 hover:bg-white/60"
                        } transition-colors duration-200`}
                        aria-label={`Go to testimonial ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <div className="py-16">
            <motion.div 
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"></div>
                
                {/* Content */}
                <div className="relative pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20 text-white">
                  <div className="lg:self-center max-w-xl">
                    <motion.h2 
                      className="text-3xl font-extrabold sm:text-4xl"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="block">Ready to elevate your productivity?</span>
                    </motion.h2>
                    <motion.p 
                      className="mt-4 text-lg leading-6 text-indigo-100"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      Start using Loadant today and experience the power of Automated Neural Technologies.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Link
                        href="/chat"
                        className="mt-8 bg-white border border-transparent rounded-md shadow px-6 py-3 inline-flex items-center text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                      >
                        Start Now
                      </Link>
                    </motion.div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 hidden lg:block">
                  <svg 
                    className="w-48 h-48 text-indigo-200 opacity-20 transform rotate-90 translate-x-1/4 -translate-y-1/2" 
                    fill="none" 
                    viewBox="0 0 200 200" 
                  >
                    <defs>
                      <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                      </pattern>
                    </defs>
                    <rect width="200" height="200" fill="url(#pattern)" />
                  </svg>
                  </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="relative w-8 h-8 mr-2">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-indigo-600"
                >
                  <path
                    d="M29 30C26.5 33 25 35 20 35C14.5 35 10 30.5 10 25C10 19.5 14.5 15 20 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 15C25.5 15 30 10.5 30 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 15C15.5 15 13 12.5 10 10L6 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="32" cy="20" r="3" fill="currentColor" />
                  <circle cx="20" cy="5" r="2" fill="currentColor" />
                  <circle cx="20" cy="35" r="2" fill="currentColor" />
                  <circle cx="5" cy="20" r="2" fill="currentColor" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                © {new Date().getFullYear()} Loadant. All rights reserved.
              </p>
            </div>
            
            {/* Social links */}
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>

              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Footer navigation */}
          <nav className="mt-8 flex flex-wrap justify-center -mx-5 -my-2">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                Features
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                Pricing
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                Privacy Policy
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                Terms of Service
              </a>
            </div>
          </nav>
        </div>
      </footer>
      
      {/* Floating animated chat button */}
      <Link href="/chat">
        <motion.div
          className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full shadow-lg cursor-pointer z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h.01" />
              <path d="M12 10h.01" />
              <path d="M16 10h.01" />
            </svg>
            <motion.span
              className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
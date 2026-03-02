import { useState, useEffect, useRef } from 'react';
import kiboCar from '@/assets/kibo-car-200x124.webp';

// Helper component for the count-up animation
const AnimatedNumber = ({ target }: { target: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const targetNumber = parseInt(target.replace(/,/g, ''), 10);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 2000; // 2 seconds
          const startTime = Date.now();

          const animate = () => {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            const currentCount = Math.floor(progress * targetNumber);
            setCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(targetNumber); // Ensure it ends on the exact number
            }
          };
          
          requestAnimationFrame(animate);
          observer.disconnect(); // Animate only once
        }
      },
      { threshold: 0.1 } // Start animation when 10% of the element is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [targetNumber]);

  return (
    <div ref={ref} className="text-5xl font-bold text-kibo-orange mb-2">
      {count.toLocaleString()}+
    </div>
  );
};


const StatsSection = () => {
  const stats = [
    { number: "70", label: "Countries" },
    { number: "55", label: "US States & Territories" },
    { number: "20", label: "Years of Research" },
    { number: "200", label: "Hours of Standards-Aligned Curriculum" },
    { number: "3", label: "National Science Foundation (NSF) Grants" },
    { number: "1,000", label: "Of Possibilities" }
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const [carPosition, setCarPosition] = useState(0);

  const handleScroll = () => {
    if (!sectionRef.current) return;

    const { top, height } = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const startPoint = windowHeight;
    const endPoint = -height;
    const totalDistance = startPoint - endPoint;
    const currentProgress = startPoint - top;
    const progress = currentProgress / totalDistance;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    setCarPosition(-20 + clampedProgress * 115);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="pt-20 pb-16 bg-orange-50 relative overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-kibo-orange">
            KIBO Robotics for Kids' Proven Reach
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <AnimatedNumber target={stat.number} />
              <div className="text-sm text-muted-foreground font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* The Road and The Car */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-kibo-purple z-10">
         <img 
           src={kiboCar} 
           alt="KIBO Car" 
           className="absolute top-0 w-21 z-0"
           style={{ 
             left: `${carPosition}%`,
             transform: 'translate(-50%, -97%)'
           }}
         />
      </div>
    </section>
  );
};

export default StatsSection;

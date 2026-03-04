import * as React from "react";
import { KeyRound, PlayCircle, School, Home, HelpCircle, Lightbulb, BookOpen, Briefcase, DollarSign, TestTube, Package, Wrench, Puzzle, FileText, Star } from "lucide-react";
import { ActiveMenu } from "./Header";
import { Link } from "react-router-dom";

// KIBO Images
import whyKiboImg from "@/assets/kibo/Birds-and-Girls-300x225.png";
import inActionImg from "@/assets/kibo/menu1-300x150.png";
import inClassroomImg from "@/assets/kibo/menu2-300x150.png";
import atHomeImg from "@/assets/kibo/menu4-300x150.png";
import whichKiboImg from "@/assets/kibo/KIBO-Photo-300x143.png";
import usingKiboImg from "@/assets/kibo/Three-Kids-300x215.png";

// Educators Images
import usingInClassroomImg from "@/assets/foreducators/Storytelling-Goin-on-a-Bear-Hunt-1-300x168.png";
import curriculumImg from "@/assets/foreducators/curriculum-300x85.png";
import profDevImg from "@/assets/foreducators/prof-dev-300x85.png";
import grantsImg from "@/assets/foreducators/grants-300x85.png";
import researchImg from "@/assets/foreducators/research-300x85.png";
import packagesImg from "@/assets/kibo/KIBO-Photo-300x143.png"; // Reusing an image

// Resources Images
import tutorialsImg from "@/assets/resources/Amanda-Training-300x225.png";
import activitiesImg from "@/assets/resources/KIBO-with-IF-program.png";
import whitePapersImg from "@/assets/resources/pd2.png";
import experiencesImg from "@/assets/resources/Science-Whale-Migration-1.png";
import troubleshootImg from "@/assets/resources/History-Westward-Expansion-Wagon-1-scaled-1-300x107.png";
import research2Img from "@/assets/resources/research-300x85 (1).png";


interface MegaMenuProps {
  activeMenu: ActiveMenu;
  closeMenu: () => void;
}

const kiboMenuItems = [
  { title: "WHY KIBO?", href: "/why-kibo", description: "Screen-free, powered by imagination – and so many more reasons...", icon: KeyRound, imgSrc: whyKiboImg },
  { title: "KIBO IN ACTION", href: "/kibo/in-action", description: "Explore. Problem-solve. Innovate. Change things up. Make it your own.", icon: PlayCircle, imgSrc: inActionImg },
  { title: "KIBO IN THE CLASSROOM", href: "/kibo/in-the-classroom", description: "Engaging today's students requires much more than a tablet and mouse.", icon: School, imgSrc: inClassroomImg },
  { title: "KIBO AT HOME", href: "/kibo/at-home", description: "Learn to code without screentime? Yes, parents – it can be done!", icon: Home, imgSrc: atHomeImg },
  { title: "WHICH KIBO?", href: "/kibo/which/", description: "KIBO 10/15/18/21? Classroom Package? Let us help find the right KIBO for you.", icon: HelpCircle, imgSrc: whichKiboImg },
  { title: "USING KIBO", href: "/kibo/use/", description: "We can help you get started with tutorials, activities, curriculum and more.", icon: Lightbulb, imgSrc: usingKiboImg },
];

const educatorMenuItems = [
  { title: "USING KIBO IN THE CLASSROOM", href: "/kibo/in-the-classroom", description: "Engaging today's students requires much more than a tablet and mouse.", icon: School, imgSrc: usingInClassroomImg },
  { title: "CURRICULUM", href: "/education/stem-curriculum/", description: "Our comprehensive set of STEM curriculum materials supports you in every way.", icon: BookOpen, imgSrc: curriculumImg },
  { title: "PROFESSIONAL DEVELOPMENT", href: "/education/professional-development", description: "Hands-on experiences to target the different needs of schools and early childhood centers.", icon: Briefcase, imgSrc: profDevImg },
  { title: "GRANTS", href: "/grants", description: "There are thousands of grants for educators of all kinds. And it can all start with KIBO.", icon: DollarSign, imgSrc: grantsImg },
  { title: "RESEARCH", href: "/kibo/why/research", description: "KIBO is brought to you after more than 20 years of early childhood research.", icon: TestTube, imgSrc: researchImg },
  { title: "CLASSROOM PACKAGES", href: "/compare-packages", description: "Get the right number of KIBOs, valuable training, curriculum, workbooks + more!", icon: Package, imgSrc: packagesImg },
];

const resourcesMenuItems = [
  { title: "TUTORIALS", href: "/resources/tutorials", description: "Video explanations of all KIBO's functionality.", icon: Wrench, imgSrc: tutorialsImg },
  { title: "ACTIVITIES", href: "/resources/activities", description: "Learn and have fun with your KIBO!", icon: Puzzle, imgSrc: activitiesImg },
  { title: "WHITE PAPERS & WEBINARS", href: "/resources/white-papers-webinars", description: "See the collection of KIBO White Papers, guides, and webinar recordings.", icon: FileText, imgSrc: whitePapersImg },
  { title: "EXPERIENCES", href: "/resources/experiences", description: "Unique ways to learn with your KIBO.", icon: Star, imgSrc: experiencesImg },
  { title: "TROUBLESHOOT", href: "/technical-support", description: "If KIBO is no longer moving & shaking, we can help!", icon: HelpCircle, imgSrc: troubleshootImg },
  { title: "RESEARCH", href: "/kibo/why/research", description: "KIBO is brought to you after more than 20 years of early childhood research.", icon: TestTube, imgSrc: research2Img },
];


import promoImg from "@/assets/BU-ALANA-REKLAM-VEREBILIRSINIZ-300x300.png"; // Using an existing image for the ad

// A new component for the advertisement placeholder
const AdPlaceholder = ({ className }: { className?: string }) => (
  // Set height to match the total height of the two-row grid (h-24 * 2 + gap-2) -> (96px * 2 + 8px) = 200px -> h-50 is not a default tailwind class, so we use h-[200px]
  <Link to="/" className={`block w-[15rem] h-[200px] rounded-xl shadow-md overflow-hidden ${className}`}>
    <img src={promoImg} alt="Promotional Ad" className="w-full h-full object-cover" />
  </Link>
);

const MegaMenu: React.FC<MegaMenuProps> = ({ activeMenu, closeMenu }) => {
  if (!activeMenu) return null;

  const menuContent = {
    kibo: { items: kiboMenuItems },
    educators: { items: educatorMenuItems },
    resources: { items: resourcesMenuItems }
  };

  const currentMenu = menuContent[activeMenu];
  if (!currentMenu) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={closeMenu}></div>
      <div className="absolute top-full left-0 right-0 z-40 animate-in fade-in-0 duration-300">
        <div className="w-full bg-orange-50 shadow-lg overflow-hidden">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-x-10 px-4 py-3">

          {/* Left Ad, aligned to the right of its grid cell */}
          <div className="flex justify-end">
            <AdPlaceholder className="hidden lg:flex" />
          </div>

          {/* The menu grid, which defines the width of the center column */}
          <div className="grid grid-cols-3 gap-2 w-[80rem]">
            {currentMenu.items.map((item) => (
              <Link key={item.title} to={item.href} onClick={closeMenu} className="group relative block rounded-xl overflow-hidden h-24 text-white">
                <img src={item.imgSrc} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/80 transition-colors duration-300 group-hover:bg-black/60"></div>
                <div className="relative flex flex-col items-center justify-center text-center p-2 h-full">
                  <h3 className="font-bold text-sm transition-colors group-hover:text-kibo-orange">{item.title}</h3>
                  <p className="text-[10px] leading-tight text-white/90 transition-colors group-hover:text-kibo-orange">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Ad, aligned to the left of its grid cell */}
          <div className="flex justify-start">
            <AdPlaceholder className="hidden lg:flex" />
          </div>

        </div>
        </div>
      </div>
    </>
  );
};

export default MegaMenu;

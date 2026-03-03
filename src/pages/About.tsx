import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        {/* --- About Us Banner Section --- */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">About KinderLab Robotics - The Makers of KIBO</h2>
              <p className="text-white/90 mb-6">
                KinderLab Robotics, the early childhood STEM company, is dedicated to universal STEAM literacy by providing research-based robot kits to every young child.
              </p>
            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src="/assets/about/Screen-Shot-2022-11-06-at-12.webp" alt="KinderLab Robotics Story" className="max-h-[90%] w-[55%] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>

        {/* --- Content Section --- */}
        <div className="container mx-auto px-4 py-8">
          {/* Section 1: About KinderLab Robotics */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-kibo-purple">About KinderLab Robotics - The Early Childhood STEM Company</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <p className="text-gray-600 leading-relaxed">
                KinderLab Robotics emerged from a need to bring <a href="https://www.bc.edu/bc-web/schools/lynch-school/faculty-research/faculty-directory/marina-bers.html" className="text-kibo-purple underline">Dr. Marina Umaschi Bers</a>' robotics research on educational technology to a wider audience of young children. When presenting her work at conferences, Marina was being asked: "How can I get a robotics kit?" and not having a good answer.
              </p>

              <p className="text-gray-600 leading-relaxed">
                During a walk with her friend Mitch Rosenberg, a veteran executive at several robotic start-up companies, one afternoon at Walden Pond, near Boston, they decided to join forces to fulfill an old-dream of his: improving STEM education for young children. During that walk, KinderLab Robotics and <a href="/kibo" className="text-kibo-purple underline">KIBO</a> was born.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 leading-relaxed text-center">
                KinderLab Robotics is an early childhood STEM company dedicated to universal STEAM literacy. We aim to accomplish this by providing research-based robot kits to young children. Robotics in early learning introduces STEAM concepts in a playful way and gets even the youngest learners excited about Science, Technology, Engineering, Arts and Math!
              </p>
            </div>
          </div>

          {/* Section 2: Co-Founders */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-kibo-purple">KinderLab's Co-Founders</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Meet the visionary leaders behind KinderLab Robotics
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Marina Umaschi Bers */}
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/marina-image-import-263x279.webp"
                    alt="Marina Umaschi Bers"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-kibo-purple mb-2">MARINA UMASCHI BERS</h3>
                <p className="text-kibo-orange font-semibold mb-4">CO-FOUNDER</p>

                <div className="text-left space-y-4 text-gray-600">
                  <p>
                    Dr. Marina Umaschi Bers is an Augustus Long Professor of Education at the Lynch School of Education and Human Development at Boston College, where she heads the interdisciplinary <a href="https://sites.bc.edu/devtech/" className="text-kibo-purple underline">DevTech Research Group</a>. Her research involves the design and study of innovative learning technologies to promote positive youth development. Marina is also the co-founder and chief scientist at KinderLab Robotics, Inc.
                  </p>

                  <p>
                    Over the last two decades, Marina has conceived, designed and evaluated diverse educational technologies ranging from robotics to virtual worlds. Dr. Bers has co-developed the ScratchJr, a free app for children 5 to 7 to learn programming; and has received numerous grants that allow her to develop and research new technologies.
                  </p>
                </div>
              </div>

              {/* Mitch Rosenberg */}
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/mitch-145x173.jpg"
                    alt="Mitch Rosenberg"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-kibo-purple mb-2">MITCH ROSENBERG</h3>
                <p className="text-kibo-orange font-semibold mb-4">CEO</p>

                <div className="text-left space-y-4 text-gray-600">
                  <p>
                    Mitch Rosenberg is the CEO at KinderLab Robotics. He brings over 30 years of experience in the technology industry in engineering, marketing, product management and sales. He has executive experience at several successful technology firms, including robotics firms such as Automatix Inc., Kiva Systems (sold to Amazon in 2012) and Rethink Robotics.
                  </p>

                  <p>
                    Mitch received his BSEE and MSeE degrees from MIT and MBA from Boston University.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Learn More About KinderLab's Origins */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-kibo-purple">Learn More About KinderLab's Origins</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  Marina Bers' philosophy and theoretical approach for creating KinderLab, the early childhood STEM company, and developing KIBO, can be found in her many <a href="/kibo/why/research" className="text-kibo-purple underline">research projects and published books</a>. Our curriculum and assessment methods are also rooted in this research.
                </p>

                <p className="text-gray-600 leading-relaxed">
                  Marina is from Argentina. In 1994 she came to the US and received a Master's degree in Educational Media from Boston University and a Master of Science and PhD from the MIT Media Laboratory working with Seymour Papert.
                </p>

                <p className="text-gray-600 leading-relaxed font-semibold">
                  Learn more by watching Marina in this TedX Talk!
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <iframe
                    width="100%"
                    height="250"
                    src="https://www.youtube.com/embed/jOQ-9S3lOnM"
                    title="Marina Bers TedX Talk"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg shadow-lg"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: The KinderLab Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-kibo-purple">The KinderLab Team</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
               
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Jack Bennett */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/Elisabeth_Bennett-145x145.webp"
                    alt="Jack Bennett"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">JACK BENNETT</h3>
                <p className="text-gray-600 text-sm">ROBOT ASSEMBLER</p>
              </div>

              {/* Jason Innes */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/Jason-Innes-headshot-2023-e1693520185958-300x300.jpg"
                    alt="Jason Innes"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">JASON INNES</h3>
                <p className="text-gray-600 text-sm">DIRECTOR OF CURRICULUM, TRAINING, AND PRODUCT MANAGEMENT</p>
              </div>

              {/* Dave Jennett */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/Dave-Jennett-145x145.jpg"
                    alt="Dave Jennett"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">DAVE JENNETT</h3>
                <p className="text-gray-600 text-sm">BUSINESS MANAGER</p>
              </div>

              {/* Christina MacCaughey */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/Christina-163x163.jpg"
                    alt="Christina MacCaughey"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">CHRISTINA MACCAUGHEY</h3>
                <p className="text-gray-600 text-sm">DIRECTOR OF MARKETING</p>
              </div>

              {/* Laura Segel */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/Laura-Segel-145x145.webp"
                    alt="Laura Segel"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">LAURA SEGEL</h3>
                <p className="text-gray-600 text-sm">DIRECTOR OF MANUFACTURING</p>
              </div>

              {/* Itai Squires-Kasten */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/assets/about/itai-photo-145x145.jpg"
                    alt="Itai Squires-Kasten"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-kibo-purple mb-1">ITAI SQUIRES-KASTEN</h3>
                <p className="text-gray-600 text-sm">SHIPPING AND RECEIVING COORDINATOR</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;

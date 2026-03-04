import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeRichContent } from '@/lib/sanitizeHtml';

// Import Buzz-Buzz activity images (Experience 1)
import experience1Image1 from '../assets/resources/activities/1/Buzz-Buzz-Image-2-300x300.jpeg';
import experience1Image2 from '../assets/resources/activities/1/Buzz-Buzz-KIBO-300x261.jpeg';
import experience1Image3 from '../assets/resources/activities/1/Buzz-Buzz-Sequence-300x278.jpeg';
import experience1Image4 from '../assets/resources/activities/1/Buzz-Buzz.jpeg';

// Import Activity 3 images
import activity3Image1 from '../assets/resources/activities/3/Agnes-Irwin-Collaboration-Upload-1.jpg';
import activity3Image2 from '../assets/resources/activities/3/Agnes-Irwin-Collaboration-Upload.jpg';
import activity3Image3 from '../assets/resources/activities/3/Agnes-Irwin-KIBO-Tunnel-Upload-1.jpg';
import activity3Image4 from '../assets/resources/activities/3/Agnes-Irwin-Planning-Upload.jpg';
import activity3Image5 from '../assets/resources/activities/3/Agnes-Irwin-Preparing-Upload.jpg';
import activity3Image6 from '../assets/resources/activities/3/Agnes-Irwin-Starting-KIBO-Upload-1.jpg';
import activity3Image7 from '../assets/resources/activities/3/Agnes-Irwin-Testing-Upload.jpg';
import activity3Image8 from '../assets/resources/activities/3/FBI4B8YLV2E8T3A.webp';
import activity3Image9 from '../assets/resources/activities/3/FG5MT5SLTYDWYNZ.webp';
import activity3Image10 from '../assets/resources/activities/3/FSY0E1QLV2E8SV6.webp';
import activity3Image11 from '../assets/resources/activities/3/FZ7E6ZJLV2E8TLO.webp';

// Import Activity 4 images and PDFs
import activity4Image1 from '../assets/resources/activities/4/Nursery-Rhyme-KIBO-225x300.jpg';
import activity4Image2 from '../assets/resources/activities/4/Nursery-Rhyme-Retell-Image (1).jpg';
import activity4Image3 from '../assets/resources/activities/4/Nursery-Rhyme-Retell-Image.jpg';
import nurseryRhymeLessonPlan from '../assets/resources/activities/4/Kibo-Nursery-Rhyme-Retell-Lesson-Plan.pdf';
import nurseryRhymeProgramPlanning from '../assets/resources/activities/4/Nursery-Rhyme-Retell-Program-Planning-Sheet.pdf';

// Import Experience 5 image (main card image)
import experience5Image from '../assets/resources/experiences/kart5.png';

// Import Experience 6 images and PDF
import experience6Image from '../assets/resources/experiences/kart6.png';
import experience6Image1 from '../assets/resources/experiences/6/6-1.jpg';
import experience6Image2 from '../assets/resources/experiences/6/6-2.jpg';
import experience6Image3 from '../assets/resources/experiences/6/6-3.jpg';
import experience6Image4 from '../assets/resources/experiences/6/6-4.jpg';
import experience6Image5 from '../assets/resources/experiences/6/6-5.jpg';
import experience6Image6 from '../assets/resources/experiences/6/6-6.jpg';
// PDF is now served from public folder

// Import Experience 7 images
import experience7Image from '../assets/resources/experiences/kart7.png';
import experience7Image1 from '../assets/resources/experiences/7/7-1.jpg';
import experience7Image2 from '../assets/resources/experiences/7/7-2.jpg';
import experience7Image3 from '../assets/resources/experiences/7/7-3.jpg';
import experience7Image4 from '../assets/resources/experiences/7/7-4.jpg';

// Import Experience 28 images
import experience28Image1 from '../assets/resources/experiences/28/Science-Cave-Exploring-1.jpg';

// Import Experience 29 images
import experience29Image1 from '../assets/resources/experiences/29/final.jpg';
import experience29Image2 from '../assets/resources/experiences/29/planning-800x600.jpg';

// Import Experience 32 images
import experience32Image1 from '../assets/resources/experiences/32/seidel_pic01.webp';
import experience32Image2 from '../assets/resources/experiences/32/seidel_pic02-300x223.webp';
import experience32Image3 from '../assets/resources/experiences/32/seidel_pic03-300x224.webp';
import experience32Image4 from '../assets/resources/experiences/32/seidel_pic04-300x204.webp';
import experience32Image5 from '../assets/resources/experiences/32/seidel_pic05-300x228.webp';
import experience32Image6 from '../assets/resources/experiences/32/seidel_pic06-300x225.webp';
import experience32Image7 from '../assets/resources/experiences/32/seidel_pic07.webp';
import experience32Image8 from '../assets/resources/experiences/32/seidel_pic08.webp';
import experience32Image9 from '../assets/resources/experiences/32/seidel_pic09.webp';
import experience32Image10 from '../assets/resources/experiences/32/seidel_pic10.webp';
import experience32Image11 from '../assets/resources/experiences/32/seidel_pic11.webp';
import experience32Image12 from '../assets/resources/experiences/32/seidel_pic12.webp';

// Import Experience 35 images
import experience35Image1 from '../assets/resources/experiences/35/danriles-300x300-1.jpg';
import experience7Image5 from '../assets/resources/experiences/7/7-5.jpeg';

// Import Experience 8 images
import experience8Image from '../assets/resources/experiences/kart8.png';
import experience8Image1 from '../assets/resources/experiences/8/8-1.jpg';
import experience8Image2 from '../assets/resources/experiences/8/8-2.jpg';

// Import Experience 9 images
import experience9Image1 from '../assets/resources/experiences/kart9-1.png';
import experience9Image2 from '../assets/resources/experiences/kart9-2.png';
import experience9Image3 from '../assets/resources/experiences/kart9-3.png';
import experience9DetailImage1 from '../assets/resources/experiences/9/9-1.jpg';
import experience9DetailImage2 from '../assets/resources/experiences/9/9-2.jpg';
import experience9DetailImage3 from '../assets/resources/experiences/9/9-3.jpg';

// Placeholder data for experiences - will be populated later
const experiences = [
    {
        id: '1',
        title: 'A Pollination Adventure with KIBO!',
        description: 'Buzz Buzz\'s Pollination Adventure with KIBO is an engaging activity where our young friends assisted Buzz Buzz in collecting pollen and returning it to the beehive. Buzz Buzz was unable [...]',
        contributor: 'Hanna Loetz, Assistant Director, Goddard School Charlestown',
        contributorLink: 'https://www.goddardschool.com/schools/ma/charlestown/charlestown',
        fullContent: `
            <p><strong>Buzz Buzz's Pollination Adventure with KIBO</strong> is an engaging activity where our young friends assisted Buzz Buzz in collecting pollen and returning it to the beehive. Buzz Buzz was unable to move on its own, so we utilized KIBO as a mode of transportation to carry him around.</p>
            
            <br>
            
            <p>We remembered that KIBO is a robot, not a human, so we had to guide it with the directional programming blocks since it can't think on its own. We refreshed our understanding of the language KIBO employs â€“ barcodes found on the blocks! We emphasized the importance of beginning with the start block and ending with the end block for KIBO to comprehend instructions accurately.</p>
            
            <br>
            
            <p>We then delved into activity blocks such as shaking, turning to the side, moving backward and forward, and spinning. Then we started our activity. On the ground, we marked a tape line with the hive picture on one end and the flowers picture on the other. On the flower picture were yellow pom-poms representing the pollen.</p>
            
            <br>
            
            <p>The task involved programming KIBO and Buzz Buzz to reach the flowers. Working in small groups, our children eagerly tackled the challenge. Initially, they tried using the forward block, but KIBO only managed to take a single step, falling short of reaching the flowers. They ingeniously overcame this by repeatedly pressing the button to advance KIBO step by step until Buzz Buzz reached the flowers, where they joyfully deposited the pollen. Subsequently, we introduced another method. We looked on a new block â€“ the repeat block â€“ explained its function. We counted the required repetitions until KIBO and Buzz Buzz reached the flowers, which turned out to be four times. We inserted the "four times" parameter card into the repeat block, and it worked like a charm.</p>
            
            <br>
            
            <p>Buzz Buzz had different ways to move: straight forward, or turning to the right or left. Each time, we had to find the right programming blocks for that action and place it in a sequence. Finally, we discussed the option of programming KIBO to perform the task continuously in the forever loop. When we programmed KIBO to do the task forever, the kids laughed a lot and had so much fun. Towards the end, I introduced the children to additional features of KIBO, such as its ear sensor for listening, the recorder for producing sound, its eye sensor for detecting light and darkness, and its telescopic function for gauging distances and its light bulb.</p>
            
            <br>
            
            <p>Our friends aimed to program KIBO to guide Buzz Buzz to flowers, gather pollen, and return to the hive. They explored KIBO's functions and experimented with directional blocks and repetition to optimize movement. Through trial and error, they fixed errors like missing start/end blocks or miscounting repetitions. This taught them the importance of precise coding and sequencing. Experimenting with repetition, they learned its efficiency in simplifying tasks, enhancing their computational thinking. Overall, the activity sharpened problem-solving, coding, and critical thinking skills, fostering curiosity and fun while preparing them for future STEM endeavors.</p>
        `,
        images: [experience1Image1, experience1Image2, experience1Image3, experience1Image4],
        categories: ['Activities', 'Experiences'],
        tags: ['School']
    },
    {
        id: '2',
        title: 'Let\'s Tell Jokes with KIBO!',
        description: '"We love telling jokes in our Library. To enrich our joke telling skills with the use of KIBO, two students select a joke and then work together to create lines [...]',
        contributor: 'Lisa Wagoner, Library Media Specialist, Woodward School, MA',
        contributorLink: 'https://sites.google.com/nsboroschools.net/woodwardlibrary/home',
        videoUrl: 'https://youtu.be/6mRoXje2Bhs',
        fullContent: `
            <p>"We love telling jokes in our Library. To enrich our joke telling skills with the use of KIBO, two students select a joke and then work together to create lines of code so that one KIBO with a puppet on top can begin a joke by asking a question like "What do you call a ______." The other student creates a line a code so that her KIBO with a puppet on top moves and replies with "I don't know. What do you call a _____." The first student creates a line of code to finish the joke and the other student can code her KIBO to move and laugh. This is a great way to learn the skill of having 2 KIBOs interact with each other, planning and executing lines of code that allow the KIBOs to "talk to each other" and having fun telling different types of jokes.</p>
            <br>
            <p>My children demonstrated this. James and Kira are 10 year old twins in 4th grade. They found this activity challenging, but really fun. They had no prior exposure to KIBO, so I had to give them a little lesson before tackling this activity. One thing that we found super helpful was to clap two coding blocks together when using the "clap" block and Ear Sensor. This worked much better than actually clapping with your hands.</p>
            <br>
            <p><strong>Enjoy! What jokes can you tell with KIBO?</strong></p>
        `,
        images: ['', '', ''],
        categories: ['Activities', 'Experiences'],
        tags: ['School']
    },
    {
        id: '3',
        title: 'Coding & Sequencing With The Very Hungry Caterpillar',
        description: 'Bring The Very Hungry Caterpillar to life by programming KIBO to reenact the caterpillar\'s feast in this multi-day early childhood STEM lesson.',
        contributor: 'Mary-Tyler Upshaw, Lower STEAM Specialist, The Agnes Irwin School',
        contributorLink: 'https://www.agnesirwin.org/',
        fullContent: 'CUSTOM_PAGES_DEFINED_BELOW', // Special marker for custom pagination
        images: [activity3Image1, activity3Image2, activity3Image3, activity3Image4, activity3Image5, activity3Image6, activity3Image7, activity3Image8, activity3Image9, activity3Image10, activity3Image11],
        categories: ['Activities', 'Experiences'],
        tags: ['School']
    },
    {
        id: '4',
        title: 'Nursery Rhyme Retelling with KIBO',
        description: 'In this early childhood STEM lesson, K-2 students retell a nursery rhyme using the KIBO robot. Students create a program and code KIBO to tell a nursery rhyme to their audience.',
        contributor: 'Erin Wicklund, Hillsdale Public Schools, NJ',
        contributorLink: 'https://www.hillsdaleschools.com/',
        videoUrl: 'https://youtu.be/jJYa4tqLJj0',
        fullContent: `
            <p>In this lesson, our K-2 students retell a nursery rhyme using the KIBO robot to "show and tell". Students worked collaboratively to create a program that will follow the first, next, then, and last retelling format. The program contains <a href="${nurseryRhymeProgramPlanning}" target="_blank" style="color: #f97316; text-decoration: underline;">Begin, End, and whichever other KIBO programming blocks</a> they feel are necessary to tell the nursery rhyme to their audience.</p><br>
            
            <p>This is a great opportunity to reinforce a natural connection between literacy and computer science. Some nursery rhymes included Itsy Bitsy Spider, Humpty Dumpty, Little Bo Peep, and Hey Diddle Diddle.</p><br>
            
            <p>To create your own activity, see the KIBO Lesson Plan, <a href="${nurseryRhymeLessonPlan}" target="_blank" style="color: #f97316; text-decoration: underline;">Nursery Rhyme Retell</a>. The lesson plan included materials needed, ISTE standards met, assessments, as well learning standards:</p>
            <br>
            <ul>
                <li>- Create programs with sequences & simple loops to accomplish tasks.</li>
                <li>- Describe a program's sequence of events, goals, and expected outcomes.</li>
                <li>- Determine central message and retell a sequence of events in literary texts</li>
                <li>- Ask and answer questions about key details in a text or information presented orally or through other media.</li>
            </ul>
        `,
        images: [activity4Image2, activity4Image1, activity4Image3],
        categories: ['Activities', 'Experiences'],
        tags: ['School']
    },
    {
        id: '5',
        title: 'Integration of Robotics and Coding with Global Exploration',
        description: 'Preschoolers researched the art and culture of the Ndebele people and coded a dance sequence using KIBO and played drums to accompany the dance.',
        contributor: 'Science Akademeia - The Atlanta Preschool of Science,',
        contributorLink: 'https://www.satapos.com/',
        videoUrl: 'https://youtu.be/-Taowap7mRE',
        fullContent: `
            <p>This video shows the preschoolers from Science Akademeia â€“ The Atlanta Preschool of Science researching the African Continent. The preschoolers explored the art and culture of the Ndebele people of Southern Africa. They made Ndebele dolls and drums, coded a dance sequence using KIBO by Kinderlab Robotics, and played drums to accompanied the movement of the dance.</p>
            <br>
            <p>This geography lesson pulls in coding and robotics, arts, crafts, design, music and more! Such a creative way to integrate KIBO into the classroom!</p>
            <br>
            <p>Science Akademeia â€“ The Atlanta Preschool of Science offers The Seeds of STEM curriculum which integrates science concepts with engineering practices and supports the development of STEM foundational skills. Throughout the process, the children share their work (ideas, plans, and prototypes) with their peers. This process introduces children to the early concepts of the engineering design process.</p>
            <br>
            
        `,
        images: ['', '', ''],
        categories: ['Experiences', 'Videos'],
        tags: ['Classroom', 'Collaboration', 'Programming']
    },
    {
        id: '6',
        title: 'Celebrating Tu Bâ€™Shevat, the Jewish New Year of Trees',
description: 'To celebrate Tu Bâ€™Shevat, 1st and 2nd graders created 4 trees representing the seasons and programmed KIBO to care for the trees.',

        contributor: 'Helen Schwartz & Adam Wilkinson, New England Jewish Academy, CT,',
        contributorLink: 'https://neja.org/',
        fullContent: `
            <p>In celebration of Tu Bâ€™Shevat, the Jewish New Year of Trees, the first and second graders at New England Jewish Academy (NEJA), along with their Hebrew teacher, Mrs. Maya Schwartz, their Judaic Studies teacher, Mrs. Shifra Silver and the General Studies teacher, Mrs. Helen Schwartz, combined lessons to have the students celebrate the holiday by creating artwork with recycled materials to create 4 trees representing the four seasons and then programmed KIBO to work with the trees to help them.</p>
            <br>
            <p><strong>The activity consisted of:</strong>
<p>1) The history of the holiday, the Hebrew words for tree parts, customs and rituals were covered in Hebrew and Judaic Studies classes. The recycling and robotics focus was taught during science class.
<p>2) Students the used recycled materials to create 4 trees to represent the four seasons â€“ long and short cardboard tubes, packing material (that made great nests), an old white shirt that when cut up became great snow and eggs for the nests, as well as left over construction paper for leaves and fruit.
<p>3) The students then programmed KIBO to approach each tree and share what it needed. For instance:</p>
            <ul>
                <li>â€“ when the light bulb was blue, it was â€œwateringâ€ the tree</li>
                <li>â€“ when the light bulb was white, it was snow for the tree</li>
                <li>â€“ when the light bulb was red, it was the sun</li>
                <li>â€“ when KIBO shook, it was either shaking down fruit or planting some seeds</li>
                <li>â€“ when KIBO turned in a circle, it was replicating playing in the leaves</li>
                <li>â€“ when KIBO sang it was making the trees happy</li><br>
            </ul>
            <br><p><br><p><br><p>
            <p><strong>Some of the comments from the students:</p></strong>
            <br>
            <p>â€œIt was a creative idea and we worked well as a team. It was a fun experience making KIBO find the right things for each tree.â€<p>
            <p>â€œI liked working with kids from the rest of my pod that are not in my class.â€</p>
            <p>â€œI liked this activity because I like trees and plants.â€</p>
            <p>â€œIt was fun making the trees.â€</p>
            <p>â€œWe can also use these trees and KIBO for celebrating spring.â€</p>
            <br>
            <p>The classes enjoyed this multi-day project and worked well in small and large groups as well as planning together for what they were going to do and what KIBOâ€™s parts could represent.</p>
            <br>
            <p>To create your own activity, see the KIBO Lesson Plan, <a href="/KIBO-Tu-Bshevat-lesson-New-Year-for-the-Trees.pdf" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">"New Year for the Trees"</a>.</p>
        `,
        images: [experience6Image1, experience6Image2, experience6Image3, experience6Image4, experience6Image5, experience6Image6],
        categories: ['Experiences', 'Arts Integration'],
        tags: ['STEAM', 'Creative', 'Art', 'Performance']
    },
    {
        id: '7',
        title: 'Robotics and Mathematics Go Hand in Hand',
description: 'See some examples of using KIBO with math problems; for young learners to explore critical problem solving and learning through practical experiences.',

        contributor: 'Celestino MagalhÃ£es, Teacher of Robotics and Coding, Externato de Vila MeÃ£, Portugal,',
        contributorLink: 'https://externatovilamea.pt/',
        fullContent: `
            <p>Our KIBO Ambassador, Celestino MagalhÃ£es, shares a few examples of how he uses KIBO with math instruction with his young learners. He says, â€œThe use of KIBO robots allows 5-year-old children to explore and create different scenarios, thus exploring their critical thoughts in solving real problems and situations, exploring different solutions to the problem, managing to create valid and profound knowledge, through practical experiences.â€</p>
            <br>
            <p>With the introduction of robotics in an educational environment students are able to:
<p>(1) think critically
<p>(2) imagine several solutions for solving the same problem
<p>(3) select and plan the implementation of the chosen solution
<p>(4) build and test the results, presenting them if the solution works or reformulating them, because if a robot did not perform as expected, the student can adjust or program it by redoing the entire process.</p>
<br><p>â€œStudents integrate robot kits, composed of parts, motors, sensors, to achieve deeper learning of technology, providing moments for the student to learn by doing, by themselves, in a tactile way, relating his ideas to the artifacts, and where students can visualize immediate results.â€</p>            

            <br><p><br><p><br>
            <p><strong>Below are examples of his students using KIBO:</p></strong>
            <br>
            <p>1) <strong>Math </strong>â€“ The use of KIBO robots allow children to explore and create different scenarios, exploring their critical thoughts in solving real problems and situations, in collaboration with Mathematics, exploring different solutions to the problem.
<p>2)<strong> Within Regular Instruction </strong>â€“ Integrating KIBO in an educational context allows the creation of diversified learning scenarios, which combine technology with artifacts, allow developing creativity, support process planning to help students build their own knowledge.</p>
        `,
        images: [experience7Image1, experience7Image2, experience7Image3, experience7Image4, experience7Image5],
        categories: ['Experiences', 'Collaboration'],
        tags: ['Teamwork', 'Problem Solving', 'Communication', 'STEM']
    },
    {
        id: '8',
        title: 'Balloons Over Broadway with KIBO',
description: 'Inspired by reading Balloons Over Broadway, 1st and 2nd graders create a balloon parade with their KIBO robots!',

        contributor: 'Helen Schwartz, New England Jewish Academy, CT,',
        contributorLink: 'https://neja.org/',
        videoUrl: 'https://youtu.be/4EOoxfd6LhQ',
        fullContent: `
            <p><strong>Inspired by reading Balloons Over Broadway, 1st and 2nd graders create a balloon parade with their KIBO robots!</p></strong>
            <br>
            <p>Our KIBO Ambassador, Helen Schwartz, shares a fun fall activity inspired by reading Balloons Over Broadway by Melissa Sweet.</p>
          
            <br>
            <p>Her first and second graders created their own balloons (dressed up as a turkey) and then faced the challenge of attaching it to their KIBO, then programming KIBO to walk in a parade like the Macyâ€™s Thanksgiving Day Parade. The children came up with many different ideas for attaching the balloonâ€™s yarn string. Some attached it directly to the platform, some to the motor and some to the pedestal. The second graders were successful in getting their robots to â€œmarchâ€ by using the repeat program. The first graders added some turns and shakes in their program.</p>
            <br>
            <p>What a great way to combine the holiday of Thanksgiving and their new KIBO robots!</p>
        `,
        images: [experience8Image1, experience8Image2],
        categories: ['Experiences', 'Music', 'Performance'],
        tags: ['Music', 'Dance', 'Performance', 'Arts Integration']
    },
    {
        id: '9',
        title: 'KIBO Robot Activities in Makerspaces',
description: 'See the three makerspace activities (literacy, social studies and math) you can use to engage students with playful STEAM robotics.',

        contributor: 'Bryan Flaig, Independent Makerspace Consultant',
        contributorLink: '',
        fullContent: `
            
        `,
        images: [experience9DetailImage1, experience9DetailImage2, experience9DetailImage3],
        categories: ['Experiences', 'Curriculum'],
        tags: ['Progressive Learning', 'Curriculum', 'Multi-Stage', 'Assessment']
    },
    {
        id: '10',
        title: 'STEAM Teaching: Using Coding as A Playground in PD',
description: 'See student-lead learning programs merging play, STEAM learning, and computational thinking.',
        videoUrl: 'https://youtu.be/VjoswAHGvfM',

        fullContent: `
            <p>This video provides an overview of KIBO in a professional development program for early childhood educators, organized by Dr. Heather McKeen of Columbus State University in Columbus GA. Learn about student-lead learning while merging play, STEAM learning, and computational thinking.</p>
            <br>
            <p>KIBO Ambassador Dr. Heather McKeen is an Assistant Professor of Elementary Education at Columbus State University. Learn more about <a href="https://www.columbusstate.edu/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Dr. McKeen's work</a> at her faculty page.</p>
        `,
        images: [
            '/assets/resources/experiences/23/2b9343b3-98db-4204-ae6d-ceb05659d41a.jpeg',
            '/assets/resources/experiences/23/fb482bc9-4c7c-4a52-a7bc-ec40357616a9-960x720.jpeg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Heather McKeen,',
        contributorLink: 'https://www.columbusstate.edu/'
    },
    {
        id: '11',
        title: 'Integrating Technology into a Preschool Classroom',
description: 'This video documents an integrated STEAM unit on the Chinese New Year using KIBO in a Boise preschool environment.',
        videoUrl: 'https://youtu.be/uYoCfBA9Xpc',

        fullContent: `
        
            <p>This video documents an integrated STEAM unit on the Chinese New Year using KIBO in a Boise preschool environment.</p>
            <br>
            <p>KIBO Ambassador, Heather Lee, is the Early STEM Education Coordinator of the Idaho STEM Action Center. This video was developed in partnership between Boise State Universityâ€™s College of Education and Idaho STEM Action Center. Follow her work at    .</p>
        `,
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Heather Lee,',
        contributorLink: 'https://stem.idaho.gov/'
    },
    {
        id: '12',
        title: 'Elephant and Piggie KIBO Theater',
description: 'Students recreate a scene with Mo Willems\' Elephant and Piggie characters. Art, literacy, and coding come together to support early literacy skills with KIBO!',
        videoUrl: 'https://youtu.be/MgE5WFMb8g0',

        fullContent: `
       
            <p>KIBO is a wonderful tool for storytelling â€“ and for re-telling favorite stories. In a â€œRobotic Readerâ€™s Theaterâ€ activity, art, literacy, and coding come together to support early literacy skills with KIBO!</p>
            <br>
            <p>In this project, students at JCDS Boston re-told a scene involving <a href="https://www.pigeonpresents.com/books/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Mo Willems' Elephant and Piggie </a>characters. The KIBO <a href="/shop" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Sound Record/Playback Module</a> allowed the students' voices to become part of the story.</p>
        `,
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'JCDS Boston,',
        contributorLink: 'https://www.jcdsboston.org/'
    },
    {
        id: '13',
        title: 'Exploring the Solar System with KIBO and Dr. Mae Jemison',
description: 'Students programmed KIBO to tour the solar system, under the command of a LEGO version of astronaut Dr. Mae Jemison!',

        fullContent: `
        
            <p>As part of our computer programming and coding curriculum at Friends School of Baltimore, kindergarten/pre-first (K/P1) students explore ways to communicate, talk to, and control our robot friends, Bee Bot, and now our good friend, KIBO. This past winter, we used an integrative approach to our coding curriculum and looked for opportunities to teach coding in all content areas, whether it was language arts, math, science, art, or music.</p>
            <br>
            <p>Each year, students in K/P1 learn about various figures in history, paying particular attention to the roles of women and African Americans. One of the more prominent figures we introduce the children to  is Dr. Mae Jemison, the first African-American astronaut who traveled to space aboard the Space Shuttle Endeavour. After our initial project with KIBO in the fall, creating and coding the migration path of the red knot bird, students organically came up with the idea to have KIBO serve as the Endeavour. In doing so, we could then take Dr. Jemison, in LEGO form, on another voyage into space! Using Twitter, we asked Dr. Jemison, â€œIf you could go back into space, where would you go?â€</p>
        <br>
        <p>After students conducted research about the planets, they came to the Makerspace in order to design and create the solar system. Students used balled up construction paper as the planets, and, in a brilliant moment of spontaneity, students made use of non-fiction books to double check their facts about the rings on Saturn, Jupiterâ€™s great red spot, and other facts they needed to know in order to create realistic looking planets. Students collaborated in teams to design and create the planets and place them on our board, which served as the backdrop of the solar system. The children measured, cut, glued, and discussed in their groups the details that differentiated their planets. The children took pride and joy in finding the perfect materials, and then designing a method to attach the rings on to Saturn. The challenge was met!
        <br><p><br>
        <p>Once the solar system was created, students agreed on and plotted out a path for the LEGO Dr. Jemison, and the KIBO Endeavour. The children decided the flight path would begin at Earth, fly to its moon, travel to Mars, circle around Saturn, slingshot around Uranus, pass by Jupiter, and then finally fly back to Earth. This was quite the journey and our coding skills would be stretched and tested.
        <br>
        <br><br><p>At this point, students needed to critically think about how to code KIBO on the flight. The children began to recognize patterns which allowed them to use the repeat blocks. We decided that LEGO Dr. Jemison should celebrate each part of the mission, so LEGO Dr. Jemison did that by having KIBO Endeavour light up, make a noise, or â€œdanceâ€ at each stop. Students needed to collaboratively discuss the sequencing of blocks. We were challenged in how to make KIBO Endeavour turn, but not turn too far to take us off course. Wow! This was a lot of code, but our K/P1 class was excited now, and determined to take LEGO Dr. Jemison and KIBO Endeavour around the planets. Students scanned the blocks and made KIBO Endeavour blast around the solar system, turning, looping code, beeping, lighting up, and â€œdancing.â€ After exploring the solar system, LEGO Dr. Jemison safely returned back to Earth aboard the KIBO Endeavour.
        <br><p>
        <br><br><p>This K/P1 class was visibly proud of their collaboration, creativity, design thinking, and programming skills. They hugged each other and jumped up and down as Mae Jemison circled the planets in the Endeavour. I am not sure what subject this was, but I am sure that it didnâ€™t matter what it was called. Our young coders researched, artistically designed, communicated with each other, and critically thought about their mistakes on their learning journey. They may have become artists, or scientists, or computer programmers in this class, or possibly all three. It was really up to them. We, the teachers, just had the privilege of traveling with them.
        
            `,  
        images: [
            '/assets/resources/experiences/13/Science-Space-Shuttle-and-Earth-1.jpg',
            '/assets/resources/experiences/13/Science-and-Exploration-Space-and-planets-1-600x450.jpg',
            '/assets/resources/experiences/13/launching-600x450.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Andy Hanes and Miriam Fleury,',
        contributorLink: 'https://www.friendsbalt.org/'
    },
    {
        id: '14',
       title: 'KIBO Obstacle Bowling Activity',
description: '2nd graders put their KIBO coding knowledge to the test in the ultimate game of â€œobstacle bowling!â€',

        fullContent: `
           
            <p>2nd graders put their coding knowledge to the test in the ultimate game of â€œobstacle bowling!â€ Teams of 3 worked together to first code their KIBOS to go and hit down as many bowling pins (paper towel rolls) as possible. Here, they learned the importance of aim, as well as the concept of scanning the same block multiple times (or using the repeat blocks) in order to get the KIBO from one end of the lane to the other.</p>
            <br>
            <p>Once students successfully programmed their robot to get to the end of the lane and knock down the pins, an obstacle was added. We used a beanie baby toy. Groups then had to create a much more complex code sequence and use trial and error to successfully avoid hitting the beanie baby then making it to the end of the lane to hit down their pins. Students exclaimed that it was â€œhard but fun!â€</p>
            <br>
            <p><strong>Tip:</strong> Give your students dry erase boards and markers so that they can keep track of their codes as they go through the testing stage of the challenge.
            <br><p><br>
            <br><strong>Check out a <a href="https://x.com/MsKellyKnight/status/1040580236382019584" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">video of the studentsâ€™ bowling success</a> at Kellyâ€™s Twitter feed.</strong>
            <br><p>
            P.S. Our new KIBO Activity Center Guidebook includes a lesson plan on KIBO Bowling.
        
            `,
        images: [
            '/assets/resources/experiences/14/Kelly-Knight-obstacle-bowling.webp'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Kelly Knight, teacher at Riverside Presbyterian Day School in Jacksonville, FL,',
        contributorLink: 'http://www.rpds.com'
    },
    {
        id: '15',
        title: 'Coding and Making with the Gray Whales',
description: 'This cross curricular activity brings research, science, arts and crafts, and coding together to bring the KIBO migrating whale to life.',

        fullContent: `
           
            <p>As part of the Tuftâ€™s University Graduate Certificate Program in Early Childhood Technology, music teacher and KIBO Ambassador Kitty Rea developed a STEAM (Science, Technology, Engineering, Arts, and Math) summer camp called Coding and Making with the Gray Whales. Kittyâ€™s music school is located just south of San Francisco along the California coast in Half Moon Bay. Gray whales are regularly from there on their 12,000-mile round-trip migration from the nursery lagoons in Baja, Mexico, to the Arctic feeding grounds in the Bering Sea.</p>
            <br>
            <p>During the five full days of camp, students sang and played along to songs about the gray whale, KIBO and the engineering and design process; planned, designed and stocked a â€œBaja Busâ€ to take us on our imaginary drive and camping trip to Mexico; read books and watched videos about gray whales; experiments and practiced programming a KIBO; studied the migration route on a painted floor map and Google maps; made lagoons for the whales to feed and frolick during their 20-hour-a-day eight-week-long migration; measured and drew a lifesize baby whale (15 feet long) and momma (50 feet); built prototype baby whales from aluminium foil to learn about whale anatomy; created larger whales from paper mache; and finally programmed their KIBO with their whale on top to migrate from Baja to the Pacific Northwest. All successfully completed their migration and were rewarded with Goldfish snacks all aroud.</p>
            <br>
            <p>Campers earned "Expert Badges" in gray whales, engineering, programming, KIBO, kindness and, a teacher favorite, clean-up. Everyone went home with a design and information journal, their own lagoon, two whales and brains filled with gray whale facts and new coding skills.
        
        
            `,
        images: [
            '/assets/resources/experiences/15/Baby-foil-whales-on-painted-floor-map-300x291.jpg',
            '/assets/resources/experiences/15/Expert-Badges-1024x182.webp',
            '/assets/resources/experiences/15/Migrating-whale-KIBO.webp',
            '/assets/resources/experiences/15/Momma-and-baby-enjoy-eating-in-their-lagoon-scaled-300x235.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Kitty Rea, Ms. Kittys Harmony Road Music School',
        contributorLink: ''
    },
    {
        id: '16',
       title: 'Rainforest Animal Stories with KIBOâ€™s Sound Recorder',
description: 'Students used KIBOâ€™s Sound/Record Playback Module to tell stories about their rainforest animals.',

        fullContent: `
        
            <p>Our first graders have been learning about the Amazon Rainforest in their homeroom classes. When they come to STEAM instruction once a week, we explore the themes they are learning about through creating.</p>
            <br>
            <p>In this activity, students utilized the <a href="/KIBO-Tu-Bshevat-lesson-New-Year-for-the-Trees.pdf" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">KIBO Sound/Record Playback Module</a> to help tell stories about the rainforest animals they created. They worked in groups to make a program that included both movement of the animal atop the KIBO, as well as their recordings with animal facts. They then shared their KIBO and rainforest animal creations to the class.</p>
            <br>
            <p>This activity lasted 3 classes over 3 weeks (I see them for 45 minutes each week):
            <br><p><br>
            <ul>
                <li>-The first week we researched different animals that live in the Amazon rainforest and began creating our animals from construction paper.</li>
                <li>-The second week we finished making our animals and explored how to most effectively code the KIBOS to show and tell about the animals.</li>
                <li>-In the last week we finalized our recordings and created the code for the KIBOS and attached our rainforest animal creations to the stage. Students worked together in groups of 2 or 3 to program their KIBOS, make their voice recordings, and attach the animals to the stage module. We shared as a class.</li>
            </ul>
            </p><br>
            <p>Note: Going into this, the students were able to draw on some prior experience. The 1st graders had been exposed to KIBO last year, over 4 meetings, where I went through discussing the blocks and modules, practicing scanning, and making simple programs. To review this year we did 3 classes of practicing programs and reviewing the use of sensors and the new sound recording module.</p>
            <br>
            `,
        images: [
            '/assets/resources/experiences/16/IMG_7869-scaled-1024x768.jpg',
            '/assets/resources/experiences/16/IMG_7892-scaled-1024x768.jpg',
            'https://youtu.be/XvGkwG9wgUE'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Kelly Knight, teacher at Riverside Presbyterian Day School in Jacksonville, FL,',
        contributorLink: 'http://www.rpds.com'
    },
    {
        id: '17',
        title: 'KIBO Dances the Virginia Reel',
description: 'KIBO Dances the Virginia Reel! KIBO is programmed to perform a do-si-do, then two KIBO robots are synchronized to perform the dance.',

        fullContent: `
           
            <p>KIBO Dances the Virginia Reel! For this dance program, we programmed a series of â€œfiguresâ€ (circle with your partner, do-si-do, etc) individually, then linked them together into one long program separated by Wait for Clap blocks. This way the KIBO robots stayed synchronized; it also represented the role of the â€œcallerâ€ in this type of folk dance, who tells the dancers when to start each figure.</p>
            <br>
            <p>Here are images of the program sections:</p><br>
            <p>For more about KIBO curriculum based on dance, check out <a href="/assets/resources/experiences/Dances-Around-the-World-KIBO-Curriculum.pdf" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">"Dances from Around the World"</a> from DevTech Research Group. Music in video: "Virginia Reel" recorded by Mark Geslison and Geoff Groberg <a href="https://geslisongroberg.com/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">(http://geslisongroberg.com/)</a>
        `,
        images: [
            '/assets/resources/experiences/17/3-Do-si-do_sm-150x150.jpg',
            '/assets/resources/experiences/17/4-Promenade_sm-150x150.jpg',
            'https://youtu.be/4Db9gKG-WU0'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'KinderLab Robotics, Inc., ',
        contributorLink: 'https://kinderlabrobotics.com'
    },
    {
        id: '18',
        title: 'Big Robots for Little Kids',
description: 'See the research and development of â€œBig KIBOâ€, and the impact of scale on kidsâ€™ engagement with robotics.',

        fullContent: `
        
            <p>Watch this video about the research and development of a "Big KIBO." This was a project by Miki Vizner at DevTech Research Group. Miki was studying the impact of scale on kids' engagement with robotics. Do kids learn or play differently with a big robot than a small one?</p>
          
        `,
        images: [
            'https://youtu.be/qcsGabpLE0s'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Miki Vizner,',
        contributorLink: 'https://sites.bc.edu/devtech/'
    },
    {
        id: '19',
        title: 'KIBO Coding at Kohl Childrenâ€™s Museum',
description: 'During â€œToying with Techâ€ kids created a coding program and tested and debugged the code to get KIBO through a maze!',

        fullContent: `
           
            <p><a href="https://www.kohlchildrensmuseum.org/programming/dovertechplaylab/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Toying with Tech</a> is a bi-weekly drop in program at the Kohl Childrenâ€™s Museum, located in Glenview, IL (outside Chicago). It is the â€œTâ€ in Kohl Childrenâ€™s Museumâ€™s STEAM Explorers program. Lesson plans focus on foundational coding skills for children 2 through 8 years of age. Toying with Tech activities build on each other, but not all participants have attended previous sessions. Each activity must stand alone and be flexible enough to engage beginners as well as more advanced young coders. To meet the needs of our diverse visitor population and align with the museumâ€™s philosophy of learning through play, Toying with Tech activities must be open-ended and hands-on while promoting creativity and encouraging collaboration. Some of our younger visitors are not yet readers, and there are many home languages spoken by our visitor families. KIBO, with physical blocks that include pictures and words, is a perfect fit for the museumâ€™s philosophy and our visitors.</p>
            <br>
            <p>During the month of August, visitors were able to create mazes with foam blocks and code KIBO through the mazes. Children and adults were busy creating their codes, testing, debugging and creating all over again. The open-ended nature of the activity allowed children to start at their comfort level and continue to increase the level of complexity at their pace. Coding with KIBO blocks instead of on a tablet or computer allowed for more interaction and collaboration. Children created mazes for others to code KIBO to navigate, and more experienced peers assisted new KIBO users.</p>
            <br>
            <p>Learn more about â€œToying with Techâ€ at <a href="https://www.kohlchildrensmuseum.org/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Kohl Childrenâ€™s Museum</a>.
        
            `,
        images: [
            '/assets/resources/experiences/19/KIBO-Maze-1-e1658070594932.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Kohl Childrens Museum,',
        contributorLink: 'http://www.kohlchildrensmuseum.org'
    },
    {
        id: '20',
        title: 'Greek Gods and Robotics',
description: 'See how second grade students used KIBO within an integrated Greek Mythology STEAM lesson at The Steward School.',

        fullContent: `
            
            <p>Daedalus and Icarus stand poised to fly away from the island of Crete. Daedalus warns Icarus not to fly too high lest the shining sun melt the wax holding his carefully crafted wings together, or too low where the swirling blue waves of the ocean would dampen his feathers and weigh him down. At the sound of clapping hands, the characters begin their â€œflightâ€ across a large paper map. Icarus flies higher and higher and then suddenly changes direction and heads for the sea. He spins and beeps and stops on the blue water.</p>
            <br>
            <p>This is all taking place during an integrated STEAM lesson in a second grade classroom. The characters in this Greek myth are made of cardboard tubes, pipe cleaners, feathers, and other craft materials. They sit atop student-assembled robots called KIBOs. The students have written their own versions of familiar myths and programmed the KIBOs to travel through their â€œstory spacesâ€ (giant floor maps theyâ€™ve drawn).</p>
            <br>
            <p>I teach computational thinking and robotics at <a href="https://stewardschool.org/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">The Steward School</a> in Richmond, VA. and this year we introduced the use of KIBOs in our Lower School classes. These ingenious robotics kits offer young children the chance to design, build, customize, and program robots in many configurations. They include a variety of input sensors and outputs such as sounds and lights. The code is constructed by lining up a series of wooden command blocks, each of which has a command symbol, word, and barcode. Students upload the code to the robot by scanning the barcode on each block.
            <br><p><br>
            <p>When the second grade teachers asked if we could collaborate on an integrated study of Greek myths, we considered the KIBOâ€™s potential for fostering the engineering design process, creativity, collaboration, and computational thinking and decided they were the perfect tool to tie everything together. We wanted to create an experience that allowed the children to bring their own ideas and creativity to the table to create something that was personally meaningful. This is at the heart of the the constructionist theory of learning developed by Seymour Papert, a computer science and mathematics professor and researcher at MIT. In fact the KIBO robotics kit was developed by Dr. Marina Bers, a student of Dr. Papert and now a Boston College professor specializing in both child development and computer science.
            <br>
            <p>With any skill or concept, if it is taught in isolation, it has less meaning to a child than when the lesson is presented as a problem involving a personal interest or creation. The child naturally has more of a personal investment in this kind of an activity. They build upon a scaffolding of existing knowledge and interests, constructing new knowledge that is personally meaningful. When the lesson is structured this way, their understanding of the subject will go a lot deeper.
            <br><p><br>
            <p>To begin our project, the classroom teachers, Enrichment Coordinator/Engineering teacher, and I created a timeline of activities that would culminate in the children retelling a Greek myth, using their custom story spaces and their KIBOs (customized to represent a god or goddess). The students would work in groups of three or four. The plans looked something like this:
            <br><p><br>
            <p><strong>Classroom teachers will guide students to:</strong>
            <p>* Read myths.
            <p>* Choose myths for the project.
            <p>* Create written scripts to read as the robot god moves through the story space.
            <p>* Sketch the story space.
            <br><p><br>
            <p><strong>Engineering teacher will guide students to:</strong>
            <p>* Draw the story space on large sheets of paper.
            <p>* Construct the god or goddess that goes on top of the robot platform.
            <p>* Construct auxiliary characters, either 2D on map, or 3D to help tell the story.
            <br><p><br>
            <p><strong>Computational Thinking and Robotics teacher will guide students to:</strong>
            <p>* Construct the robots.
            <p>* Attach the god or goddess construction.
            <p>* Program the robots to travel through the story space maps, stopping at each of the significant locations described in the story script.
            <br><p><br>
            <p>Working in groups required the children to practice more than just STEAM skills. They needed to listen to each other; make decisions as a group; combine their ideas and skills to write their myth script, design and create their god or goddess and their map, and construct and program the KIBO.
            <br><p><br>
            <p>Each group was given a six-inch circle of corrugated cardboard on which to build their characters. The circle had holes punched around the edge and a piece of velcro on the bottom. The students used pipe cleaners, string, or ribbons to stabilize their character in an upright position on their cardboard platform. The platforms were then velcroed to the plastic KIBO platform. In this way the four KIBOs we own could be used by multiple classes. When the character platforms were attached to the KIBOs and the KIBO programs were run, some groups found they needed to do additional work to stabilize their characters. The final characters showed a wide variety of creative skills and engineering expertise.
           <br><p><br>
           <p>When it came to drawing their maps on the large sheets of paper, students had to figure out how to design the map to include locations that, in some cases, involved three-dimensional space. They also had to agree on how to share the responsibilities of drawing the map.
           <br><p><br>
           <p>The groups worked together to construct a program that would move their robot through the story space, stopping at the appropriate places and waiting for sound input before continuing. Some groups opted to include sound and light outputs in their program. Some figured out how to incorporate the repeat loop to shorten their program while still accomplishing their goal.
           <br><p><br>
           <p>On the final day of the project, students gathered around each story map as the authors ran their KIBO programs and read the accompanying scripts. When everyone was finished, we then allowed time to debrief the whole process, reflecting on the challenges they faced and the strategies they developed to overcome these challenges. To our surprise, almost every group focused on the social-emotional challenges this project presented. They pointed out how important it is to give each member of the group time to express their ideas and their frustrations and to acknowledge in a respectful way that each person is heard and their thoughts are valued. They talked about their strategies for collaborating on story writing, robot construction, map drawing, and how to program the KIBO. They also talked about how to deal with group members whose behaviors they found frustrating.
           <br><p><br>
           <p>We all agreed it was a valuable experience. The new school year began last week and we are already making plans for this yearâ€™s integrated KIBO project.
           <br><p><br>
           <p>More photos are available here: <a href="http://www.stewardsnaps.org/2016-17-School-Year/Lower-School/Grade-2-Greek-Mythology-Robots/" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">http://www.stewardsnaps.org/2016-17-School-Year/Lower-School/Grade-2-Greek-Mythology-Robots/</a>




            `,
        images: [
            '/assets/resources/experiences/20/Greek-God.jpg',
            '/assets/resources/experiences/20/History-Greek-Gods-1-600x400.jpg',
            '/assets/resources/experiences/20/Steward-Greek-Robots-062-M.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Robin Ricketts, Computational Thinking and Robotics Teacher, The Steward School, Richmond, VA),',
        contributorLink: 'https://stewardschool.org'
    },
    {
        id: '21',
        title: 'Going on a Bear Hunt â€“ with KIBO!',
description: 'Watch as children read the children\'s book "We\'re Going on a Bear Hunt" and use KIBO to reenact the story!',
        videoUrl: 'https://youtu.be/_xnAmXLRJK4',

        fullContent: `
           
            <p>During the month of August, we completed our last week-long KIBO Robotics Camp here in Washington state. We used the childrenâ€™s book â€œWeâ€™re Going on a Bear Huntâ€ as our theme for the week. The children mapped out the road to the bear cave on a long strip of white banner paper. We then colored in The River, The Forest, The SnowStorm. We used the Expression module for each team to make a picture of their â€œpersonâ€ going on the bear hunt. Children then coded their KIBO robot to navigate through the road. We used the KIBOâ€™s <a href="/shop/extensions" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Sound Recorder/Playback Module</a> to record the children saying:</p>
            <br>
            <p>1) â€œOh, no! Canâ€™t go over it; canâ€™t go under itâ€¦ Gotta go through it!â€ (Repeat 4 times as KIBO went up to and through the River, Forest, Snow Storm)
<p>2) â€œOh, no! Itâ€™s a BEAR!!â€ (As they reached the bear cave and we uncovered the bear cave to reveal a Teddy Bear.)
<p> 3) â€œWeâ€™re not going on a bear hunt again!!â€ (After KIBO reverses back to where he began, crashing into a long body pillow using the Distance Sensor on the back portal.)</p>
        `,
        images: [
            '/assets/resources/experiences/21/Planning-150x150.jpg',
            '/assets/resources/experiences/21/Storytelling-Goin-on-a-Bear-Hunt-1-150x150.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Marsha Odell, Childrens Computer Corner,',
        contributorLink: 'http://www.childrenscomputercorner.com'
    },
    {
        id: '22',
        title: 'Total Eclipse of the Bot',
description: 'In this Astronomy inspired activity, KIBO performs the #TotalEclipseoftheBot. KIBO robots are programmed and synchronized to reenact a total eclipse.',

        videoUrl: 'https://youtu.be/3rJ4H_bEhPc',
        fullContent: `
           
            <p>KIBO can integrate with different curriculum areas with robotics and programming. Astronomy, anyone? Check out this fun example where we perfom the #TotalEclipseoftheBot. This reenactment of the total eclipse using KIBO is to commemorate and celebrate the momentous occasion of the Eclipse on August 21, 2017. These KIBOs are using our Expression Module to hold their celestial objects.</p>
            
        `,
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'KinderLab Robotics',
        contributorLink: 'https://kinderlabrobotics.com'
    },
    {
        id: '23',
        title: 'KIBO Celebrates 100th day of School at Yavneh Academy',
description: 'First Graders and their KIBO robots celebrated the 100th Day of School with their KIBOs dancing a happy dance!',

        fullContent: `
            <h2><strong>First Graders at Yavneh Academy, in Paramus, New Jersey, celebrate the 100th Day of School with KIBO!</h2></strong>
            <br>
            <p>Not only were the students excited for the 100th day of school, but so were our KIBO robots! During the week of the 100th day of school, our engineering design challenge was to program the KIBOs to dance a happy dance and make their way down a path to Yavneh Academy to celebrate with our school mascot â€“ the Redhawk!</p>
            <br>
            <p>New programming options were introduced for this experience. The students learned about repeats, loops, and parameters; as well as new vocabulary, as we discussed destination icons. Working in teams, the students selected their favorite ways to make 100 and wrote their math equations on KIBOâ€™s new expression modules! It was amazing to watch the teamwork in action, as the students created complex sequences with the blocks. Each KIBO danced with varying styles, and it was a magical sight to watch the children cheer on the robots as they partied all the way to Yavneh! 100th day of school â€“ here we come!</p>
        `,
        images: [
            '/assets/resources/experiences/23/2b9343b3-98db-4204-ae6d-ceb05659d41a.jpeg',
            '/assets/resources/experiences/23/fb482bc9-4c7c-4a52-a7bc-ec40357616a9-960x720.jpeg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Chani Lichtiger, Director of Technology & Curriculum Design Innovator and Mrs. Laurie Beckerman, First-grade Teacher, Yavneh Academy, NJ,',
        contributorLink: 'http://www.yavnehacademy.org/'
    },
    {
        id: '24',
        title: 'Introducing KIBO to 2nd Graders',
description: 'KIBO is introduced in a step by step approach â€“ from learning the features of robots, to basic programming and then onto creating more complex â€œprogramsâ€.',

        fullContent: `
            <h2>I used the KIBO to introduce second graders to coding concepts. We started with a discussion about the features of robots, then I introduced KIBO to them and we talked about how it is a robot. Initially, I only gave them the movement, sound, light and wait for clap blocks and allowed them to become familiar with creating â€œprogramsâ€ to control KIBO.</h2>
            <br>
            <p>On the second day, I introduced the REPEAT block, first with the numbers, then gave them to UNTIL NEAR and UNTIL LIGHT tiles (along with flashlights) and related to how we are constantly using repeat-until logic in real life.</p>
            <br>
            <p>On day 3, I handed out the IF block and the tiles that go with that. Finally, we got into the nested IF inside the REPEAT loop. Students had challenges along the way â€“ make a square, make a zigzag, make a crazy car that looks like it bounces off the walls and backs up and spins when it encounters an obstacle, make a school bus that stops each time you shine your light and continues on its way when you clap, etc. Students loved working with the KIBOs and were able to grasp these coding and logic concepts as well as a good dose of teamwork and perseverance!</p>
        `,
        images: [
            '/assets/resources/experiences/24/IMG_2665.jpg',
            '/assets/resources/experiences/24/Using-Sensors-scaled-768x1024.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Sandy Bader, Technology Integrator, Susie C. Altmayer Elementary School, De Pere, Wisconsin,',
        contributorLink: 'http://www.depere.k12.wi.us/altmayer'
    },
    {
        id: '25',
        title: 'Engineering a KIBO Carousel',
description: 'The students at the First Skool created a carousel with KIBO â€“ by going through the design process, coding, collaboration, and problem solving.',

        fullContent: `
            <h2>The PlayMaker Programme launched by the Singapore Infocomm Media Development Authority of Singapore (IMDA) introduced a suite of technology-enabled toys to pilot at 160 preschool centres as a start. KIBO was selected as one of tech toys, and Westgate Centre was one of the preschool centres that embarked on PlayMaker. The centre has been championing the use of tech-enabled toys and constantly reviewed the use of these tech-enabled toys for teaching and learning. They shared the following description of a KIBO activity the students and teachers undertook together.<h2>
            <br>
            <p>â€œRecently, the K1 children from Westgate Centre have shown curiosity and interest in a carousel ride that was set up near Westgate Mall (where the centre is located) during one of their outdoor lessons. They were particular curious about the way the carousel moved. The teachers and children then decided to create a carousel as part of their project to showcase the use of technology at an upcoming Learning and Sharing Festival.
            <br><p><br>
            <p>Various pictures of carousels were shown to the children as a reference. The children and teachers planned and decided on the design and colours of the carousel, working together in creating a carousel of their own. After designing, the children decided that they wanted to make the carousel spin like the real carousel they saw at the mall.
            <br><p><br>
            <p>The K1 children and teachers tried to make the carousel spin by programming KIBO with the â€œspinâ€ and â€œrepeatâ€ blocks (i.e. repeat spinning). They observed that this programming caused KIBO to spin too quickly and the carousel kept â€œflyingâ€ off.
            <br><p><br>
            <p>The K1 teachers decided to seek other level teachersâ€™ opinions. Teachers discussed collaboratively and tried different programming blocks such as â€œbeginâ€, â€œrepeatâ€, â€œforeverâ€, â€œturn rightâ€, â€œend repeatâ€ and â€œendâ€. They noticed that the spinning slowed with pauses in between each right turn, but the carousel was still falling off. After various attempts, the teachers observed that the movement of the wheels were spinning the carousel off KIBO. So in their final attempt, they removed KIBOâ€™s wheels (who said KIBO always need wheels?) and found that the carousel stayed intact and was able to spin at the same place!
            <br><p><br>
            <p>Westgate carousel was finally spinning like a carousel, but one of the K1 children highlighted to her teachers on the use of light bulb to light up the carousel like the real one. â€œLightâ€ blocks were immediately put to good use together with the 4 coloured light bulbs and Westgate carousel was finally completed!
            <br><p><br>
            <p>Though it may appear to be a simple carousel, the teachers and children went through a process to solve different problems they encountered throughout the project, and they were also required to communicate with their peers and teachers on the design and to solve the problems they faced. The used of tech-enabled toys allowed teachers and children to â€œtinkerâ€ with opportunities to constantly try and redo. This project helped both our teachers and children learn through play and also built a wonderful carousel that they were very proud to showcase at the Learning and Sharing Festival.â€
        `,
        images: [
            '/assets/resources/experiences/25/KIBO-Carousel.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'My First Skool, Singapore,',
        contributorLink: 'http://www.myfirstskool.com/'
    },
    {
        id: '26',
        title: 'Project Integrating the Engineering Design Process',
description: 'Read about a first grade classroom experience blending engineering, arts, and Judaic studies. The KinderLab Engineering Design Process guided this experience.',

        fullContent: `
            <h2>As the first graders in my class at Yavneh Academy studied the biblical story of Noah and the ark, we integrated the introductory lesson of engineering from KinderLab Robotics. The children learned about the building of the ark and all the challenges that Noah encountered while constructing it. The arkâ€™s blueprints were given to him by God and he had to follow the instructions. Similarly, the students were introduced to the engineering process: ask, imagine, plan, create, test, improve and share.</h2>
            <br>
            <p>They were exposed to different objects that have been engineered. They compared objects which were created to others which are found in nature. We discussed the process of engineering while observing the objects. For example, we looked at a glue stick, scissors, crayons and a desk. These were all objects that were relatable to the students. The question was asked, â€œWhy were these invented?â€.</p>
            <br>
            <p>What was the need to create these items? After much discussion and conversation, the challenge for the students was to build a boat that will be sturdy, three stories high, and strong enough to float for three minutes. Additionally, it needed to accommodate Noah, his family and a few plastic animals. The ark must allow for supplies for the animals and Noahâ€™s family.</p>
            <br>
            <p>Various materials were available for the challenge, including recyclable containers of different sizes, popsicle sticks, colorful duck tape, paper options, pipe cleaners, cotton balls, bottle caps, etc.. The students worked cooperatively in small groups. Teamwork guidance was provided and collaborative work was highlighted. Conversations amongst the students were echoing in the classroom as they planned their groupsâ€™ arks.
            <br>
            <p>Following the construction process, the students tested their models in a tub of water. Using a timer for three minutes, the students waited patiently to see if their ark was a successful construction. For those that did not succeed the challenge, they went back to the drawing board to figure out what improvements needed to be made to meet the challenge.
            <br>
            <p>Each group shared their plan in detail, their challenges, tests and outcomes. Some quotes were:
<p>â€œIt was fun to work together because we all had different ideas and then it turns out really niceâ€
<p>â€œWe put the people on the top floor to be away from the smelly animals on the first floorâ€
<p>â€œWe made a basket to catch fish from the waterâ€
<p>â€œWe felt like Noah building his arkâ€
<p>â€œIt tilted a little so we put another pipe to balance itâ€
<p>â€œWhere will the toxins go?â€
        <br><p><br>
        <p>What an amazing experience as the first step of our year long journey of incorporating the engineering process into our Judaic Studies first grade curriculum.
        <br><p><br>
        <p>Note: The Engineering Design Process is central to the KIBO curriculum, and it applies to lots of different activities. You can purchase KIBOâ€™s <a href="/shop/learning-materials" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Engineering Design Journals</a> and the <a href="/shop/learning-materials" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Engineering Design Process classroom poster</a> from our shop!
        
            `,
        images: [
            '/assets/resources/experiences/26/IMG_0135-300x225.jpg',
            '/assets/resources/experiences/26/IMG_0147.jpg',
            '/assets/resources/experiences/26/IMG_0172.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Rahel Grebler, Yavneh Academy, Paramus, NJ,',
        contributorLink: 'https://www.yavnehacademy.org/'
    },
    {
        id: '27',
        title: 'KIBO Engineering in a Summer STEM Program',
description: 'Learn how PreK kids used KIBO and its Engineering Design Journals during an exciting four-day STEM summer program focused on simple machines and creativity.',

        fullContent: `
            <h2>I used KIBO and itâ€™s Engineering Design Journals in a four-day STEM summer program for Pre-K kids this summer. I wanted to focus on Simple Machines and include the KIBO robot which has wheels. I decided to focus on â€œForceâ€ <strong>my first day</strong>. We swung a beach ball pendulum and talked about how things need force in order to move. We explored friction by pushing a brick on the rug with nothing under it, then placing some pencils under it and pushing it over the pencils. The children noted how much easier the brick moved with the pencils underneath.</h2>
            <br>
            <p>We broke into groups and my helpers did activities with different simple machines such as inclined planes and marbles (marble mazes), horizontal and vertical pulleys (carrying a load over a paper river, and using a wand magnet on a vertical pulley to pick up metal objects), using different weights of pendulums to â€œbowlâ€ over different sized and weighted bottles, and my station, which was learning about how the KIBO robot moves. We learned the robot parts song and learned that the batteries provide the force necessary to make the robot move. I gave each child (4 or 5 in each group) his own robot and a few blocks. I told them that the â€˜beginâ€™ block means â€˜goâ€™ and is like using a capital letter at the beginning of a sentence and the â€˜endâ€™ block means â€˜stopâ€™ and is like using a period. After telling them they always needed a begin and end block, I let them arrange the movement blocks any way they desired. I then helped them scan their programs. I also introduced the â€œoutputâ€ sensors during this first session.</p>
            <br>
            <p>Using the individual journals, I had them make a plan for what they would like to turn their robot into â€“ a vehicle, and animal, or a person. I had recycled materials available for them to make one of those things. I also prepped some cardboard circles and rectangles so the children could build their creation on the cardboard and clip it onto the rotating or stationary platforms.</p>
            <br><br><p><br><br><p><br>
            <p>On <strong>Day Two</strong>, right when the children came in, I had set up the craft materials on the tables. The children who had planned to make people had materials such as paper towel tubes, styrofoam balls, yarn, google eyes, pompoms, paint, and construction paper. My three helpers and I helped each child complete what they wanted to make, taping them onto the cardboard platforms I had cut. We had 17 pre-k kids making their creations at one time!
            <br><br><p><br>
            <p>After each child had gotten a good start on their creation, I put them aside and we went to Circle. At Circle we sang the robot parts song and the Engineering Design Process song (to Twinkle Twinkle). When we broke into groups, each of the previous dayâ€™s groups used the simple machines to make something to take home. The â€˜inclined planesâ€™ group made marble mazes on large cardboard pieces using masking tape and towel rolls. The â€˜pendulumâ€™ group used cone pendulums filled with paint and made paintings by swinging the different colored paint pendulums different ways over a poster board sheet. The â€˜pulleyâ€™ group used a shoe box and a straw and some string with a paper egg carton bucket to make a vertical pulley to lift a load of pompoms.
            <br><br><p><br>
            <p>The KIBO group with me learned how to use the â€˜inputâ€™ sensor â€“ the ear. I showed the children how to program the â€˜wait for clapâ€™ command in. We worked on learning to become master â€˜scannersâ€™ and â€˜programmersâ€™ and I stamped each childâ€™s checklist as they accomplished a different level in programming.
            <br><p><br>
            <p>Beginning from the first day, I had spread a very large cardboard sheet out on the floor for us to work with the robots on. The plan was to invite the children to create a road on which their robots would drive. The children used construction paper an glued it down using glue pots with paint brushes. Each group took turns adding to it. They used unit blocks to build houses, playground equipment, and added toy people to the scene.
            <br><br><p><br>
            <p><strong>Day Three</strong>, when the children came in, they finished up making their creations so we could concentrate on developing their final program for day four when their parents would come to watch. At Circle we sang the two songs again and also sang the KIBO pokey song, performing it. I used the command cards and let each child add a command, then we all performed the program. I used the blocks and showed them how to program the robot to do the KIBO Hokey Pokey. All the groups continued rotating through the different activities, and played with Kâ€™nex, Magformers, Wooden marble toys, and legos during down time. I might add that I had purchased several books on force, friction, inclined planes, pulleys, etc. and read one each day.
            <br><br><p><br> 
            <p>My KIBO groups worked on programming and scanning and learned to use â€œrepeat/end repeatâ€ blocks. My assistant had finished pendulum painting with all the kids, so I had her help each child complete pages in their Journal â€“ she took dictation about what their creation was, and I had copied extra pages with the programming icons, cutting them and placing them on trays for the children to pick up and glue in their journal to show the program they wrote. She helped them do this and also they also told her which sensors and attachments they had used. We didnâ€™t have time to revise programs in the journal or finish all of the pages but I thought they could work on the â€˜quizâ€™ at home with parents.
            <br><br><p><br>
            <p><strong>Day Four</strong>, we continued singing the songs and discussing force and friction. Each day we had gone outside and used a couple of very large sheets of cardboard to make a slide on the grass hill. We had races â€“ sitting on our shorts, sitting on a piece of cardboard, and sitting on a piece of waxed paper. The children concluded that the waxed paper was fastest because there was less friction. I wanted to get into the wheel and axle, making little milk bottle cars with a straw axle and milk cap wheels, but we just ran out of time.
            <br><br><p><br>
            <p>While children chose different STEM activities, one of my helpers made catapults with them out of old markers, tongue depressors, plastic spoons, and rubber bands. They made a target and shot pompoms at it.
            <br><br><p><br>
            <p>My assistant continued helping children finish in their journals, while I let the kids work on decorating the stage for their robot performances. When it came time for the parents, each child used two bull-nosed clips to clip their cardboard platform onto the wooden platform. They demonstrated making the block sentence, then scanning it and making KIBO move.
            <br><br><p><br>
            <p>Some of the children mastered scanning by themselves. I was really impressed! Especially since we had only 4 mornings to work on programming! All of the parents were so impressed, and daily children were heard on more than one occasion saying, â€œ<strong>This is the best camp Iâ€™ve ever been to!!!</strong>â€ I had lots of great comments from parents, too.

            `,
        images: [
            '/assets/resources/experiences/27/Kids-with-KIBO-says-cards-530x764.jpg',
            '/assets/resources/experiences/27/Kids-with-KIBO-says-cards.jpg'
        ],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Nancy Kincaid, Preschool Teacher, Suncrest Primary School, Morgantown, WV,',
        contributorLink: 'http://ses.mono.k12.wv.us/'
    },
    {
        id: '28',
        title: 'KIBO the Cave Explorer at PS321',
description: 'Kids use the engineering design process to develop a KIBO robot cave explorer and learn communication skills, collaboration, problem solving skills, and perseverance.',

        fullContent: `
            <h2>Iâ€™ve been working with New York City public schools as a STEM curriculum writer, and teacher for the past 10 years. Two years ago, a new and wonderful opportunity to teach lessons in coding using KIBO robots came to me. Since then Iâ€™ve recognized that KIBO is not only a fantastic tool for teaching coding, but itâ€™s also a great tool for teaching students about the role of technology in our lives, communication skills, working in groups, problem solving skills, perseverance, and much more.</h2>
            <br>
            <p>Today, robots are firefighters, explorers, and they help in the operating room too. With KIBO our youngest students can start to realize the great potential robots have for improving our lives. The curriculum Iâ€™ve written for KIBO uses the roles robots play now and will play in the future as a unifying theme.</p>
            <br>
            <p>Our KIBOâ€™s take on some important jobs. In one lesson, students program them to rescue baby bears that are lost in deep dark caves. (Our caves are constructed with old cardboard boxes, the imagination of the students dresses them up.) They love to train KIBO to navigate the twists and turns of our caves. Most of all, they love programming with the light sensor and the light- if the cave gets dark and scary, then KIBO should turn on her flashlight!</p>
            <br>
            <p>To get through those caves students need to measure. How will they measure? Will they simply guess the measurement? Will they use some prior measurement knowledge, or use another method? KIBO allows you to introduce problem solving techniques that students can rely on for the rest of their lives. Some ones that we go over are:
            <br><p><br>
            <p>* Trial and Error â€“ If students havenâ€™t seen anything like your current situation you can expect to be teaching a lesson about TRIAL AND ERROR problem solving.
            <br><p><br>
            <p>* â€œHave I seen this before?â€ â€“ If students have seen something comparable you can emphasize that they should use what they know to solve the problem. When faced with a problem itâ€™s so important for students to ask â€œHave I seen something like this before?â€
            <br><p><br>
            <p>* Little Bite Size Pieces â€“ For the caves we use cardboard boxes. We stitch them together to make one huge cave that has lots of twists and turns. Students see a big problem. Thatâ€™s a great time to teach students how to break a big problem into little bite size pieces.
            <br><p><br>
            <p>From my perspective, the most valuable lesson students learn with KIBO is how to deal with something that doesnâ€™t go exactly the way they wanted it to. They learn about perseverance. When a groupâ€™s KIBO doesnâ€™t do the things they want it to do, the group understands that itâ€™s time to ask a few questions â€œWhat worked? What didnâ€™t?â€œ and â€œHow can I fix it?â€. They learn to evaluate a situation, reprogram KIBO, and try again. Our class mantra is â€“ â€œNo Tears Just Good Idearsâ€.
            <br><p><br>
            <p>Keri Goldberg, a first grade teacher at PS 321, said â€œ<strong>The students in my class couldnâ€™t wait to get their hands on the coding blocks that would make their KIBO robots go. The lessons had a true spirit of experimentation â€“ there were no mistakes, just lots of trials, observations, and cheers to get back to work! I wouldnâ€™t be surprised if the future programmers and scientists among them remember this experience as one that sparked their interest in coding and creative problem solving.</strong>â€
            <br><p><br>
            <p>A class with KIBO weaves together so many essential skills. This little robot gives our youngest students the opportunity to have a deep, and exciting engineering experience.
            



            `,
        images: [experience28Image1],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Brian Sulkow (aka "Professor Pi"), New York Public Schools, PS321, Brooklyn, NY,',
        contributorLink: 'http://ps321.org'
    },
    {
        id: '29',
        title: 'A First Grade Classâ€™ KIBO Journey',
description: 'Using KIBO, first graders learned to sequence, analyze, and organize their ideas, and learned programming, collaboration skills and an appreciation of roles.',

        fullContent: `
            <h2>When first graders at Yavneh Academy in Paramus, NJ use KIBO, they learn a whole new form of communication that translates into every aspect of their academic and social activities. The first graders in Laya Levine and Rahel Greblerâ€™s class used KIBO to further their thinking about various units of study. In the process, they learned to sequence, analyze,  and organize their ideas. They also gained introductory programming, collaboration skills and an appreciation of roles.</h2>
            <br><p>
            <p>Yavnehâ€™s first graders used their KIBO robots to explore and enhance their units of study. For example, while learning about the Native Americans, KIBO visited model teepees, a Pilgrim home, and a garden.  After some practice with the basics skills of programming and scanning, the class began to incorporate the light sensor into their thinking about animals. The students learned that birds migrate south in the winter. They created birds which they used to decorate their KIBOs. Then, they used the light sensors to help their robotic birds travel to warmer climates. Similarly, while studying nocturnal animals, the parameter â€œuntil lightâ€ was incorporated so that the â€œanimalsâ€ would not come out of their homes until the light of the moon appeared.</p>
            <br><p>
            <p>Additionally, students worked in small groups and became familiar with the sound sensors and the Wait for Clap block. While the students sang â€œIf Youâ€™re Happy and You Know Itâ€ they programmed their KIBO to dance upon hearing the clap.</p>
            <br><p>
            <p>At the end of each session, the students gather in a circle on the floor and express their learning, any problems they encountered and the solutions they developed while programming their KIBOs.  Each student kept a journal entry for every lesson in their <a href="/shop/learning-materials" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline; font-weight: 500;">Engineering Design Journal</a>. This enhanced their writing skills and kept them focused on the topic at hand.  With each lesson the students have become more proficient in programming, scanning, problem solving and collaborating.  The atmosphere continues to be engaging and inspiring, where everyone is successful.
            <br><p><br>
            <p>The collaboration and high level planning and problem solving skills are evident throughout this process. When the KIBOs are being used, the energy in the room is charged with the students working together to learn the new programing skills and combine it with previous knowledge.
            <br><p><br>
            <p>â€œ<strong>There is so much teamwork, planning, strategizing, and trial and error. The room is alive with children completely engaged in hands on learning. It is an incredible opportunity for our class, </strong>â€œ Laya Levine, a first grade teacher at Yavneh Academy, expressed. Through KIBO, the students have learned coping and persistence. They have gained skills that will support them throughout their academic careers in and outside of school.
            <br><p><br>
            <p>In the same class, Rahel Grebler, the Judaic studies teacher, incorporates KIBO programming in her curriculum throughout the year. As a culminating project, the students are divided into small groups. Each group is responsible to â€œdressâ€ their KIBO for Yom Yerushalayim (Jerusalem Day).  Then students plan for their road trip from different locations in Israel  to their specific gates of Jerusalem.  A large visual map is placed in the center of the classroom floor, with roads leading to the gates. Each KIBO is then programmed to leave their specific location, for example, Tel Aviv or Haifa, and continue down the road through their respective gates. Each group has a special Israeli song which they sing as the KIBOs arrive. The excitement in the room is palpable and adds to the mood of this exciting day. The learning that takes place as a result of KIBO is concrete and makes the studentsâ€™ understanding of the subject quite clear.
            
        
        
        
        
            `,
        images: [experience29Image1, experience29Image2],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Chani Lichtiger, Director Educational Technology, Yavneh Academy, Paramus, NJ,',
        contributorLink: 'http://www.yavnehacademy.org/'
    },
    {
        id: '30',
        title: 'KIBO Engineering with RAPP',
description: 'Watch a small group lesson of 4-year olds working with KIBO â€“ learning programming concepts, estimating distances, coding, and debugging.',

        fullContent: `
            <h2>In this video, Dr. Deborah Carlson is teaching a small group lesson to 4-year olds at the All Saints Early Learning Center, Jacksonville, FL. They are focusing on concepts the children have been working on for the past month: estimating distances; order of a programming sequence for KIBO; scanning KIBOâ€™s program and matching it to the program KIBO acts out; and reviewing/sharing what went right and what needed to be fixed.</h2>
            <br><p>
            <p>This KIBO Experience is part of the Robotics and Programming for Pre-K (RAPP) initiative at the Florida Institution of Education at the University of North Florida.</p>
            
        `,
        videoUrl: 'https://youtu.be/yPCszl4mxXY',
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Dr. Deborah L. Carlson, Florida Institution of Education at the University of North Florida, Jacksonville, FL,',
        contributorLink: 'https://www.unf.edu/fie/'
    },
    {
        id: '31',
        title: 'Reenacting the Iditarod with KIBO',
description: 'In this video, watch as first grade students reenacting the famous Iditarod Race in this cross-curriculum project. Children create and code KIBO to race!',

        fullContent: `
            <h2>In this video, watch as first grade students recreate the famous Iditarod Race. Children create and code KIBO to get the medicine to to those that needed this lifesaving treatment.</h2>
            <br><p>
            <p>This project based cross-curriculum project incorporates math, measurement,  history, writing, reading, creativity, and technology with KIBO. The learning outcome includes perseverance, troubleshooting, and problem solving, just like the Iditarod race.</p>
            
        `,
        videoUrl: 'https://youtu.be/FCVH91RLK_U',
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Brenda Dolan, First Grade Teacher, JCDS Boston, Watertown, MA,',
        contributorLink: 'https://www.jcdsboston.org/'
    },
    {
        id: '32',
        title: '3rd Graders introduce KIBO to Kindergarten Buddies',
description: 'In this KIBO Experience, third graders introduce their Kindergarten buddies to KIBO and instruct them to learn coding!',

        fullContent: `
            <p>Last year, when my school placed an order for its first KIBO, I thought Iâ€™d test it and then it might take residence in a kindergarten or first grade homeroom.
            <br><p><br>
            <p>UPS delivered the KIBO box and it was waiting to be unpacked in the computer lab. Thatâ€™s where my colleague and I store robots and maker supplies, and also where we teach our third through eighth grade design, programming, and robotics classes.
            <br><p><br>
            <p>When the third graders discovered the unopened package, they were curious. To build upon a teachable moment, that group of eight and nine-year-olds and I unpacked the KIBO parts and immediately started constructing programs with the wooden blocks. We scanned them and set our first KIBO into motion.
            <br><p><br>
            <p><strong>A New Plan</strong>
            <br><p><br>
            <p>This school year when I worked with our Academic Dean and our Technology Director to purchase four more KIBOs, I had a plan. The third grade tech students would become facile with our fleet of five KIBOs, develop some sample programs, and create original outfits. During their scheduled time with their kindergarten buddies, the third graders would introduce the five and six-year-olds to KIBO.
            <br><p><br>
            <p>In their Tech class, I asked the third graders to come up with three sample programs for the kindergarteners: one easy, one medium and one that they considered hard. Here are three of their â€œeasy programs:â€
            <br><p><br>
            <p>They considered these two programs to be of medium difficulty:
            <br><p><br>
            <p>Not surprisingly, when I first asked students to construct difficult programs, most of the groups made very, very, very long combinations of blocks. They werenâ€™t necessarily using the syntax and commands that I, as their programming instructor, considered the most challenging.
            <br><p><br>
            <p>I moved around to different groups and posed questions:
            <br><p><br>
            <p>â€“ Is there a way to get KIBO to respond to user input, i.e. a clap?
            <br><p><br>
            <p>â€“ What if your KIBO only started singing when it became light?
            <br><p><br>
            <p>â€“ How can you code KIBO so it backs up when it hits a wall?
            <br><p><br>
            <p>After these targeted questions, some different types of problems started to get solved. Children began to create sample difficult programs that were shorter but that included â€œifâ€, â€œend ifâ€, â€œwait for clapâ€, â€œlightâ€ and â€œnearâ€.
            <br><p><br>
            <p>As we got ready to teach KIBO to the kindergarteners, we also compared Scratch and KIBO commands. For example, they remarked that placing a start block in the code and then touching KIBOâ€™s green arrow was the equivalent of placing the â€œWhen green flag clickedâ€ block in Scratch and then actually clicking on the green flag on the top right side of a Scratch window. Using â€œIf nearâ€ was like dragging out the â€œif touchingâ€ Scratch block like they had done for an earlier Scratch assignment.
            <br><p><br>
            <p><strong>Problems, Solutions, and Surprises</strong>
            <br><p><br>
            <p>I canâ€™t say that at every moment my third grade students were solving higher level problems. A visitor to my classroom noticed that at times they were simply excited about the playful and age-appropriate challenge of getting KIBO to reach a target which was a friend stationed at the other side of the room. At times the groups had difficulty collaborating. This could happen when it was taking a long time to scan a very long sequence of commands, when the students were encountering low battery issues and needed to change them, or when they constructed a string of code with a syntax error. Another frustration that students encountered was a spinning KIBO that wasnâ€™t programmed to spin. We learned that this problem was caused by one of the wheels being upside-down. When they fixed this by putting the wheel in the opposite way, it was satisfying! Sometimes when children were waiting for someone else to scan, they peeled off to design and construct an outfit.
            <br><p><br>
            <p>Despite the logistical or technical problems we encountered along the way, on the day we were to go to the kindergarteners with KIBO, excitement ran high. Watching the kindergarteners get to know KIBO with their buddies was a delight for me and the homeroom teachers who were there.
            <br><p><br>
            <p>In addition, new opportunities for learning through troubleshooting arose as the third graders taught their buddies about KIBO.
            <br><p><br>
            <p>One group of students was having trouble getting their â€œhardâ€ program to work. They had come up with code that caused KIBO to make sounds and move when it was exposed to a light source. In the computer lab, they tested this program by bringing KIBO to a strong fluorescent light high on the wall. During buddy time, the kindergarten room was beautifully sunny, but its natural light was more diffuse. With no single light source as concentrated as the one in the computer room, the â€œhardâ€ program that the group planned to show their buddies didnâ€™t work. This group adroitly changed their code so that KIBO began to move and make sound when it was in a darker rather than a lighter space. To create that dark space for KIBO, they used a kindergarten smock over a large plastic container.
            <br><p><br>
            <p>By the end of this project, the third graders had been exposed to fundamental programming concepts such as â€œifâ€, â€œuntilâ€, and â€œforever,â€ and they learned about the importance of proper syntax. They had done a lot of on-the-fly troubleshooting. We talked about these concepts and fixes as an entire group. In creating outfits, the costumers were beginning to solve their engineering problems such as how to get a costume to stand up straight like a shipâ€™s figurehead or the face of Thomas the Train, or how to create an overhang on the art platform that did not interfere with KIBOâ€™s controls or scanning mechanism.
            <br><p><br>
            <p><strong>Plans for the Next Time</strong>
            <br><p><br>
            <p>I am grateful to the administrators and teachers of Friends Seminary â€“ our Principal, our Academic Dean, our Technology Director, Lower School Head, and the Third Grade and Kindergarten teachers â€“ for their support for trying out new materials with the children and for their understanding that new materials and activities do not always run without a hitch the very first time. Our Lower School robotics curriculum is still a work in progress. We had a delightful time getting to know KIBO, programming it to do very interesting things, and making sure that it has plenty of fabulous outfits to wear on outings in and around our school.
            <br><p><br>
            <p>Next year, when the third graders prepare to take KIBO to the kindergarten, I will create activity cards with the programming questions that I asked informally. It might also be helpful to provide more guidance to the costumers, to encourage them to confront and begin to solve interesting engineering challenges. I think that the third graders naturally gave the kindergarteners an opportunity to begin to create their own programs, but next time around I think Iâ€™ll be more explicit about the importance of letting the kindergarteners try out some of their own ideas.
            <br><p><br>
            <p>I will also be careful not to provide so much structure that I prevent the children from making their own connections and bringing their natural playfulness to the process.
            
            `,
        images: [experience32Image1, experience32Image2, experience32Image3, experience32Image4, experience32Image5, experience32Image6, experience32Image7, experience32Image8, experience32Image9, experience32Image10, experience32Image11, experience32Image12],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Judith Seidel, Lower School Technology Integrator Friends Seminary, New York, NY,',
        contributorLink: 'http://www.friendsseminary.org/'
    },
    {
        id: '33',
        title: 'Creating Animals from Singapore Zoo',
description: 'Watch early childhood educators and practitioners across Singapore participate in a KIBO training to learn how robotics could be integrated in the classroom.',

        fullContent: `
            <p>Watch this training event that was given to over 200 early childhood educators and practitioners from 68 preschools across Singapore. This KIBO training shared how robotics can be easly integrated in the classroom in a playful developmentally appropriate way.
            <br><p><br>
            <p>The training was part of the PlayMaker Symposium, led by the Education Team at the Infocomm Development Authority of Singapore (IDA), which introduced a suite of technology-enabled toys to preschool centers to enrich the learning experience for the children fostering creativity, problem solving and confident learning. During the training educators created, desgined and programmed KIBO robotic animals, and â€œtrainedâ€  them to perform tricks, similar to the ones they be observed at the Singapore Zoo.
    
        `,
        videoUrl: 'https://youtu.be/1r0SDBXZbpY',
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'PlayMaker Symposium, Infocomm Development Authority of Singapore (IDA),',
        contributorLink: 'https://www.imda.gov.sg/'
    },
    {
        id: '34',
       title: 'Childrenâ€™s Museum Implements KIBO',
description: 'See how the Knock Knock Childrenâ€™s Museum has playfully implemented the KIBO robot. Check out the fun KIBOwling activity during the Cardboard Challenge.',

        fullContent: `
            <p>Cate Heroman, Education Chair of Knock Knock Childrenâ€™s Museum in Baton Rouge, LA, is helping the museum implement KIBO! To see one example of how Cate has playful incorporated the KIBO robot at the musuem, check out the KIBOwling activity during the Cardboard Challenge.

        `,
        videoUrl: 'https://vimeo.com/366082145',
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Cate Heroman, Education Chair, Knock Knock Museum, Baton Rouge, LA,',
        contributorLink: 'https://knockknockmuseum.org/'
    },
    {
        id: '35',
       title: 'Introducing KIBO in a Classroom',
description: 'This 30â€“45 minute lesson introduces KIBO, its pieces, how to build the robot, how to build a sequence, and how to scan and code.',

        fullContent: `
            <p>I love introducing KIBO to young students. The design that includes familiar materials such as wood and blocks makes it feel comfortable to the students while the clear bottom allows them to explore the guts of the robot. I start by passing the KIBO body around a circle of 6 or 7 students asking them to take a quick look at the top, bottom, and sides and to hold their observations until all students have a chance to take a look. Their comments range from concrete descriptions of the materials and shapes to connections between KIBO and other parts of their life. One student recently said that the body looked like a piece of bread!
            <br><p><br>
            <p>After the body, I pass out the sensors, wheels, and light. I either put the lid of the bin with all of the pieces on it in the middle of the circle or pass the pieces one at a time in both directions around the circle. Students share their observations about the pieces, and I guide them toward recognizing the shapes and fuctions. Many times, students volunteer this before I have to say anything, and some even connect the shape of the bottom of each piece with the ports on the top of the KIBO body.
            <br><p><br>
            <p>I then pass the lid of the bin with the parts and body on it to the first student in the group. I ask her to start building KIBO. With no further directions, the student is able to figure out how to put a piece on and pass the tray. By the time it gets back to me, all I have to do is tell the students about the green dot on the wheels showing through the base, but that has even been figured out by some groups.
            <br><p><br>
            <p>I then introduce the blocks by looking at KIBO and asking how we tell a robot to do things. Students usually bring up programs or code. I then share the begin and end block held like a traffic light. I then spread out the movement blocks and have the students describe how they are similar and different. We identify the words, symbols, and colors. We have a conversation about bar codes and talk about how KIBO can see the blocks. I then send the lid around the group with enough blocks for each student to add one to the program. After the program is built, I then demonstrate scanning it. Depending on time and patience of the group, I then have each student scan the longer program with the option to rearrange it, or I have them build a three block code with begin, their own choice, and end. The tray precedes the scanning, so that more students are engaged and the scanning takes less time.
            <br><p><br>
            <p>This usually is about a 30-45 minute lesson that introduces the KIBO robot, its pieces, how to build the robot, how to connect code blocks, and how to begin and end each program.
          
        
        
        
            `,
        images: [experience35Image1],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Dan Riles, Innovation Coach, The Meadowbrook School, Weston, MA,',
        contributorLink: 'https://www.meadowbrook-ma.org/'
    },
    {
        id: '36',
        title: 'Integrating Literacy and Science with KIBO',
description: 'See KIBO being integrated with literacy and science instruction with K-2 students; bringing a character from a book and animals to life!',

        fullContent: `
            <p>This project was a collaboration between the DevTech Research Group and Lesley University. They teamed up to share KIBO with the kindergarten though second grade students at Kennedy-Longfellow Elementary in Cambridge, MA. They learned about KIBO, its parts, how to scan and code with KIBO, and integrating coding within the curriculum.
            <br><p><br>
            <p>- When reading â€œBrown Bear, Brwon Bear, What do you See?â€ the kindergarters recreated the story with their KIBOs, including decorating their robots as characters from the book.
            <p>- The first graders incorporated KIBO into their Science Curriculum when they used KIBO to learn about the life cycles of frogs and butterflies.
            <p>- The second graders used KIBO to explore the movement of worms in their environment.
            <br><p><br>
            <p>Watch to learn with their playful coding and engineering.
        
        `,
        videoUrl: 'https://youtu.be/KZ5fjy9xuIg',
        images: [],
        categories: ['Experiences'],
        tags: ['Sample'],
        contributor: 'Kennedy-Longfellow Elementary School, Cambridge, MA',
        contributorLink: ''
    }
];

const Experiences = () => {
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentContentPage, setCurrentContentPage] = useState(0);

    const openExperienceModal = (experience) => {
        setSelectedExperience(experience);
        // If there are YouTube videos in images array, start with the first one (index 0)
        // Otherwise start with index 0 for regular images
        setCurrentImageIndex(0);
        setCurrentContentPage(0);
    };

    const closeExperienceModal = () => {
        setSelectedExperience(null);
        setCurrentImageIndex(0);
        setCurrentContentPage(0);
    };

    const nextImage = () => {
        if (selectedExperience) {
            if (selectedExperience.id === '8' && selectedExperience.videoUrl) {
                // For experience 8: video (index 0) + images (index 1, 2, ...)
                const maxIndex = selectedExperience.images.length;
                setCurrentImageIndex((prev) =>
                    prev === maxIndex ? 0 : prev + 1
                );
            } else if ((selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && selectedExperience.images.some(img => img.includes('youtu'))) {
                // For experiences 16, 17, 18: video (index 0) + images (index 1, 2, ...)
                const nonVideoImages = selectedExperience.images.filter(img => !img.includes('youtu'));
                const maxIndex = nonVideoImages.length;
                setCurrentImageIndex((prev) =>
                    prev === maxIndex ? 0 : prev + 1
                );
            } else if (selectedExperience.images.length > 1) {
                setCurrentImageIndex((prev) =>
                    prev === selectedExperience.images.length - 1 ? 0 : prev + 1
                );
            }
        }
    };

    const prevImage = () => {
        if (selectedExperience) {
            if (selectedExperience.id === '8' && selectedExperience.videoUrl) {
                // For experience 8: video (index 0) + images (index 1, 2, ...)
                const maxIndex = selectedExperience.images.length;
                setCurrentImageIndex((prev) =>
                    prev === 0 ? maxIndex : prev - 1
                );
            } else if ((selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && selectedExperience.images.some(img => img.includes('youtu'))) {
                // For experiences 16, 17, 18: video (index 0) + images (index 1, 2, ...)
                const nonVideoImages = selectedExperience.images.filter(img => !img.includes('youtu'));
                const maxIndex = nonVideoImages.length;
                setCurrentImageIndex((prev) =>
                    prev === 0 ? maxIndex : prev - 1
                );
            } else if (selectedExperience.images.length > 1) {
                setCurrentImageIndex((prev) =>
                    prev === 0 ? selectedExperience.images.length - 1 : prev - 1
                );
            }
        }
    };

    // Function to extract YouTube video ID from URL
    const getYouTubeVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Function to extract Vimeo video ID from URL
    const getVimeoVideoId = (url: string) => {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    };

    // Function to check if URL is Vimeo
    const isVimeoUrl = (url: string) => {
        return url.includes('vimeo.com');
    };

    // Function to split content into pages
    const splitContentIntoPages = (content: string, experienceId?: string): string[] => {
        // MANUAL PAGE DEFINITIONS - Edit these to control what appears on each page
        // To add custom pagination for any experience, add a new 'if (experienceId === 'X')' block below
        // Replace 'X' with the experience ID and define page1Content, page2Content, etc.
        if (experienceId === '3') {
            // For experience 3 (Very Hungry Caterpillar)
            // You can edit the content for each page below

            const page1Content = `
                <p>Ever thought "The Very Hungry Caterpillar" could munch its way through code? Well, buckle up for a coding journey! We're bringing the book to life, programming our caterpillar friend's feast. This adventure spans several classes, around 6 hours total, but hey, if we're having too much fun, who says we can't extend the fun? <strong>Let's dive in and see where our coding caterpillar takes us!</strong> All you need is: KIBO Robots, KIBO's Screen-free Programming Coding Blocks and Light Sensor.</p>
                
                <h3 style="color: #87CEEB; font-size: 1.5em; margin-top: 2em; margin-bottom: 1em;">Step 1: Read the Book Together</h3>
                
                <p>We read <em>The Hungry Hungry Caterpillar</em> by Eric Carle together. Once done I asked, "How is the caterpillar's search for food like a program?" Answers included, <em>there was a pattern; he was born, he ate, made a cocoon, and then became a butterfly; he ate more food each time, etc.</em></p>
                
                <p>I told the students we were going to use the repeat block and change the variable of times repeated each time.</p>

                <h3 style="color: #87CEEB; font-size: 1.5em; margin-top: 2em; margin-bottom: 1em;">Step 2: Definitions</h3>
                
                <p><strong>TO DO:</strong> Ask students for a definition of a pattern.</p>
                
                <p style="margin-left: 2em;"><strong>Possible answers:</strong> something like shapes or numbers that repeats the same way.</p>
                
                <p><strong>SHOW:</strong> The Patterns found within the Very Hungry Caterpillar (see image).</p>
                
                <p><strong>TO DO:</strong> Ask students if this is a pattern or something else?</p>
                
                <p style="margin-left: 2em;"><strong>Answer:</strong> It is a pattern, but it's also a sequence, because there is a pattern, the numbers grow each time, but the fruit changes each time.</p>
                
                <p>(Have students attempt to create a sequence with their KIBO blocks. Students pair up so they have more blocks which makes the sequence more apparent.)</p>
            `;

            const page2Content = `
                <h3 style="color: #87CEEB; font-size: 1.5em; margin-top: 2em; margin-bottom: 1em;">Step 3: Whole Group Debugging</h3>
                
                <p>After two class periods of tinkering away, I start the next session by projecting our work and leading a discussion on its accuracy. We identify any hiccups in the code and troubleshoot together. Then, it's time for students to put their coding skills to the test as they program their own robots.</p>
                
                <p><strong>Differentiation:</strong> If any students are struggling with any aspect of the project, I may pair them with someone rather than working alone.</p>
                
                <h3 style="color: #87CEEB; font-size: 1.5em; margin-top: 2em; margin-bottom: 1em;">Step 4: Sequencing Together</h3>
                
                <p>We revisit the story to clarify the distinction between patterns and sequences. After reading, I project sequence pictures and we assemble the coding blocks collaboratively. Next class, I'll jog their memory and let them take the reins, scanning the blocks themselves. Let's keep the learning journey flowing smoothly!</p>
                
                <h3 style="color: #87CEEB; font-size: 1.5em; margin-top: 2em; margin-bottom: 1em;">Step 5: Share</h3>
                
                <p>I've discovered that this step is crucial for my younger students. They absolutely love celebrating their successes, especially with such a potentially long term project. Once they've achieved their goals, if time permits, I'll have them line up their robots and press start together, creating a mini parade of accomplishment. It's a joyous moment that really boosts their confidence and camaraderie!</p>
            `;

            return [page1Content, page2Content];
        }

        // Experience 4: Single page content
        if (experienceId === '4') {
            return [content]; // Return as single page
        }

        // Experience 9: Multi-stage learning journey with custom pages
        if (experienceId === '9') {
            const page1Content = `
                <p>Educators are always looking for ways to get students problem-solving, collaborating and sharing ideas. Consider making physical computing with robots part of your makerspaces program to engage students in their STEAM learning.</p>
                <br>
                <p>In my work with schools to design makerspaces and STEM programs, Iâ€™ve found a few key features that help when introducing robots to young learners. First, the activities should quickly engage students and bring them into the learning process. Second, teachers should consider time and space requirements for robotics activities. And lastly, activities should be aligned to grade-level standards as much as possible. Time with students in the classroom is limited so teachers are always looking to get the most out of formal and informal learning opportunities.
            <br><br><p><strong>Where to start? The Robot</strong>
            <br><br><p>The robots Iâ€™ve found most effective for introducing prek-1 students to physical computing in a highly engaging way are KIBOs from Kinderlab Robotics. Students are drawn to the tactile features in KIBO â€“ it has a wooden top and thick plastic sides that make it approachable and easy for young students to grip as they develop fine motor skills. Itâ€™s also screen-free! We all know that students have had plenty of screen time over the past two years, and KIBO offers an alternate way for teaching physical computing without screens. Students program KIBO with blocks that are also made of wood, similar to building blocks. And, KIBO is a blank slate. It doesnâ€™t have features that make it easy to fit into a gender, which avoids the biases that can push girls out of STEM. Finally, KIBO doesnâ€™t have what I call a pre-made â€œpersonality.â€ Some robots designed for young learners are already an animal or have features that limit creative imagination. Students are drawn to KIBO and quickly discover that it can be anything they want it to be.
                `;

            const page2Content = `
                <p><strong>Storytelling Hits All the Key Features</strong>
                <br><br><p>Once students have been introduced to KIBOâ€™s parts and basic programming features, like getting KIBO to move, teachers can increase engagement through storytelling. An introductory activity that I like, which is included in Kinderlabâ€™s curriculum, incorporates the book â€œMove!,â€ by Steve Jenkins and Robin Page. In the makerspace, teachers read the story, which involves descriptions of different animals and how they move. Students are asked to draw a picture of an animal, either from the story or one they know about, and tape it to the top of KIBO. Then, students design a program with motion blocks to have KIBO move like their animal. Having students work in pairs can promote productive talk, and teachers will hear students reflecting on parts of the story as they work to sketch and design the movement for their animal. An assessment might involve interviewing students to find out why they made a certain animal, how their computer program works, or how the story influenced their project.
                <br><br><p>I like this activity for other reasons, too. Depending on school bell schedules, reading and drawing can be done one day, and programming the next. Drawings can be easily stored, which helps with managing the activity. Students can work in defined areas of the makerspace that donâ€™t require a lot of room. The activity relies on simple materials â€“ paper, crayons, and tape. Thereâ€™s potential to align it with content standards, like reading, talking and writing. And, thereâ€™s a high ceiling for creative thinking. I once observed two kindergarten girls imagine KIBO as a polar bear. They built an ice wall with the wooden programming blocks and screamed with delight when they got their program working, and the bear smashed through the ice wall!
            `;

            const page3Content = `
               <p><strong>Self-directed Learning through Bowling</strong><br>
               <br><p>After students have gained some proficiency with KIBO programming, teachers can set up self-directed learning stations in makerspaces that incorporate different skills. One of my favorites is KIBO bowling, which is also included in Kinderlabâ€™s curriculum materials. To set it up, teachers can cordon off a small area along a wall in the makerspace to define the bowling alley, about 8 feet by 4 feet. Iâ€™ve used foam tubing from packing materials to outline the space, and recycled water bottles for pins. With blue tape, teachers can create block lettering to write out â€œKIBOâ€ on one end and â€œPINSâ€ on the other. Blue tape arrows can show the direction for the robot to follow. Students will program KIBO to roll down the lane and knock down the pins. Sometimes, they add a â€œshakeâ€ or a â€œturnâ€ to sweep pins at the edges. Students need very little direction, as knocking down pins is pretty straightforward, and the space is well defined.
               <br><br><p>Besides being accessible to different types of learners, KIBO bowling involves Common Core math practices, like trial and error, estimation, prediction and measurement. During formal learning time, teachers might ask students to actually measure how far KIBO travels when they program one â€œforwardâ€ command. Activities can be extended to estimate how far KIBO might travel with multiple commands, depending on math learning objectives.
               <br><br><p><strong>Whatâ€™s next? Get creative with content standards alignment</strong>
               <br><br><p>As Iâ€™ve discussed, creative expression is a key feature of design challenges involving robotics. Students are quick to imagine different solutions to the challenges that teachers present. But teachers can also be creative in how they use robots in makerspaces to meet content standards.
               `;

            const page4Content = `
            <p>For example, teachers can sometimes align a single robotics activity to multiple standards. Iâ€™ve done this with Californiaâ€™s Kindergarten standards in history related to people and places from other times, and NGSS for pushes and pulls. A station for building a covered wagon is set up with preassembled wheels and axles. Students are challenged to attach their wagons to KIBO and program the robot to pull it across the room. In the makerspace, we emphasized use of the phrase â€œnow and long ago,â€ to have students identify a modern method of transportation with robots and an older method in the covered wagons. We also had students describe the action of KIBO to â€œpullâ€ the wagon, as opposed to pushing it.
            <br><br><p>Once theyâ€™ve accomplished moving the wagon, students can be challenged to create obstacles, like cardboard ramps, for the wagon to negotiate. To make this manageable in the makerspace, it might be necessary to work outside the classroom, and have students working on different parts of the project at the same time. For instance, one group could be building a ramp, while another is programming their robot to move over it.
            <br><br><p>A logical progression would be an activity for â€œpushingâ€ materials. Iâ€™ve done this with KIBO snow plows, where students use cardboard and tape to design a structure that attaches to KIBO and can push objects around or over obstacles. Teachers can add complexity by setting up design constraints, where students canâ€™t use tape to attach their plows, and must use pipe cleaners or other materials.
            <br><br><p>When working with teachers of young learners on robotics activities, I often hear them say, â€œIâ€™ve never seen students so engaged!â€ Thatâ€™s the wonderful thing about robotics. If you create design challenges with engagement and creative expression in mind, students will dive right in. They will rise to meet expectations in unique and unexpected ways. While at the same time, teachers can meet learning goals for students at any age level.
            <br><br><p>Bryan Flaig is an educational consultant specializing in makerspaces and STEM curriculum.
            `;

            return [page1Content, page2Content, page3Content, page4Content,];
        }

        // Original logic for other experiences
        const textBlocks = content.split('<br>').filter(block => block.trim());
        const pages = [];
        const blocksPerPage = 5;

        for (let i = 0; i < textBlocks.length; i += blocksPerPage) {
            const pageContent = textBlocks.slice(i, i + blocksPerPage).join('<br>');
            pages.push(pageContent);
        }

        return pages.length > 0 ? pages : [content];
    };

    const nextContentPage = () => {
        if (selectedExperience) {
            const pages = splitContentIntoPages(selectedExperience.fullContent, selectedExperience.id);
            setCurrentContentPage((prev) =>
                prev === pages.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevContentPage = () => {
        if (selectedExperience) {
            const pages = splitContentIntoPages(selectedExperience.fullContent, selectedExperience.id);
            setCurrentContentPage((prev) =>
                prev === 0 ? pages.length - 1 : prev - 1
            );
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-orange-50">
            <Header />

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
                <div className="container mx-auto px-4 flex items-center justify-center h-64">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Hands-On Coding Experiences
                        </h1>
                        <p className="text-white/90 mb-6 text-lg max-w-4xl">
                            These early childhood STEM examples and experiences are submitted from educators doing amazing things with KIBO in their classrooms, enrichment programs and afterschool programs. If you are looking for creative ways to use KIBO, these early childhood STEM examples offer some great ways to bring KIBO to your young learners! Please share your early childhood STEM experiences and we will get them posted.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow bg-orange-50">
                <div className="container mx-auto px-4 py-12">
                    {/* Experiences Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {experiences.map((experience) => (
                            <div
                                key={experience.id}
                                onClick={() => {
                                    // Open modal for all experiences
                                    openExperienceModal(experience);
                                }}
                                className="bg-purple-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                {/* Experience Image */}
                                <div className="relative">
                                    {experience.videoUrl ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(experience.videoUrl)}/maxresdefault.jpg`}
                                            alt={experience.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : experience.images && experience.images[0] ? (
                                        experience.images[0].includes('youtu') ? (
                                            <img
                                                src={`https://img.youtube.com/vi/${getYouTubeVideoId(experience.images[0])}/maxresdefault.jpg`}
                                                alt={experience.title}
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={experience.images[0]}
                                                alt={experience.title}
                                                className="w-full h-48 object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">Image will be added</span>
                                        </div>
                                    )}
                                    {/* Category Tag */}
                                    <div className="absolute top-2 right-2">
                                        <div className="bg-kibo-orange text-white px-2 py-1 rounded text-xs font-semibold">
                                            Experiences
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Content */}
                                <div className="p-4">
                                    {/* Experience Title */}
                                    <h3 className="text-lg font-bold text-kibo-orange mb-2">
                                        {experience.title}
                                    </h3>

                                    {/* Experience Description */}
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {experience.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Experience Modal */}
            {selectedExperience && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={closeExperienceModal}
                >                    <div
                    className="bg-purple-200 rounded-lg overflow-hidden w-full max-w-[1500px] h-full max-h-[1050px] relative flex flex-col mx-4 my-4 md:mx-8 md:my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                        {/* Close Button */}
                        <button
                            onClick={closeExperienceModal}
                            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Modal Content */}
                        <div className="flex flex-col h-full">
                            {/* Header Section - Fixed Height */}
                            <div className="flex gap-8 p-8 h-[350px]">
                                {/* Left - Image/Video Carousel */}
                                <div className="w-[500px]">
                                    {selectedExperience.id === '4' || selectedExperience.id === '21' || selectedExperience.id === '29' ? (
                                        // Experience 4: Show video first, then images with navigation
                                        <>
                                            <div className="relative h-[300px]">
                                                {currentImageIndex === 0 && selectedExperience.videoUrl ? (
                                                    // Show YouTube video when index is 0
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={(selectedExperience.id === '25' || selectedExperience.id === '29') ? `https://www.youtube.com/embed/${selectedExperience.videoUrl}` : `https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.videoUrl)}`}
                                                            title={selectedExperience.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : selectedExperience.images[currentImageIndex - 1] ? (
                                                    // Show images when index >= 1 (subtract 1 for array index)
                                                    <img
                                                        src={selectedExperience.images[currentImageIndex - 1]}
                                                        alt={`${selectedExperience.title} - Image ${currentImageIndex}`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                                        <span className="text-gray-500 text-sm">
                                                            Image {currentImageIndex} will be added
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Navigation Arrows */}
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Dots for video + images */}
                                            <div className="flex justify-center space-x-2 mt-3">
                                                {/* Video dot */}
                                                {selectedExperience.videoUrl && (
                                                    <button
                                                        onClick={() => setCurrentImageIndex(0)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === 0 ? 'bg-kibo-orange' : 'bg-gray-300 hover:bg-gray-400'
                                                            }`}
                                                    />
                                                )}
                                                {/* Image dots */}
                                                {selectedExperience.images.map((image, index) => (
                                                    image && (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentImageIndex(index + 1)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === index + 1 ? 'bg-kibo-orange' : 'bg-gray-300 hover:bg-gray-400'
                                                                }`}
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        // Regular carousel for other experiences
                                        <>
                                            <div className="relative h-[300px]">
                                                {selectedExperience.videoUrl && (selectedExperience.id === '2' || selectedExperience.id === '5' || selectedExperience.id === '10' || selectedExperience.id === '11' || selectedExperience.id === '12' || selectedExperience.id === '22' || selectedExperience.id === '30' || selectedExperience.id === '31' || selectedExperience.id === '33' || selectedExperience.id === '34' || selectedExperience.id === '36') ? (
                                                    // Show video for experiences with videoUrl (YouTube or Vimeo)
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={isVimeoUrl(selectedExperience.videoUrl) 
                                                                ? `https://player.vimeo.com/video/${getVimeoVideoId(selectedExperience.videoUrl)}`
                                                                : `https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.videoUrl)}`
                                                            }
                                                            title={selectedExperience.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : selectedExperience.id === '8' && selectedExperience.videoUrl && currentImageIndex === 0 ? (
                                                    // Show YouTube video for experience 8 when index is 0
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.videoUrl)}`}
                                                            title={selectedExperience.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : selectedExperience.id === '8' && selectedExperience.images[currentImageIndex - 1] ? (
                                                    // Show images for experience 8 when index > 0
                                                    selectedExperience.images[currentImageIndex - 1].includes('youtu') ? (
                                                        // Show YouTube video if the image URL is a YouTube link
                                                        <div className="w-full h-full rounded-lg overflow-hidden">
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.images[currentImageIndex - 1])}`}
                                                                title={`${selectedExperience.title} - Video ${currentImageIndex}`}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={selectedExperience.images[currentImageIndex - 1]}
                                                            alt={`${selectedExperience.title} - Image ${currentImageIndex}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    )
                                                ) : (selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && selectedExperience.images.some(img => img.includes('youtu')) && currentImageIndex === 0 ? (
                                                    // Show YouTube video first for experiences 16, 17, 18 when index is 0
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.images.find(img => img.includes('youtu')) || '')}`}
                                                            title={selectedExperience.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : (selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && selectedExperience.images[currentImageIndex - 1] && !selectedExperience.images[currentImageIndex - 1].includes('youtu') ? (
                                                    // Show regular images for experiences 16, 17, 18 when index > 0 and not YouTube
                                                    <img
                                                        src={selectedExperience.images[currentImageIndex - 1]}
                                                        alt={`${selectedExperience.title} - Image ${currentImageIndex}`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : selectedExperience.images[currentImageIndex] ? (
                                                    selectedExperience.images[currentImageIndex].includes('youtu') ? (
                                                        // Show YouTube video if the image URL is a YouTube link
                                                        <div className="w-full h-full rounded-lg overflow-hidden">
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedExperience.images[currentImageIndex])}`}
                                                                title={`${selectedExperience.title} - Video ${currentImageIndex + 1}`}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={selectedExperience.images[currentImageIndex]}
                                                            alt={`${selectedExperience.title} - Image ${currentImageIndex + 1}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                                        <span className="text-gray-500 text-sm">
                                                            {selectedExperience.videoUrl ? 'Video will be loaded' : `Image ${currentImageIndex + 1} will be added`}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Navigation Arrows - Only for image galleries, not videos (except experience 8, 16, 17, 18) */}
                                                {(selectedExperience.images.length > 1 && !(selectedExperience.videoUrl && (selectedExperience.id === '2' || selectedExperience.id === '5' || selectedExperience.id === '10' || selectedExperience.id === '11' || selectedExperience.id === '12')) || selectedExperience.id === '8' || (selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18')) && (
                                                    <>
                                                        <button
                                                            onClick={prevImage}
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={nextImage}
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Image Dots - Only for image galleries, not videos (except experience 8, 16, 17, 18) */}
                                            {(selectedExperience.images.length > 0 && !(selectedExperience.videoUrl && (selectedExperience.id === '2' || selectedExperience.id === '5' || selectedExperience.id === '10' || selectedExperience.id === '11' || selectedExperience.id === '12')) || selectedExperience.id === '8' || (selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18')) && (
                                                <div className="flex justify-center space-x-2 mt-3">
                                                    {(selectedExperience.id === '8' && selectedExperience.videoUrl) || ((selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && selectedExperience.images.some(img => img.includes('youtu'))) ? (
                                                        <button
                                                            onClick={() => setCurrentImageIndex(0)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === 0
                                                                ? 'bg-kibo-orange'
                                                                : 'bg-gray-300 hover:bg-gray-400'
                                                                }`}
                                                        />
                                                    ) : null}
                                                    {selectedExperience.images.map((image, index) => {
                                                        // Skip YouTube URLs in dots for experiences 16, 17, 18
                                                        if ((selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') && image.includes('youtu')) {
                                                            return null;
                                                        }
                                                        const adjustedIndex = selectedExperience.id === '8' || (selectedExperience.id === '16' || selectedExperience.id === '17' || selectedExperience.id === '18') ? index + 1 : index;
                                                        return (
                                                            <button
                                                                key={index}
                                                                onClick={() => setCurrentImageIndex(adjustedIndex)}
                                                                className={`w-2 h-2 rounded-full transition-colors ${adjustedIndex === currentImageIndex
                                                                    ? 'bg-kibo-orange'
                                                                : 'bg-gray-300 hover:bg-gray-400'
                                                                }`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Right - Title and Meta Info */}
                                <div className="flex-1">
                                    {/* Experience Title */}
                                    <h1 className="text-4xl font-bold text-kibo-purple mb-6">
                                        {selectedExperience.title}
                                    </h1>

                                    {/* Contributor */}
                                    {selectedExperience.contributor && (
                                        <div className="mb-6 text-lg text-gray-600 border-l-4 border-kibo-orange pl-4">
                                            <span className="font-medium">Contributed by:</span> {selectedExperience.contributor}
                                            {selectedExperience.contributorLink && (
                                                <a
                                                    href={selectedExperience.contributorLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-kibo-orange hover:underline ml-2"
                                                >
                                                    Visit
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Categories and Tags */}
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        {selectedExperience.categories.map((category, index) => (
                                            <span key={index} className="bg-kibo-orange text-white px-4 py-2 rounded text-sm font-semibold">
                                                {category}
                                            </span>
                                        ))}
                                        {selectedExperience.tags.map((tag, index) => (
                                            <span key={index} className="bg-kibo-purple text-white px-4 py-2 rounded text-sm font-semibold">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Content Area - Scrollable */}
                            <div className="flex-1 px-8 py-4 overflow-y-auto">
                                {(() => {
                                    const pages = splitContentIntoPages(selectedExperience.fullContent, selectedExperience.id);
                                    const currentPage = pages[currentContentPage] || selectedExperience.fullContent;

                                    return (
                                        <div
                                            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: sanitizeRichContent(currentPage) }}
                                        />
                                    );
                                })()}
                            </div>

                            {/* Pagination Controls - Always at Bottom */}
                            {(() => {
                                const pages = splitContentIntoPages(selectedExperience.fullContent, selectedExperience.id);
                                return (
                                    <div className="border-t bg-purple-200 px-8 py-6">
                                        <div className="flex items-center justify-between">
                                            {/* Previous Button */}
                                            <button
                                                onClick={prevContentPage}
                                                disabled={currentContentPage === 0}
                                                className="flex items-center gap-2 px-4 py-2 rounded transition-colors bg-kibo-orange text-white hover:bg-kibo-orange/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </button>

                                            {/* Page Info and Dots */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex space-x-2">
                                                    {pages.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentContentPage(index)}
                                                            className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentContentPage
                                                                ? 'bg-kibo-orange'
                                                                : 'bg-gray-300 hover:bg-gray-400'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    Page {currentContentPage + 1} / {pages.length}
                                                </span>
                                            </div>

                                            {/* Next Button */}
                                            <button
                                                onClick={nextContentPage}
                                                disabled={currentContentPage === pages.length - 1}
                                                className="flex items-center gap-2 px-4 py-2 rounded transition-colors bg-kibo-orange text-white hover:bg-kibo-orange/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Experiences;

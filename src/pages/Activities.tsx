import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeRichContent } from '@/lib/sanitizeHtml';

// Import Buzz-Buzz activity images (Activity 1)
import activity1Image1 from '../assets/resources/activities/1/Buzz-Buzz-Image-2-300x300.jpeg';
import activity1Image2 from '../assets/resources/activities/1/Buzz-Buzz-KIBO-300x261.jpeg';
import activity1Image3 from '../assets/resources/activities/1/Buzz-Buzz-Sequence-300x278.jpeg';
import activity1Image4 from '../assets/resources/activities/1/Buzz-Buzz.jpeg';

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
import thinkingWithKiboPdf from '../assets/resources/activities/Thinking-with-KIBO.pdf';
import mapsMeasurementPdf from '../assets/resources/activities/Maps-Measurement-and-Make-Believe.pdf';
import thinkingWithKiboImage from '../assets/resources/activities/Thinking-with-KIBO-Cover-Image-232x300.jpg';
import mapsMeasurementImage from '../assets/resources/activities/Map-Guide-Cover-211x300.jpg';
import askAndImagineDancePdf from '../assets/resources/activities/Ask-and-Imagine-Dance-Subroutines.pdf';
import measureOurTownPdf from '../assets/resources/activities/Measure-Our-Town.pdf';
import kiboSuperheroActivityPdf from '../assets/resources/activities/KIBO-superhero-activity-Gwk-Adv-Lesson-7-8.pdf';
import kiboZooPdf from '../assets/resources/activities/The-KIBO-Zoo-KinderLab-Robotics.pdf';
import traditionalStoriesPdf from '../assets/resources/activities/Traditional-Stories-in-Early-Childhood-Education-with-KIBO.pdf';
import dinoBuddyPdf from '../assets/resources/activities/Kibo-Curriculum_Dino-Buddy.pdf';

// Import new PDF files for activities 13-18
import sampleKiboLessonPlanPdf from '../assets/resources/activities/Sample-KIBO-Lesson-Plan.pdf';
import kiboDreamCarPdf from '../assets/resources/activities/KIBO-Activity-Dream-Car.pdf';
import kiboPetTrickPdf from '../assets/resources/activities/KIBO-Activity-Pet-Trick.pdf';
import activityCard7FireTruckPdf from '../assets/resources/activities/Activity-Card-7-Fire-Truck.pdf';
import activityCard6DancerPdf from '../assets/resources/activities/Activity-Card-6-Dancer.pdf';
import activityCard5SnowplowPdf from '../assets/resources/activities/Activity-Card-5-Snowplow.pdf';

// Import new PDF files for activities 19-24
import lookAtMePdf from '../assets/resources/activities/KIBO-Lesson-Plan-LOOK-AT-ME-Tifani-Fisher.pdf';
import ilovepdfMergedPdf from '../assets/resources/activities/ilovepdf_merged.pdf';
import codingParkGrade1Lesson1Pdf from '../assets/resources/activities/Coding-@-Park-Grade-1-1.pdf';
import codingParkGrade1Lesson2Pdf from '../assets/resources/activities/Coding-@-Park-Grade-1-2.pdf';
import codingParkGrade1Lesson3Pdf from '../assets/resources/activities/Coding-@-Park-Grade-1-3.pdf';
import noKiboNoProblemPdf from '../assets/resources/activities/No-KIBO-No-Problem-v3.pdf';
import ramirezKiboLessonPdf from '../assets/resources/activities/Ramirez_KIBOLesson.pdf';
import kiboCatchPdf from '../assets/resources/activities/KIBO-Catch.pdf';

// Import PNG images for activities 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
import activity13Image from '../assets/resources/activities/13.png';
import activity14Image from '../assets/resources/activities/14.png';
import activity15Image from '../assets/resources/activities/15.png';
import activity16Image from '../assets/resources/activities/16.png';
import activity17Image from '../assets/resources/activities/17.png';
import activity18Image from '../assets/resources/activities/18.png';
import activity19Image from '../assets/resources/activities/19.png';
import activity20Image from '../assets/resources/activities/20.png';
import activity21Image from '../assets/resources/activities/21.png';
import activity22Image from '../assets/resources/activities/22.png';
import activity23Image from '../assets/resources/activities/23.png';
import activity24Image from '../assets/resources/activities/24.png';
import activity25Image from '../assets/resources/activities/kibobinball.png';
import activity26Image from '../assets/resources/activities/26.png';
import kiboZooImage from '../assets/resources/activities/kibozoo.png';
import activity27Image from '../assets/resources/activities/27.jpg';
import activity28Image from '../assets/resources/activities/28.webp';
import activity29Image from '../assets/resources/activities/haatzmaut.png';
import activity30Image from '../assets/resources/activities/30.jpg';


import activity31Image from '../assets/resources/activities/31.webp';
import activity32Image from '../assets/resources/activities/32/32.jpg';
import activity32Image1 from '../assets/resources/activities/32/aftermath-150x150.jpg';
import activity32Image2 from '../assets/resources/activities/32/lightbulb-150x150.jpg';
import activity32Image3 from '../assets/resources/activities/32/set-up-150x150.jpg';
import activity33Image from '../assets/resources/activities/33.webp';
import activity34Image from '../assets/resources/activities/34.jpg';
import activity35Image from '../assets/resources/activities/35.jpg';
import activity36Image from '../assets/resources/activities/36.jpg';
import activity37Image from '../assets/resources/activities/37.jpg';

// PDF imports for activities 25-30
import kiboBinBallPdf from '../assets/resources/activities/KIBO-Bin-Ball-1.pdf';
import kiboMarkMeasurePdf from '../assets/resources/activities/KIBO-Mark-and-Measure-1.pdf';
import kiboShapeSearchPdf from '../assets/resources/activities/KIBO-Shape-Search-Activity.pdf';
import klEngineeringDesignPdf from '../assets/resources/activities/KL-Engineering-Design-Process.pdf';

// PDF imports for activities 31-37
import kiboExpressionModulePdf from '../assets/resources/activities/KIBO-Expression-Module-Activities.pdf';
import kiboChallengesRivkaPdf from '../assets/resources/activities/Kibo-Challenges-Rivka-Heisler-SAR-Academy.pdf';
import dancesAroundWorldPdf from '../assets/resources/activities/Dances-Around-the-World-KIBO-Curriculum.pdf';
import whereWildThingsArePdf from '../assets/resources/activities/WhereTheWildThingsAre.pdf';

// Import PNG images for activities 7, 8, 9, 11, 12
import activity7Image from '../assets/resources/activities/7.png';
import activity8Image from '../assets/resources/activities/8.png';
import activity9Image from '../assets/resources/activities/9.png';
import activity11Image from '../assets/resources/activities/11.png';
import activity12Image from '../assets/resources/activities/12.png';
import { categories } from '@/data/products';

// Combined Activities Data and Component - Merged from activitiesData.ts
export interface ActivityCard {
    id: string;
    title: string;
    description: string;
    fullContent: string;
    images: string[];
    videoUrl?: string;
    categories: string[];
    tags: string[];
    contributor?: string;
    contributorLink?: string;
    link?: string;
    pdfUrl?: string;
    websiteUrl?: string;
}

// Activities Data - Now inline for easier page-by-page management
const activities: ActivityCard[] = [
    {
        id: '1',
        title: 'A Pollination Adventure with KIBO!',
        description: 'Buzz Buzz\'s Pollination Adventure with KIBO is an engaging activity where our young friends assisted Buzz Buzz in collecting pollen and returning it to the beehive. Buzz Buzz was unable [...]',
        contributor: 'Hanna Loetz, Assistant Director, Goddard School Charlestown',
        contributorLink: 'https://www.goddardschool.com/schools/ma/charlestown/charlestown',
        fullContent: `
            <p><strong>Buzz Buzz's Pollination Adventure with KIBO</strong> is an engaging activity where our young friends assisted Buzz Buzz in collecting pollen and returning it to the beehive. Buzz Buzz was unable to move on its own, so we utilized KIBO as a mode of transportation to carry him around.</p>
            
            <br>
            
            <p>We remembered that KIBO is a robot, not a human, so we had to guide it with the directional programming blocks since it can't think on its own. We refreshed our understanding of the language KIBO employs – barcodes found on the blocks! We emphasized the importance of beginning with the start block and ending with the end block for KIBO to comprehend instructions accurately.</p>
            
            <br>
            
            <p>We then delved into activity blocks such as shaking, turning to the side, moving backward and forward, and spinning. Then we started our activity. On the ground, we marked a tape line with the hive picture on one end and the flowers picture on the other. On the flower picture were yellow pom-poms representing the pollen.</p>
            
            <br>
            
            <p>The task involved programming KIBO and Buzz Buzz to reach the flowers. Working in small groups, our children eagerly tackled the challenge. Initially, they tried using the forward block, but KIBO only managed to take a single step, falling short of reaching the flowers. They ingeniously overcame this by repeatedly pressing the button to advance KIBO step by step until Buzz Buzz reached the flowers, where they joyfully deposited the pollen. Subsequently, we introduced another method. We looked on a new block – the repeat block – explained its function. We counted the required repetitions until KIBO and Buzz Buzz reached the flowers, which turned out to be four times. We inserted the "four times" parameter card into the repeat block, and it worked like a charm.</p>
            
            <br>
            
            <p>Buzz Buzz had different ways to move: straight forward, or turning to the right or left. Each time, we had to find the right programming blocks for that action and place it in a sequence. Finally, we discussed the option of programming KIBO to perform the task continuously in the forever loop. When we programmed KIBO to do the task forever, the kids laughed a lot and had so much fun. Towards the end, I introduced the children to additional features of KIBO, such as its ear sensor for listening, the recorder for producing sound, its eye sensor for detecting light and darkness, and its telescopic function for gauging distances and its light bulb.</p>
            
            <br>
            
            <p>Our friends aimed to program KIBO to guide Buzz Buzz to flowers, gather pollen, and return to the hive. They explored KIBO's functions and experimented with directional blocks and repetition to optimize movement. Through trial and error, they fixed errors like missing start/end blocks or miscounting repetitions. This taught them the importance of precise coding and sequencing. Experimenting with repetition, they learned its efficiency in simplifying tasks, enhancing their computational thinking. Overall, the activity sharpened problem-solving, coding, and critical thinking skills, fostering curiosity and fun while preparing them for future STEM endeavors.</p>
        `,
        images: [activity1Image1, activity1Image2, activity1Image3, activity1Image4],
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
        title: 'Thinking with KIBO Curriculum – Introducing Artificial Intelligence in Early Grades',
        description: '',
        fullContent: `
            <h2>Thinking with KIBO Curriculum – Introducing Artificial Intelligence in Early Grades</h2>
            <p>Explore artificial intelligence concepts with young learners through hands-on KIBO programming activities designed for early childhood education.</p>
            <p>This comprehensive curriculum introduces AI concepts in age-appropriate ways, helping students understand how computers can "think" and make decisions.</p>
            <h3>Curriculum Components:</h3>
            <ul>
                <li>Pattern recognition activities</li>
                <li>Decision-making algorithms</li>
                <li>Sensor-based programming</li>
                <li>Machine learning basics for kids</li>
            </ul>
            <div class="mt-6">
                <a href="${thinkingWithKiboPdf}" target="_blank" class="bg-kibo-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-kibo-orange/90 transition-colors inline-block">
                    Download PDF
                </a>
            </div>
        `,
        images: [thinkingWithKiboImage],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['White Papers'],
        pdfUrl: thinkingWithKiboPdf
    },
    {
        id: '6',
        title: 'Maps, Measurement, and Make-Believe! Floor Map Activities for KIBO',
        description: '',
        fullContent: `
            <h2>Maps, Measurement, and Make-Believe! Floor Map Activities for KIBO</h2>
            <p>Combine geography, mathematics, and storytelling in these engaging floor map activities that help students learn measurement and spatial reasoning with KIBO.</p>
            <p>Students create and navigate floor maps while learning about distance, direction, and spatial relationships through imaginative play scenarios.</p>
            <h3>Activity Types:</h3>
            <ul>
                <li>Treasure hunt adventures</li>
                <li>City navigation challenges</li>
                <li>Measurement and estimation games</li>
                <li>Storytelling through movement</li>
            </ul>
            <div class="mt-6">
                <a href="${mapsMeasurementPdf}" target="_blank" class="bg-kibo-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-kibo-orange/90 transition-colors inline-block">
                    Download PDF
                </a>
            </div>
        `,
        images: [mapsMeasurementImage],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['White Papers'],
        pdfUrl: mapsMeasurementPdf
    },
    {
        id: '7',
        title: 'Our Block, Our Dance – Using KIBOs Advanced Blocks',
        description: 'Teach KIBO some dance moves! Create a dance step subroutine and create an icon on the programming block with KIBO\'s Advanced Coding Extension Set.',
        contributor: 'KinderLab Robotics',
        contributorLink: 'https://kinderlabrobotics.com/',

        fullContent: `
            <p>In this activity, Our Block, Our Dance, let's teach KIBO some dance moves! Using KIBO's <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Advanced Coding Extension set</a>, Groups can create a dance step subroutine and create an icon on their programming block of their own to represent it. Groups will share their dance moves to teach them to different KIBOs.</p>
            <br>
            <p>Dancers often repeat patterns of movement when they dance. But they don't just repeat the same move over and over. They repeat patterns of movement. For example, a dancer might do a step, a turn, and a jump. Then they might repeat that pattern: step, turn, jump. The moves are like subroutines in the language of dance. The dance is like the main program in Cha-cha-cha dance.</p>
            <br>
            <p>Have the kids dance along to a fun dance video with named moves. You might share a dance video where the caller names specific steps like the six-step or the "Whip Nae Nae" by Silentó. Have kids dance along to a fun dance video with named moves.</p>
            <br>
            <p>This lesson is an excerpt from "Ask and Imagine" <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Curriculum Guide for the Advanced Coding Extension Set</a>.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${askAndImagineDancePdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Advanced Coding Extension Set Activity - Our Block, Our Dance</a></p>
        `,
        images: [activity7Image],
        categories: ['Activities'],
        tags: ['Dance', 'Programming'],
        pdfUrl: askAndImagineDancePdf
    },
    {
        id: '8',
        title: 'Explore and Measure our Town',
        description: 'Students draw a town, then program KIBO to explore by traveling from place to place as it draws lines to record KIBO\'s adventures.',
        contributor: 'KinderLab Robotics',
        contributorLink: 'https://kinderlabrobotics.com/',
        fullContent: `
            <p>Where will KIBO go when it explores the town? Students draw or build a town, then program KIBO to explore it by traveling from place to place. As KIBO moves around the town with the <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Marker Extension Set</a> attached, the free KIBO draws lines to record its adventures as well as create measurements of the distances in the town.</p>
            <br>
            <p>We recommend pairing the reading of Harold and the Purple Crayon by Crockett Johnson. This classic story about the power of imagination and the possibilities in a single line will help put kids in the mood for creating their imaginary town.</p>
            <br>
            <p>This activity is an excerpt from <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Make Learning Visible! Curriculum Guide</a>.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${measureOurTownPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Explore and Measure Our Town</a></p>
        `,
        images: [activity8Image],
        categories: ['Activities'],
        tags: ['Measurement', 'Community'],
        pdfUrl: measureOurTownPdf
    },
    {
        id: '9',
        title: 'KIBO Superhero Robots',
        description: 'In this Superhero Robots activity, kids learn about what makes a superhero, the design and bring a KIBO robot to life to help others in their community.',
        contributor: 'KinderLab Robotics',
        contributorLink: 'https://kinderlabrobotics.com/',
        fullContent: `
            <p>In this excerpt from our core <a href="/shop/learning-materials" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Growing with KIBO Curriculum</a>, we offer the Superhero Robots activity where kids use their programming knowledge to create superhero KIBOs that use sensors and outputs to help people.</p>
            <br>
            <p>Children discuss what makes a superhero and engages children in discussions of leadership and decision-making. They can read <em>Everyday Super Hero</em> by by Sara Zuboff, then create their own superhero by decorating their KIBO robots with arts and crafts. They then program their KIBO to help people in some way.</p>
            <br>
            <p>This lesson incorporated lessons supporting community and SEL.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${kiboSuperheroActivityPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Superhero Robots</a></p>
        `,
        images: [activity9Image],
        categories: ['Activities'],
        tags: ['Superhero', 'Advanced'],
        pdfUrl: kiboSuperheroActivityPdf
    },
    {
        id: '10',
        title: 'KIBO Zoo – An Intro to Creative Robotics & Programming in K–2',
        description: 'This 6–8 hour animal themed introductory curriculum is designed to help teachers get started with KIBO.',
        contributor: 'KinderLab Robotics',
        contributorLink: 'https://kinderlabrobotics.com/',
        fullContent: `
            <p>This curriculum guide, KIBO Zoo, is a 6-8 hour animal themed introductory curriculum. You can also watch <em>The KIBO Zoo</em> video as designed to help teachers get started with KIBO.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${kiboZooPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Zoo Programming Activity</a></p>
        `,
        images: [kiboZooImage],
        categories: ['Activities'],
        tags: ['Animals', 'Zoo'],
        pdfUrl: kiboZooPdf
    },
    {
        id: '11',
        title: 'Teaching Stories through Robotics',
        description: 'With this curriculum, students read the story of the “3 Little Pigs” and learn to program KIBO, through the retelling of the story.',

        contributor: 'Maribel Santos Miranda Pinto, Researcher, University of Minho, Portugal',
        contributorLink: 'https://www.facebook.com/kidsmedialabr',
        fullContent: `
            <p>This <em>Traditional Stories in Early Childhood Education – Teaching Stories through Robotics & Programming</em> curriculum was developed from one of our KIBO Ambassadors, Maribel Santos Miranda Pinto, where she shares a curricular unit for preschoolers – 4 to 7 years old.</p>
            <br>
            <p>Incorporating traditional children's stories, this curriculum integrates programming and robotics as the curricular theme and "powerful ideas". Using the story of the "3 Little Pigs", Maribel's learning objective is that children learn to program the KIBO robot, through the retelling of the story. This curriculum unit is linked to other subjects outside the STEM, because it starts with children's literature and goes through the construction of 3D scenarios using the work of artistic, plastic and musical expression, associated with the story.</p>
            <br>
            <p>"I believe that programming the KIBO Robot to tell a story will meet the interests of pre-school age children because, 'Children love to tell stories; they talk about what happened over the weekend, about family events, and about different happenings in the classroom. Each of these stories can be broken down into a sequence of activities. Teachers can ask targeted questions to help children extend these ideas. For example, a teacher might ask, "What happened last?" "What happened first?" and "What happened in the middle?"' (CSTA, 2016, p. 194).</p>
            <br>
            <p>The curriculum includes:</p>
            <br>
            <p><strong>Lesson 1: The Engineering Design Process in the traditional Story of the 3 Little Pigs</strong><br>
            Powerful Idea: Traditional stories for children and the Choice of the story the 3 Little Pigs – Robotics with the KIBO Robot</p>
            <br>
            <p><strong>Lesson 2: What Is A Robot?</strong><br>
            Powerful Idea: What is the character of the story that can be programmed in the Robot? – Robotics with the KIBO Robot</p>
            <br>
            <p><strong>Lesson 3: What is a Program?</strong><br>
            Powerful Idea: The 3 Little Pigs story, with The KIBO Robot (the "Bad Wolf") – Programming: Control Flow by Sequencing and Instructions to program</p>
            <br>
            <p><strong>Lesson 4: What Are Sensors?</strong><br>
            Powerful Idea: What are the 3 Little Pigs' Moments of History? – Learning with Sensors and Actuators</p>
            <br>
            <p><strong>Lesson 5: What Are Repeats?</strong><br>
            Powerful Idea: What does the Bad Wolf do? – Recount the entire history of the 3 little pigs using the Repeats: Loops & Number Parameters</p>
            <br>
            <p><strong>Lesson 6: What Are Ifs?</strong><br>
            Powerful Idea: Where is the Bad Wolf going? – Ifs – Sensors & Branches</p>
            <br>
            <p><strong>Lesson 7: Culminating Project</strong><br>
            Powerful Idea(s): "The History and Dance of the 3 Little Pigs" and Other Stories of Wolf in the Forest</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${traditionalStoriesPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Traditional Stories in Early Childhood Education - Teaching Stories through Robotics & Programming</a></p>
        `,
        images: [activity11Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Stories', 'Literature'],
        pdfUrl: traditionalStoriesPdf
    },
    {
        id: '12',
        title: 'Dino Buddy KIBO Curriculum',
        description: 'In this 20-hour cross-curricular KIBO curriculum, young learners learn about dinosaurs through robotics and programming!',
        contributor: 'Marlene Gabriela Marques Fernandes, Jardim de Infância de Arcozelo das Maias, Portugal',
        contributorLink: 'https://www.facebook.com/marlene.g.fernandes.1/',
        fullContent: `
            <p>Our KIBO Ambassador, Marlene Gabriela Marques Fernandes, developed this 20-hour KIBO curriculum, "Dino Buddy", where young learners learn about dinosaurs through robotics and programming!</p>
            <br>
            <p>Using robotics as a learning facilitator, children will learn the correlation between dinosaurs with their environment, natural phenomena and their effects. They will learn how they lived on our planet millions of years ago.</p>
            <br>
            <p>This cross curricular lesson plan includes:</p>
            <br>
            <p><strong>Lesson 1: Study building</strong><br>
            Connection: Characteristics of dinosaurs<br>
            See the movie about the "Birth of the Earth" which provides information about the appearance, life and extinction of dinosaurs. Children will follow the steps of the engineering design process and draw the dinosaur they liked best and build it with Legos.</p>
            <br>
            <p><strong>Lesson 2: What is a robot?</strong><br>
            Connection: Reinforce characteristics of dinosaurs, compare and contrast groups of them<br>
            Remember the different types of dinosaurs according to the environment in which they move: air, earth or water. Discover the various types of robots they know and their functions.</p>
            <br>
            <p><strong>Lesson 3: What is a program?</strong><br>
            Connection: How do dinosaurs move? What are the physical characteristics of them?<br>
            Through creative and collaborative writing, tell a story of dinosaurs with which children identify themselves. Using apps will reproduce the steps that the main character will make during the story. Dramatize part of the story by programming the robot with simple commands.</p>
            <br>
            <p><strong>Lesson 4: What are repeats?</strong><br>
            Connection: Dinosaurs<br>
            Discovering more dinosaur characteristics and continuing the collaborative story.</p>
            <br>
            <p><strong>Lesson 5: What are sensors?</strong><br>
            Connection: How did the dinosaurs sense their friends and enemies? What senses did they have? Compare human and animal senses.<br>
            Discover how the dinosaurs knew friends and enemies. Remember the organs of the senses and compare them to the result of the research. Program the robot according to pre-established criteria, to react differently depending on the dinosaur it finds.</p>
            <br>
            <p><strong>Lesson 6: What are ifs?</strong><br>
            Connection: Animal relationships<br>
            The dinosaurs are reptilian and therefore are oviparous. The children will participate in an eggs hunt, whose purpose is to discover, through the reactions of "DinoKIBO" and the criteria previously defined, to whom the egg belongs.</p>
            <br>
            <p><strong>Lesson 7: Final project</strong><br>
            Connection: Visit to the natural museum of Lourinhã Dino Park<br>
            The kids will go to the natural museum where they can learn more about dinosaur activities, such as watching fossil cleaning in the laboratory, and seeing time charts of the evolution of dinosaurs.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${dinoBuddyPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Dino Buddy Curriculum (PDF)</a></p>
        `,
        images: [activity12Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Dinosaurs', 'Science'],
        pdfUrl: dinoBuddyPdf
    },
    {
        id: '13',
        title: 'KIBO Lesson Plan Framework',
        description: 'This KIBO lesson planning framework document provides an easy to use way for educators to plan their next KIBO activity!',
        contributor: 'Dr. Julie Wilkerson, McKendree Elementary School',
        contributorLink: 'https://www.gpsk12.org/McKendreeES',
        fullContent: `
            <p>This Sample KIBO Lesson form provides an easy to use way for educators to plan their next KIBO activity!</p>
            <br>
            <p>Our KIBO Ambassador, Dr. Julie Wilkerson, provides a sample lesson plan that she shares as a helpful resource for educators to use as they create a KIBO lesson plan. This form provides an easy to use way for educators to plan their next KIBO activity, including:</p>
            <br>
            <p>– Lesson Title/Topic<p>
            – State/District Standard<p>
            – Learning Target<p>
            – Materials<p>
            – Teacher and Student Instructions<p>
            – Introduction<p>
            – Exploration<p>
            – Summary<br>
            – Artifacts (pictures/student examples/answer keys)</p>
            <br>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${sampleKiboLessonPlanPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Sample KIBO Lesson Plan</a></p>
        `,
        images: [activity13Image],
        categories: ['Activities'],
        tags: ['Planning', 'Framework'],
        pdfUrl: sampleKiboLessonPlanPdf
    },
    {
        id: '14',
        title: 'KIBO Activity Card – Dream Car',
        description: 'With this KIBO Activity Card, kids can decorate KIBO to become the craziest car you can imagine, and make it go!',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: '/shop/learning-materials',
        fullContent: `
            <p>With this KIBO Activity Card, kids can decorate KIBO to become the craziest car you can imagine, and make it go!</p>
            <br>
            <p>This is a free sample activity from the 2nd Edition of our popular KIBO Activity Cards. These cards provide 15 creative KIBO activities with big, colorful images and easy-to-follow instructions, for hours of student engagement or fun at home with KIBO!</p>
            <br>
            <p>The cards can be used independently by students in a classroom activity station, as the basis for teacher-guided lessons in remote learning, or when playing and learning with KIBO at home. Each card invites children into a different creative, imaginative activity with KIBO that combines coding, building, art, and play.</p>
            <br>
            <p>Purchase the complete set of <a href="/shop/learning-materials" target="_blank" style="color: #8b5cf6; text-decoration: underline;">15 KIBO Activity Cards (2nd Edition)</a> at our web store.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${kiboDreamCarPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Activity Card - KIBO Dream Car (PDF)</a></p>
        `,
        images: [activity14Image],
        categories: ['Activities'],
        tags: ['Cars', 'Design'],
        pdfUrl: kiboDreamCarPdf
    },
    {
        id: '15',
        title: 'KIBO Activity Card – Pet Trick',
        description: 'With this KIBO Activity, kids can create a KIBO pet and teach it to do a trick when you clap! What pet will you create?',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: '/shop/learning-materials',
        fullContent: `
            <p>Create a KIBO pet and teach it to do a trick when you clap!</p>
            <br>
            <p>This is a free sample activity from the 2nd Edition of our popular KIBO Activity Cards. These cards provide 15 creative KIBO activities with big, colorful images and easy-to-follow instructions, for hours of student engagement or fun at home with KIBO!</p>
            <br>
            <p>The cards can be used independently by students in a classroom activity station, as the basis for teacher-guided lessons in remote learning, or when playing and learning with KIBO at home. Each card invites children into a different creative, imaginative activity with KIBO that combines coding, building, art, and play.</p>
            <br>
            <p>Purchase the complete set of <a href="/shop/learning-materials" target="_blank" style="color: #8b5cf6; text-decoration: underline;">15 KIBO Activity Cards (2nd Edition)</a> at our web store.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${kiboPetTrickPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Activity Card - KIBO Pet Trick (PDF)</a></p>
        `,
        images: [activity15Image],
        categories: ['Activities'],
        tags: ['Pets', 'Sound'],
        pdfUrl: kiboPetTrickPdf
    },
    {
        id: '16',
        title: 'KIBO Activity Card – Fire Truck',
        description: 'Clang, clang, clang! We need the KIBO fire truck to help the community. Put on the truck\'s flashing lights and drive with this early childhood STEM lesson!',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: '/shop/learning-materials',
        fullContent: `
            <p>Clang, clang, clang! We need the KIBO fire truck to help. Put on the flashing lights and drive!</p>
            <br>
            <p>This is a free sample activity from the 2nd Edition of our popular KIBO Activity Cards. These cards provide 15 creative KIBO activities with big, colorful images and easy-to-follow instructions, for hours of student engagement or fun at home with KIBO!</p>
            <br>
            <p>The cards can be used independently by students in a classroom activity station, as the basis for teacher-guided lessons in remote learning, or when playing and learning with KIBO at home. Each card invites children into a different creative, imaginative activity with KIBO that combines coding, building, art, and play.</p>
            <br>
            <p>Purchase the complete set of <a href="/shop/learning-materials" target="_blank" style="color: #8b5cf6; text-decoration: underline;">15 KIBO Activity Cards (2nd Edition)</a> at our web store.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${activityCard7FireTruckPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Activity Card - KIBO Fire Truck (PDF)</a></p>
        `,
        images: [activity16Image],
        categories: ['Activities'],
        tags: ['Community', 'Emergency'],
        pdfUrl: activityCard7FireTruckPdf
    },
    {
        id: '17',
        title: 'KIBO Activity Card – Dancer',
        description: 'KIBO can repeat a pattern of blocks over and over with a repeat loop. Decorate KIBO, program the dance, and lets get grooving!',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: '/shop/learning-materials',
        fullContent: `
            <p>KIBO can repeat a pattern of blocks over and over with a repeat loop. Let's create a repeating dance routine.</p>
            <br>
            <p>This is a free sample activity from the 2nd Edition of our popular KIBO Activity Cards. These cards provide 15 creative KIBO activities with big, colorful images and easy-to-follow instructions, for hours of student engagement or fun at home with KIBO!</p>
            <br>
            <p>The cards can be used independently by students in a classroom activity station, as the basis for teacher-guided lessons in remote learning, or when playing and learning with KIBO at home. Each card invites children into a different creative, imaginative activity with KIBO that combines coding, building, art, and play.</p>
            <br>
            <p>Purchase the complete set of <a href="   " target="_blank" style="color: #8b5cf6; text-decoration: underline;">15 KIBO Activity Cards (2nd Edition)</a> at our web store.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${activityCard6DancerPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Activity Card - KIBO Dancer (PDF)</a></p>
        `,
        images: [activity17Image],
        categories: ['Activities'],
        tags: ['Dance', 'Loops'],
        pdfUrl: activityCard6DancerPdf
    },
    {
        id: '18',
        title: 'KIBO Activity Card – Snowplow',
        description: 'The city is covered in snow, and KIBO will help clean up! We will build, test, and improve a KIBO snowplow using the Engineering Design Process.',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: '/shop/learning-materials',
        fullContent: `
            <p>The city is covered in snow, and KIBO will help clean up! We will build, test, and improve a KIBO snowplow using the Engineering Design Process.</p>
            <br>
            <p>This is a free sample activity from the 2nd Edition of our popular KIBO Activity Cards. These cards provide 15 creative KIBO activities with big, colorful images and easy-to-follow instructions, for hours of student engagement or fun at home with KIBO!</p>
            <br>
            <p>The cards can be used independently by students in a classroom activity station, as the basis for teacher-guided lessons in remote learning, or when playing and learning with KIBO at home. Each card invites children into a different creative, imaginative activity with KIBO that combines coding, building, art, and play.</p>
            <br>
            <p>Purchase the complete set of <a href="/shop/learning-materials" target="_blank" style="color: #8b5cf6; text-decoration: underline;">15 KIBO Activity Cards (2nd Edition)</a> at our web store.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${activityCard5SnowplowPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Activity Card 5 - KIBO Snowplow (PDF)</a></p>
        `,
        images: [activity18Image],
        categories: ['Activities'],
        tags: ['Engineering', 'Problem Solving'],
        pdfUrl: activityCard5SnowplowPdf
    },
    {
        id: '19',
        title: 'Look at Me!',
        description: 'Using the MAT MAN format from High Scope (a basic stick man) the children will draw a person using KIBOs with the KIBO Marker Extension Set.',
        contributor: 'Tifani Fisher',
        contributorLink: 'https://besd.net/',
        fullContent: `
            <p>Using the MAT MAN format from High Scope (a basic stick man) the children will draw a person using KIBOs with the KIBO Marker Extension Set.</p>
            <br>
            <p>KIBO Ambassador Tifani Fisher is a Special Education Preschool Teacher at the Corinne Early Learning Center, Box Elder School District, Utah. Follow Tifani at @TifaniF94.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${lookAtMePdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;"> KIBO Lesson Plan - LOOK AT ME - Tifani Fisher</a></p>
        `,
        images: [activity19Image],
        categories: ['Activities'],
        tags: ['Drawing', 'Art', 'Special Education'],
        pdfUrl: lookAtMePdf
    },
    {
        id: '20',
        title: '1st Grade KIBO Intro Lessons',
        description: 'These 1st-grade lesson plans introduce KIBO\'s programming and movement capabilities, then continue to the concept of the repeat loop. The lessons include links to slideshows and other resources Megan has shared.',
        contributor: 'Megan Haddadi',
        contributorLink: 'https://wellesleyps.org/',
        fullContent: `
            <p>These 1st-grade lesson plans introduce KIBO's programming and movement capabilities, then continue to the concept of the repeat loop. The lessons include links to slideshows and other resources Megan has shared.</p>
            <br>
            <p>KIBO Ambassador Megan Haddadi is the Director of Educational Technology as Wellesley Public Schools, MA. Follow Megan on Twitter at @meganhaddadi.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${codingParkGrade1Lesson1Pdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Coding @ Park_Grade 1 - Lesson 1</a></p>
            <p><a href="${codingParkGrade1Lesson2Pdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Coding @ Park_Grade 1 - Lesson 2</a></p>
            <p><a href="${codingParkGrade1Lesson3Pdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Coding @ Park_Grade 1 - Lesson 3</a></p>
        `,
        images: [activity20Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['1st Grade', 'Introduction', 'Lesson Plans'],
        pdfUrl: ilovepdfMergedPdf
    },
    {
        id: '21',
        title: 'KIBO Sight Word Bowling',
        description: 'KIBO bowling as a literacy activity! Put sight words on the pins and program KIBO to reach the corresponding word!',
        contributor: 'Staley Mcllwain,',
        contributorLink: 'https://gves.hoovercityschools.net/',
        fullContent: `
            <p>How to Play KIBO Sight Word Bowling:</p>
            <br>
            <p>Have one set of sight word flashcards for the students to read from and have one set of the same words taped onto the bowling pins. Students will take turns reading the words and then trying to knock down the corresponding sight word pin using KIBO. I like to space the pins out a good bit so there is more space to knock down that particular pin not all of the pins. You also could do a "strike" where a student reads all the sight words and knocks down all of the pins. This game is diverse because you can do it in either reading or math. In math, use it to practice math facts or subitizing.</p>
            <br>
            <p><strong>Materials Needed:</strong></p>
            <ul>
                <li>Bowling Pins</li>
                <li>KIBO</li>
                <li>Sight Word Flashcards</li>
            </ul>
            <br>
            <p>Staley is a First Grade Teacher at Green Valley Elementary in Hoover, AL. Follow Staley at @Mcilwain1st.</p>
        `,
        images: [activity21Image],
        categories: ['Activities'],
        tags: ['Literacy', 'Bowling'],
        websiteUrl: 'https://gves.hoovercityschools.net/'
    },
    {
        id: '22',
        title: 'No KIBO? No Problem! Guide',
        description: 'The "No KIBO? No Problem" Guide is a collection of engaging STEAM activities you can do with your kids without a KIBO robot kit!',
        contributor: 'KinderLab Robotics, Inc.',
        fullContent: `
            <p>Stuck at home without a KIBO? Our free booklet "No KIBO? No Problem" is a collection of engaging STEAM activities you can do without a KIBO robot kit! These activities are drawn from our <a href="/education/stem-curriculum/" target="_blank" style="color: #8b5cf6; text-decoration: underline;">160+ hours of standards aligned curriculum</a>.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${noKiboNoProblemPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">No KIBO? No Problem! (PDF)</a></p>
        `,
        images: [activity22Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['No Robot', 'STEAM'],
        pdfUrl: noKiboNoProblemPdf
    },
    {
        id: '23',
        title: 'KIBO Introduction Lesson Plan',
        description: 'This KIBO introduction lesson plan describes an open-ended, stations-based introduction to KIBO\'s sound, light, and motion capabilities.',
        contributor: 'Cynthia Ramirez',
        contributorLink: 'https://pwe.dpisd.org/',
        fullContent: `
            <p>This KIBO introduction lesson plan describes an open-ended, stations-based introduction to KIBO's sound, light, and motion capabilities.</p>
            <br>
            <p>KIBO Ambassador Cynthia Ramirez is a Campus Technology Integration Specialist from Parkwood Elementary, Deer Park ISD, in Pasadena Texas. Follow Cynthia at <a href="https://twitter.com/Cynthia_Edtech" target="_blank" style="color: #8b5cf6; text-decoration: underline;">@Cynthia_Edtech</a>.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${ramirezKiboLessonPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Intro Lesson - Cynthia Ramirez</a></p>
        `,
        images: [activity23Image],
        categories: ['Activities'],
        tags: ['Introduction', 'Stations'],
        pdfUrl: ramirezKiboLessonPdf
    },
    {
        id: '24',
        title: 'KIBO Catch',
        description: 'Receiving a touchdown pass? Making a outfield save? Play catch with KIBO in this open-ended, gross-motor Free Throw Extension Set activity.',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: 'https://kinderlabrobotics.com',
        fullContent: `
            <p>Receiving a touchdown pass? Making a great outfield save? Play catch with KIBO in this open-ended, gross-motor Free Throw Extension Set activity.</p>
            <br>
            <p>This activity uses the KIBO <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Free Throw Extension Set</a>. This activity supports CSTA computer science standards.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p><a href="${kiboCatchPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Catch Activity (PDF)</a></p>
        `,
        images: [activity24Image],
        categories: ['Activities'],
        tags: ['Sports', 'Physical Activity'],
        pdfUrl: kiboCatchPdf
    },
    {
        id: '25',
        title: 'KIBO Bin Ball',
        description: 'KIBO needs to make a basket to win the game! What is the right combination of movement and Free Throw options to land the ball in the basket?',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: 'https://kinderlabrobotics.com',
        fullContent: `
            <p>KIBO needs to make a basket to win the game! What is the right combination of movement and Free Throw options to land the ball in the basket?</p>
            <br>
            <p>This activity uses the KIBO <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Free Throw Extension Set</a>. This activity supports Common Core Math standards and NGSS Science standards.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p> <a href="${kiboBinBallPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Bin-Ball Activity (with Data Collection Sheet) PDF</a></p>
        `,
        images: [activity25Image],
        videoUrl: '1FNL1z-nDzQ',
        pdfUrl: kiboBinBallPdf,
        categories: ['Activities'],
        tags: ['Sports', 'Strategy']
    },
    {
        id: '26',
        title: 'KIBO Mark and Measure Activity',
        description: 'Experiment, measure, and record with the KIBO Free Throw Extension. As students mark each landing spot, a pattern emerges.',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: 'https://kinderlabrobotics.com',
        fullContent: `
            <p>Experiment, measure, and record with the KIBO Free Throw Extension Set. As students mark each landing spot, a pattern emerges.</p>
            <br>
            <p>This activity uses the KIBO <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Free Throw Extension Set</a>. This activity supports Common Core Math standards and NGSS Science standards.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p> <a href="${kiboMarkMeasurePdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Mark and Measure Activity with data collection sheet (PDF)</a></p>
        `,
        images: [activity26Image],
        pdfUrl: kiboMarkMeasurePdf,
        categories: ['Activities'],
        tags: ['Measurement', 'Data']
    },
    {
        id: '27',
        title: 'KIBO Shape Search Activity',
        description: 'Imagine, create, and test a program to make KIBO draw your shape or letter with KIBO\'s Marker Extension Set!',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: 'https://kinderlabrobotics.com',
        fullContent: `
            <p>Search for a favorite shape or letter in your room. A square, a circle? The first letter of your name? Imagine, create, and test a program to make KIBO draw your letter with KIBO's Marker Extension Set. Create a flag that shows your shape or letter and fly it from your KIBO's flagpole while your program runs! Students doing this activity should have prior experience programming KIBO with an understanding of KIBO movement commands.</p>
            <br>
            <p>This activity uses the KIBO <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Marker Extension Set</a> to let KIBO draw; and, optionally, the <a href="/shop/extensions" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Expression Module</a> to fly a custom-made shape or letter flag. This activity supports Common Core PreK and K literacy and math standards.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p> <a href="${kiboShapeSearchPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Shape Search Activity (PDF)</a></p>
        `,
        images: [activity27Image],
        pdfUrl: kiboShapeSearchPdf,
        categories: ['Activities'],
        tags: ['Drawing', 'Shapes']
    },
    {
        id: '28',
        title: 'The Engineering Design Process',
        description: 'This Process structures student work in hands-on STEAM projects: ASK, IMAGINE, PLAN, CREATE, TEST & IMPROVE, and SHARE. Try it today!',
        contributor: 'KinderLab Robotics, Inc.',
        fullContent: `
            <p>When making projects, engineers follow a series of steps called the Engineering Design Process.</p>
            <br>
            <p>It has 6 steps:</p>
            <ul style="margin-left: 20px; margin-bottom: 16px;">
                <li>• ASK</li>
                <li>• IMAGINE</li>
                <li>• PLAN</li>
                <li>• CREATE</li>
                <li>• TEST & IMPROVE</li>
                <li>• and SHARE</li>
            </ul>
            <p>The Engineering Design Process is a cycle – there's no official starting or ending point. You can begin at any step, move back and forth between steps, or repeat the cycle over and over!</p>
            <br>
            <p>Learn more about <a href="/education/stem-curriculum/" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KinderLab's KIBO Curriculum</a>.</p>
            <br>
            <p><strong> Resource Files</strong></p>
            <p> <a href="${klEngineeringDesignPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Engineering Design Process handout</a></p>
        `,
        images: [activity28Image],
        pdfUrl: klEngineeringDesignPdf,
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Engineering', 'Design Process']
    },
    {
        id: '29',
        title: 'Geography for Yom Ha\'atzmaut',
        description: 'This geographic activity integrates classroom learning about Yom Ha\'atzmaut, as well as creating a floor map of Israel and other key places.',
        contributor: 'Ilana Picker, The Shefa School',
        contributorLink: 'http://www.shefaschool.org/',
        fullContent: `
            <p>For Yom Ha'atzmaut we created a huge map of Israel. The students were then given pieces of paper with directions of where KIBO should travel. Each student was given a different direction. An example might be – travel from Jerusalem to Beer Sheva to Eilat. This integrated the learning that was going on in the classroom about Yom Ha'atzmaut and Israel, as well as integrating creative hands-on learning about the geography and map of Israel and the location of places. Students learned where Jerusalem is in relation to Tel Aviv, how to travel south to the desert, and how to get to Haifa which is on the sea.</p>
        `,
        images: [activity29Image],
        videoUrl: 'WAz1GCik1Ak',
        categories: ['Activities'],
        tags: ['Geography', 'Culture'],
        websiteUrl: 'http://www.shefaschool.org/'
    },
    {
        id: '30',
        title: 'KIBO Expression Module Ideas',
        description: 'Here are a few ideas for using the KIBO Expression Module to create new and fun ways to help KIBO communicate and express itself.',
        contributor: 'KinderLab Robotics, Inc.',
        contributorLink: 'https://kinderlabrobotics.com',
        fullContent: `
            <p>You can use the <a href="https://kinderlabrobotics.com/expression-module/" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Expression Module</a> to create new and fun ways to help KIBO communicate! Here are just a few activity ideas:</p>
            <br>
            <p>— Create flags representing different countries, or come up with your own. Make a flag that represents your school, your town, or your family! If you have several KIBOs, make flags to represent different teams and then come up with challenges so that the teams can race!</p>
            <br>
            <p>— Install the flagpole on top of a stage support and the flag will fly proud. Install the flagpole on top of a motor and watch the flag spin around!</p>
            <br>
            <p>— If you have several KIBOs, install white boards on all of them (install on the "stage support" so the white boards don't spin). Write a letter on each white board. Then, program the KIBOs to create a word!</p>
            <br>
            <p>— Make KIBO look like a bird! Install the white board (horizontally or vertically) on the flag pole and use a motor so the white board will spin. Tape streamers to the edges of the white board, tape construction paper and put googly eyes on your "bird"</p>
            <br>
            <p>— Insert other decorated materials besides the white board into the "holders" of the flagpoles. You can use cardboard, playing cards, or even a mirror! See what interesting projects you can come up with when you use a mirror.</p>
        `,
        images: [activity30Image],
        categories: ['Activities'],
        tags: ['Expression', 'Communication'],
        websiteUrl: 'https://kinderlabrobotics.com'
    },
    {
        id: '31',
        title: 'KIBO Expression Module Literacy Activities',
        description: 'These activities are designed for students to practice reading and writing using KIBO’s Expression Module.',

        contributor: 'Boston College DevTech Research Group',
        contributorLink: 'https://sites.bc.edu/devtech/',
        fullContent: `
            <p>This curriculum guide contains activities designed for students to practice reading and writing using KIBO's Expression Module. These activities can be done individually or can be integrated with a KIBO robotics curriculum. Pick whichever activities resonate the most with you and your students. While these activities are designed for kindergarten students, they can easily be adapted for first and second grade students.</p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p> <a href="${kiboExpressionModulePdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">KIBO Expression Module Activities</a></p>
        `,
        images: [activity31Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Expression', 'Communication', 'Programming'],
        pdfUrl: kiboExpressionModulePdf
    },
    {
        id: '32',
        title: 'KIBO Bowling',
        description: 'KIBO Bowling provides a playful, fun goal-oriented activity for measurement, prediction, iteration, and to develop math and logical thinking skills.',
        contributor: 'Todd Burleson, Maker/Teacher/Librarian @ Hubbard Woods Elementary School in Winnetka, IL',
        fullContent: `
            <p><strong>KIBO Bowling</strong> provides opportunities for measurement, prediction, and iteration in a fun goal-oriented activity. Contributor Todd Burleson writes:</p>
            <br>
            <p>"After students have had some practice creating programs, this is a fun way to develop mathematical and logical thinking skills. You can use ten objects of similar shape. I found these bowling pin sets at my local toy store. I had the students measure two meters away from the pins and place a tape line as the starting point. Students then built a program that moved KIBO down their 'lane.' They used tally marks to record the number of pins knocked down on their first attempt. Then, the students tweaked their program to try to get the remaining pins. Students explored starting KIBO at different spots along their starting line and adding turns, spins and even flashing lights for fun!"</p>
            <br>
            <p>Contributed by Todd Burleson<br>
            Maker/Teacher/Librarian at <a href="https://hubbardwoods.winnetka36.org/" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Hubbard Woods Elementary School</a> in Winnetka, IL<br>
            <a href="https://x.com/todd_burleson" style="color: #8b5cf6; text-decoration: underline;">@todd_burleson</a></p>
        `,
        images: [activity32Image, activity32Image1, activity32Image2, activity32Image3],
        categories: ['Activities'],
        tags: ['Education', 'Community', 'Innovation'],
        websiteUrl: 'https://hubbardwoods.winnetka36.org/'
    },
    {
        id: '33',
        title: 'KIBO Independent Exploration',
        description: 'These activity cards are for self-directed, independent exploration when using KIBO in an “activity corner” settings.',
        contributor: 'Rivka Heisler, SAR Academy',
        contributorLink: 'http://www.saracademy.org/',
        fullContent: `
            <p>These activity cards are intended for self-directed, independent exploration of KIBO in an "activity corner" setting. These cards progress from beginners to more complex coding commands.</p>
            <br>
            <p>Rivka Heisler, <a href="http://www.saracademy.org/" target="_blank" style="color: #8b5cf6; text-decoration: underline;">SAR Academy</a></p>
            <br>
            <p><strong>Resource Files</strong></p>
            <p> <a href="${kiboChallengesRivkaPdf}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Kibo Challenges - Rivka Heisler - SAR Academy</a></p>
        `,
        images: [activity33Image],
        categories: ['Activities'],
        tags: ['Challenges', 'Programming', 'Problem Solving'],
        pdfUrl: kiboChallengesRivkaPdf
    },
    {
        id: '34',
        title: 'KIBO Drawing',
        description: 'This fun STEAM activity has KIBO drawing! What program can you design to have KIBO draw a particular shape?',
        contributor: 'Dr. Peter Schaffer',
        fullContent: `
            <p>An awesome STEAM project is to make the KIBO draw. This fun STEAM experience opens a door for questions like "what drawing will this program make?" and "what program would we need to draw a particular shape?"</p>
            <br>
            <p>In this activity, kids attach a pen to the back of the KIBO using 5 clothespins as depicted and place KIBO on paper on the floor. And the game was on!</p>
            <br>
            <p>As KIBO moves around, kids can decide if they want KIBO to move in a regular way, e.g. in a square or circle, or drawing something funny. Or you might simply want to experiment! Once kids know what they want KIBO to draw, they then program KIBO with the wooden programming blocks.</p>
            <br>
            <p>Kids test the program and see if it draws as they want. Did KIBO create the masterpiece they wanted?</p>
        `,
        images: [activity34Image],
        categories: ['Activities'],
        tags: ['Creativity', 'Arts Integration', 'STEM']
    },
    {
        id: '35',
        title: 'Dances from Around the World',
        description: 'In this curriculum, students select a cultural dance of their choice, decorate their KIBO robot as a dancer, and then program KIBO to dance.',
        contributor: 'Boston College DevTech Research Group',
        contributorLink: 'https://sites.bc.edu/devtech/',
        fullContent: `
            <p>With the <em>Dances from Around the World</em> curriculum, students, over the course of several weeks, work alone or in groups to build and program a robot to demonstrate their understanding of robotics and programming concepts they have mastered. They select a cultural dance of their choice, decorate their KIBO as a dancer, and then program their KIBO robot to dance.</p>
            <br>
            <p>During the course of the final project, students put to use all the concepts learned during previous lessons for there final dance routine. The students can also showcase their work for their parents, siblings, and schoolmates. Let's dance!</p>
            <br>
            <p>Download the <a href="${dancesAroundWorldPdf}" target="_blank" style="color: #f97316; text-decoration: underline;">Dances from Around the World curriculum</a>.</p>
        `,
        images: [activity35Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Culture', 'Dance', 'Global Learning', 'Arts Integration'],
        pdfUrl: dancesAroundWorldPdf
    },
    {
        id: '36',
        title: '"Who Am I?" KIBO Curriculum',
        description: 'The “Who Am I?” curriculum integrates identity, culture, and diversity with fundamental engineering and programming concepts.',
        contributor: 'Boston College DevTech Research Group',
        contributorLink: 'https://sites.bc.edu/devtech/',
        fullContent: `
            <p>The <em>Who Am I?</em> curriculum integrates identity, culture, and diversity with fundamental engineering and programming concepts. Throughout the curriculum, students learn about their cultural background, as well as the backgrounds of other students, and then create robotic representations of themselves to express their culture in a creative way.</p>
            <br>
            <p>Download the <a href="https://sites.bc.edu/devtech/" target="_blank" style="color: #f97316; text-decoration: underline;">Who Am I? curriculum</a>.</p>
        `,
        images: [activity36Image],
        categories: ['Activities'],
        tags: ['Research', 'Computational Thinking', 'Early Childhood'],
        websiteUrl: 'https://sites.bc.edu/devtech/'
    },
    {
        id: '37',
        title: 'Where the Wild Things Are Curriculum',
        description: 'Inspired by the book Where the Wild Things Are, this curriculum incorporates literacy and robotics as KIBO acts out the “wild rumpus” scene.',
        contributor: 'Boston College DevTech Research Group',
        contributorLink: 'https://sites.bc.edu/devtech/',
        fullContent: `
            <p>Inspired by the book <em>Where the Wild Things Are</em>, this curriculum incorporates literacy and robotics. Students work alone or in groups to recreate the "wild rumpus" by programming their KIBO robots to act out this iconic scene in the book.</p>
            <br>
            <p>Download the <a href="${whereWildThingsArePdf}" target="_blank" style="color: #f97316; text-decoration: underline;">Where the Wild Things Are curriculum</a>.</p>
        `,
        images: [activity37Image],
        categories: ['Activities', 'Curriculum Units'],
        tags: ['Literature', 'Storytelling', 'Creative Expression', 'Programming'],
        pdfUrl: whereWildThingsArePdf
    }
];

const Activities: React.FC = () => {
    const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentContentPage, setCurrentContentPage] = useState(0);

    const openActivityModal = (activity: ActivityCard) => {
        setSelectedActivity(activity);
        setCurrentImageIndex(0);
        setCurrentContentPage(0);
    };

    const closeActivityModal = () => {
        setSelectedActivity(null);
        setCurrentImageIndex(0);
        setCurrentContentPage(0);
    };

    const nextImage = () => {
        if (selectedActivity) {
            if (selectedActivity.id === '4' || selectedActivity.id === '25' || selectedActivity.id === '29') {
                // For activity 4, 25 and 29: video + images (total items = 1 video + images.length)
                const totalItems = 1 + selectedActivity.images.length;
                setCurrentImageIndex((prev) =>
                    prev === totalItems - 1 ? 0 : prev + 1
                );
            } else if (selectedActivity.images.length > 1) {
                setCurrentImageIndex((prev) =>
                    prev === selectedActivity.images.length - 1 ? 0 : prev + 1
                );
            }
        }
    };

    const prevImage = () => {
        if (selectedActivity) {
            if (selectedActivity.id === '4' || selectedActivity.id === '25' || selectedActivity.id === '29') {
                // For activity 4, 25 and 29: video + images (total items = 1 video + images.length)
                const totalItems = 1 + selectedActivity.images.length;
                setCurrentImageIndex((prev) =>
                    prev === 0 ? totalItems - 1 : prev - 1
                );
            } else if (selectedActivity.images.length > 1) {
                setCurrentImageIndex((prev) =>
                    prev === 0 ? selectedActivity.images.length - 1 : prev - 1
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

    // Function to split content into pages
    const splitContentIntoPages = (content: string, activityId?: string): string[] => {
        // MANUAL PAGE DEFINITIONS - Edit these to control what appears on each page
        // To add custom pagination for any activity, add a new 'if (activityId === 'X')' block below
        // Replace 'X' with the activity ID and define page1Content, page2Content, etc.
        if (activityId === '3') {
            // For activity 3 (Very Hungry Caterpillar)
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

        // Activity 4: Single page content
        if (activityId === '4') {
            return [content]; // Return as single page
        }

        // Original logic for other activities
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
        if (selectedActivity) {
            const pages = splitContentIntoPages(selectedActivity.fullContent, selectedActivity.id);
            setCurrentContentPage((prev) =>
                prev === pages.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevContentPage = () => {
        if (selectedActivity) {
            const pages = splitContentIntoPages(selectedActivity.fullContent, selectedActivity.id);
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
                            Coding And Robotics Activities
                        </h1>
                        <p className="text-white/90 mb-6 text-lg max-w-4xl">
                            The early childhood STEM lessons below are just a small sample of what you can do with the KIBO robot with your young learners.
                            From bringing a story to life with KIBO, to introducing AI to kids, to using KIBO to teach measurements, there is an activity here for you! We can't wait to see what you come up with. Please share your early childhood STEM lessons and we will get them posted.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow bg-orange-50">
                <div className="container mx-auto px-4 py-12">
                    {/* Activities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                onClick={() => {
                                    // Only redirect directly to PDF for "Thinking with KIBO" (ID: 5) and "Maps, Measurement, and Make-Believe" (ID: 6)
                                    if ((activity.id === '5' || activity.id === '6') && activity.pdfUrl) {
                                        window.open(activity.pdfUrl, '_blank');
                                    } else {
                                        // Open modal for all other activities
                                        openActivityModal(activity);
                                    }
                                }}
                                className="bg-purple-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                {/* Activity Image */}
                                <div className="relative">
                                    {activity.videoUrl ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(activity.videoUrl)}/maxresdefault.jpg`}
                                            alt={activity.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : activity.images && activity.images[0] ? (
                                        (
                                            <img
                                                src={activity.images[0]}
                                                alt={activity.title}
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
                                            Activities
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Content */}
                                <div className="p-4">
                                    {/* Activity Title */}
                                    <h3 className="text-lg font-bold text-kibo-orange mb-2">
                                        {activity.title}
                                    </h3>

                                    {/* Activity Description */}
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Activity Modal */}
            {selectedActivity && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={closeActivityModal}
                >                    <div
                    className="bg-purple-200 rounded-lg overflow-hidden w-full max-w-[1500px] h-full max-h-[1050px] relative flex flex-col mx-4 my-4 md:mx-8 md:my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                        {/* Close Button */}
                        <button
                            onClick={closeActivityModal}
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
                                    {selectedActivity.id === '4' || selectedActivity.id === '25' || selectedActivity.id === '29' ? (
                                        // Activity 4: Show video first, then images with navigation
                                        <>
                                            <div className="relative h-[300px]">
                                                {currentImageIndex === 0 && selectedActivity.videoUrl ? (
                                                    // Show YouTube video when index is 0
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={(selectedActivity.id === '25' || selectedActivity.id === '29') ? `https://www.youtube.com/embed/${selectedActivity.videoUrl}` : `https://www.youtube.com/embed/${getYouTubeVideoId(selectedActivity.videoUrl)}`}
                                                            title={selectedActivity.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : selectedActivity.images[currentImageIndex - 1] ? (
                                                    // Show images when index >= 1 (subtract 1 for array index)
                                                    <img
                                                        src={selectedActivity.images[currentImageIndex - 1]}
                                                        alt={`${selectedActivity.title} - Image ${currentImageIndex}`}
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
                                                {selectedActivity.videoUrl && (
                                                    <button
                                                        onClick={() => setCurrentImageIndex(0)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === 0 ? 'bg-kibo-orange' : 'bg-gray-300 hover:bg-gray-400'
                                                            }`}
                                                    />
                                                )}
                                                {/* Image dots */}
                                                {selectedActivity.images.map((image, index) => (
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
                                        // Regular carousel for other activities
                                        <>
                                            <div className="relative h-[300px]">
                                                {selectedActivity.videoUrl && selectedActivity.id === '2' ? (
                                                    // Show YouTube video for activity 2
                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedActivity.videoUrl)}`}
                                                            title={selectedActivity.title}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : selectedActivity.images[currentImageIndex] ? (
                                                    <img
                                                        src={selectedActivity.images[currentImageIndex]}
                                                        alt={`${selectedActivity.title} - Image ${currentImageIndex + 1}`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                                        <span className="text-gray-500 text-sm">
                                                            {selectedActivity.videoUrl ? 'Video will be loaded' : `Image ${currentImageIndex + 1} will be added`}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Navigation Arrows - Only for image galleries, not videos */}
                                                {selectedActivity.images.length > 1 && !selectedActivity.videoUrl && (
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

                                            {/* Image Dots - Only for image galleries, not videos */}
                                            {selectedActivity.images.length > 1 && !selectedActivity.videoUrl && (
                                                <div className="flex justify-center space-x-2 mt-3">
                                                    {selectedActivity.images.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentImageIndex(index)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex
                                                                ? 'bg-kibo-orange'
                                                                : 'bg-gray-300 hover:bg-gray-400'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Right - Title and Meta Info */}
                                <div className="flex-1">
                                    {/* Activity Title */}
                                    <h1 className="text-4xl font-bold text-kibo-purple mb-6">
                                        {selectedActivity.title}
                                    </h1>

                                    {/* Contributor */}
                                    {selectedActivity.contributor && (
                                        <div className="mb-6 text-lg text-gray-600 border-l-4 border-kibo-orange pl-4">
                                            <span className="font-medium">Contributed by:</span> {selectedActivity.contributor}
                                            {selectedActivity.contributorLink && (
                                                <a
                                                    href={selectedActivity.contributorLink}
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
                                        {selectedActivity.categories.map((category, index) => (
                                            <span key={index} className="bg-kibo-orange text-white px-4 py-2 rounded text-sm font-semibold">
                                                {category}
                                            </span>
                                        ))}
                                        {selectedActivity.tags.map((tag, index) => (
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
                                    const pages = splitContentIntoPages(selectedActivity.fullContent, selectedActivity.id);
                                    const currentPage = pages[currentContentPage] || selectedActivity.fullContent;

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
                                const pages = splitContentIntoPages(selectedActivity.fullContent, selectedActivity.id);
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

export default Activities;

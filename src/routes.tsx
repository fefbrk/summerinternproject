import { Route, Routes } from "react-router-dom";
import { lazy } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded page components
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const HelpMeChoose = lazy(() => import("./pages/HelpMeChoose"));
const ComparePackages = lazy(() => import("./pages/ComparePackages"));
const CompareKits = lazy(() => import("./pages/CompareKits"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AccountPage = lazy(() => import("./pages/account/AccountPage"));
const WhyKibo = lazy(() => import("./pages/WhyKibo"));
const WhichKibo = lazy(() => import("./pages/WhichKibo"));
const Kibo = lazy(() => import("./pages/Kibo"));
const KiboInAction = lazy(() => import("./pages/KiboInAction"));
const KiboInTheClassroom = lazy(() => import("./pages/KiboInTheClassroom"));
const SteamLessons = lazy(() => import("./pages/SteamLessons"));
const KiboAtHome = lazy(() => import("./pages/KiboAtHome"));
const SignUpKiboHomeCourse = lazy(() => import("./pages/SignUpKiboHomeCourse"));
const KiboUse = lazy(() => import("./pages/KiboUse"));
const StemCurriculum = lazy(() => import("./pages/StemCurriculum"));
const KiboResearch = lazy(() => import("./pages/KiboResearch"));
const ProfessionalDevelopment = lazy(() => import("./pages/ProfessionalDevelopment"));
const Grants = lazy(() => import("./pages/Grants"));
const SteamGrants = lazy(() => import("./pages/SteamGrants"));
const Tutorials = lazy(() => import("./pages/Tutorials"));
const Activities = lazy(() => import("./pages/Activities"));
const Experiences = lazy(() => import("./pages/Experiences"));
const WhitePapersWebinars = lazy(() => import("./pages/WhitePapersWebinars"));
const TechnicalSupport = lazy(() => import("./pages/TechnicalSupport"));
const SimpleAdminDashboard = lazy(() => import("./pages/SimpleAdminDashboard"));
const About = lazy(() => import("./pages/About"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Awards = lazy(() => import("./pages/Awards"));
const Events = lazy(() => import("./pages/Events"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Product pages - KIBO Kits
const Kibo10Kit = lazy(() => import("./pages/products/kibokits/Kibo10Kit"));
const Kibo15Kit = lazy(() => import("./pages/products/kibokits/Kibo15Kit"));
const Kibo18Kit = lazy(() => import("./pages/products/kibokits/Kibo18Kit"));
const Kibo21Kit = lazy(() => import("./pages/products/kibokits/Kibo21Kit"));

// Product pages - Home Editions
const Kibo10HomeEdition = lazy(() => import("./pages/products/kibohomeedition/Kibo10HomeEdition"));
const Kibo15HomeEdition = lazy(() => import("./pages/products/kibohomeedition/Kibo15HomeEdition"));

// Product pages - Classroom Packages
const ActivityCenterKibo21SteamExplorer = lazy(() => import("./pages/products/classroompackages/ActivityCenterKibo21SteamExplorer"));
const SmallClassroomKibo21SteamExplorer = lazy(() => import("./pages/products/classroompackages/SmallClassroomKibo21SteamExplorer"));
const FullClassroomKibo21SteamExplorer = lazy(() => import("./pages/products/classroompackages/FullClassroomKibo21SteamExplorer"));
const ActivityCenterKibo21 = lazy(() => import("./pages/products/classroompackages/ActivityCenterKibo21"));
const SmallClassroomKibo21 = lazy(() => import("./pages/products/classroompackages/SmallClassroomKibo21"));
const FullClassroomKibo21 = lazy(() => import("./pages/products/classroompackages/FullClassroomKibo21"));
const ActivityCenterKibo18 = lazy(() => import("./pages/products/classroompackages/ActivityCenterKibo18"));
const SmallClassroomKibo18 = lazy(() => import("./pages/products/classroompackages/SmallClassroomKibo18"));
const FullClassroomKibo18 = lazy(() => import("./pages/products/classroompackages/FullClassroomKibo18"));

// Product pages - Fun Extension Sets
const AdvancedCodingExtensionSet = lazy(() => import("./pages/products/funextensionsets/AdvancedCodingExtensionSet"));
const BuildingBrickExtensionSetBasic = lazy(() => import("./pages/products/funextensionsets/BuildingBrickExtensionSetBasic"));
const BuildingBrickExtensionSetDeluxe = lazy(() => import("./pages/products/funextensionsets/BuildingBrickExtensionSetDeluxe"));
const BundleOfFunExtensionPackage = lazy(() => import("./pages/products/funextensionsets/BundleOfFunExtensionPackage"));
const ExpressionModule = lazy(() => import("./pages/products/funextensionsets/ExpressionModule"));
const FreeThrowExtensionSet = lazy(() => import("./pages/products/funextensionsets/FreeThrowExtensionSet"));
const Kibo18ToKibo21UpgradePackage = lazy(() => import("./pages/products/funextensionsets/Kibo18ToKibo21UpgradePackage"));
const KiboCostumes = lazy(() => import("./pages/products/funextensionsets/KiboCostumes"));
const MarkerExtensionSet = lazy(() => import("./pages/products/funextensionsets/MarkerExtensionSet"));
const MarkerExtensionSetExtras = lazy(() => import("./pages/products/funextensionsets/MarkerExtensionSetExtras"));
const SoundRecordPlaybackModule = lazy(() => import("./pages/products/funextensionsets/SoundRecordPlaybackModule"));

// Product pages - Parts and Replacements
const BeepBlock = lazy(() => import("./pages/products/partsandreplacements/BEEPBlock"));
const BeginAndEndBlocks = lazy(() => import("./pages/products/partsandreplacements/BeginAndEndBlocks"));
const BlockStickerUpgrade = lazy(() => import("./pages/products/partsandreplacements/BlockStickerUpgrade"));
const BlockStickerUpgradeForKIBO18 = lazy(() => import("./pages/products/partsandreplacements/BlockStickerUpgradeForKIBO18"));
const BlockStickerUpgradeForKIBO21 = lazy(() => import("./pages/products/partsandreplacements/BlockStickerUpgradeForKIBO21"));
const ClapSoundSensorEar = lazy(() => import("./pages/products/partsandreplacements/ClapSoundSensorEar"));
const ConditionalBlocks = lazy(() => import("./pages/products/partsandreplacements/ConditionalBlocks"));
const DistanceSensorTelescope = lazy(() => import("./pages/products/partsandreplacements/DistanceSensorTelescope"));
const FirmwareUpdateCable = lazy(() => import("./pages/products/partsandreplacements/FirmwareUpdateCable"));
const FORWARDBlock = lazy(() => import("./pages/products/partsandreplacements/FORWARDBlock"));
const IFAndENDIFBlocks = lazy(() => import("./pages/products/partsandreplacements/IFAndENDIFBlocks"));
const LIGHTONBlocks = lazy(() => import("./pages/products/partsandreplacements/LIGHTONBlocks"));
const LightOutputSensorLightbulb = lazy(() => import("./pages/products/partsandreplacements/LightOutputSensorLightbulb"));
const LightSensorEye = lazy(() => import("./pages/products/partsandreplacements/LightSensorEye"));
const MotionBlocks = lazy(() => import("./pages/products/partsandreplacements/MotionBlocks"));
const MotorModule = lazy(() => import("./pages/products/partsandreplacements/MotorModule"));
const ParametersForIFTHENBlocks = lazy(() => import("./pages/products/partsandreplacements/ParametersForIFTHENBlocks"));
const ParametersForREPEATBlocks = lazy(() => import("./pages/products/partsandreplacements/ParametersForREPEATBlocks"));
const ParametersForRepeatNumbersOnly = lazy(() => import("./pages/products/partsandreplacements/ParametersForRepeatNumbersOnly"));
const SINGBlock = lazy(() => import("./pages/products/partsandreplacements/SINGBlock"));
const SPINBlock = lazy(() => import("./pages/products/partsandreplacements/SPINBlock"));
const StageArtPlatform = lazy(() => import("./pages/products/partsandreplacements/StageArtPlatform"));
const StagePedestal = lazy(() => import("./pages/products/partsandreplacements/StagePedestal"));
const StageSupport = lazy(() => import("./pages/products/partsandreplacements/StageSupport"));
const TurntableArtPlatform = lazy(() => import("./pages/products/partsandreplacements/TurntableArtPlatform"));
const WAITFORCLAPBlock = lazy(() => import("./pages/products/partsandreplacements/WAITFORCLAPBlock"));
const Wheel = lazy(() => import("./pages/products/partsandreplacements/Wheel"));

// Product pages - Teaching Materials
const GrowingWithKIBO = lazy(() => import("./pages/products/teachingmaterials/GrowingWithKIBO"));
const ExploringWithKIBO = lazy(() => import("./pages/products/teachingmaterials/ExploringWithKIBO"));
const KiboCodingCards = lazy(() => import("./pages/products/teachingmaterials/KiboCodingCards"));
const ActivityCenterGuidebook = lazy(() => import("./pages/products/teachingmaterials/ActivityCenterGuidebook"));
const CreatingWithKiboGuide = lazy(() => import("./pages/products/teachingmaterials/CreatingWithKiboGuide"));
const KiboActivityCards = lazy(() => import("./pages/products/teachingmaterials/KiboActivityCards"));
const KiboSaysGame = lazy(() => import("./pages/products/teachingmaterials/KiboSaysGame"));
const AskAndImagineGuide = lazy(() => import("./pages/products/teachingmaterials/AskAndImagineGuide"));
const AssessmentWorkbook = lazy(() => import("./pages/products/teachingmaterials/AssessmentWorkbook"));
const BlendedLearningBundle = lazy(() => import("./pages/products/teachingmaterials/BlendedLearningBundle"));
const BuildItBetterGuide = lazy(() => import("./pages/products/teachingmaterials/BuildItBetterGuide"));
const EngineeringDesignJournals = lazy(() => import("./pages/products/teachingmaterials/EngineeringDesignJournals"));
const ExpressYourselfGuide = lazy(() => import("./pages/products/teachingmaterials/ExpressYourselfGuide"));
const MakeLearningVisibleGuide = lazy(() => import("./pages/products/teachingmaterials/MakeLearningVisibleGuide"));
const ModuleCurriculumGuidesBundle = lazy(() => import("./pages/products/teachingmaterials/ModuleCurriculumGuidesBundle"));
const ShowtimeWithKiboGuide = lazy(() => import("./pages/products/teachingmaterials/ShowtimeWithKiboGuide"));
const TeachingMaterialsPackage = lazy(() => import("./pages/products/teachingmaterials/TeachingMaterialsPackage"));
const TwoPosters = lazy(() => import("./pages/products/teachingmaterials/TwoPosters"));

// Product pages - Training, Clearance, Service
const TrainingOneHourWebConference = lazy(() => import("./pages/products/training/TrainingOneHourWebConference"));
const ActivityCards1stEditionClearance = lazy(() => import("./pages/products/clearance/ActivityCards1stEditionClearance"));
const AssessmentWorkbook1stEditionClearance = lazy(() => import("./pages/products/clearance/AssessmentWorkbook1stEditionClearance"));
const BuildItBetterClearance = lazy(() => import("./pages/products/clearance/BuildItBetterClearance"));
const ExpressYourselfClearance = lazy(() => import("./pages/products/clearance/ExpressYourselfClearance"));
const MakeLearningVisibleClearance = lazy(() => import("./pages/products/clearance/MakeLearningVisibleClearance"));
const ShowtimeWithKiboClearance = lazy(() => import("./pages/products/clearance/ShowtimeWithKiboClearance"));
const KiboRepairService = lazy(() => import("./pages/products/service/KiboRepairService"));

// Content pages
const Blog = lazy(() => import("./pages/blog/Blog"));
const BlogPostDetail = lazy(() => import("./pages/blog/BlogPostDetail"));
const MediaCoverage = lazy(() => import("./pages/mediacoverage/MediaCoverage"));
const MediaCoverageDetail = lazy(() => import("./pages/mediacoverage/MediaCoverageDetail"));
const PressReleases = lazy(() => import("./pages/pressreleases/PressReleases"));
const PressReleaseDetail = lazy(() => import("./pages/pressreleases/PressReleaseDetail"));

/**
 * All application route definitions.
 * Extracted from App.tsx for better organization.
 */
const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:category" element={<Shop />} />
        <Route path="/shop/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/help-me-choose" element={<HelpMeChoose />} />
        <Route path="/compare-packages" element={<ComparePackages />} />
        <Route path="/compare-kits" element={<CompareKits />} />
        <Route path="/why-kibo" element={<WhyKibo />} />
        <Route path="/kibo/which/" element={<WhichKibo />} />
        <Route path="/kibo" element={<Kibo />} />
        <Route path="/kibo/in-action" element={<KiboInAction />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/kibo/in-the-classroom" element={<KiboInTheClassroom />} />
        <Route path="/kibo/use/steam-lessons-and-activities" element={<SteamLessons />} />
        <Route path="/kibo/at-home" element={<KiboAtHome />} />
        <Route path="/sign-up-for-the-kibo-home-robotics-course" element={<SignUpKiboHomeCourse />} />
        <Route path="/kibo/use" element={<KiboUse />} />
        <Route path="/education/stem-curriculum" element={<StemCurriculum />} />
        <Route path="/kibo/why/research" element={<KiboResearch />} />
        <Route path="/education/professional-development" element={<ProfessionalDevelopment />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/kibo/steam-grants" element={<SteamGrants />} />
        <Route path="/resources/tutorials" element={<Tutorials />} />
        <Route path="/resources/activities" element={<Activities />} />
        <Route path="/resources/experiences" element={<Experiences />} />
        <Route path="/resources/white-papers-webinars" element={<WhitePapersWebinars />} />
        <Route path="/technical-support" element={<TechnicalSupport />} />
        <Route path="/admin" element={<ProtectedRoute><SimpleAdminDashboard /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Product routes - KIBO Kits */}
        <Route path="/products/kibo-10-kit" element={<Kibo10Kit />} />
        <Route path="/products/kibo-15-kit" element={<Kibo15Kit />} />
        <Route path="/products/kibo-18-kit" element={<Kibo18Kit />} />
        <Route path="/products/kibo-21-kit" element={<Kibo21Kit />} />
        <Route path="/products/kibo-10-home-edition" element={<Kibo10HomeEdition />} />
        <Route path="/products/kibo-15-home-edition" element={<Kibo15HomeEdition />} />

        {/* Product routes - Classroom Packages */}
        <Route path="/products/activity-center-kibo-21-steam-explorer" element={<ActivityCenterKibo21SteamExplorer />} />
        <Route path="/products/small-classroom-kibo-21-steam-explorer" element={<SmallClassroomKibo21SteamExplorer />} />
        <Route path="/products/full-classroom-kibo-21-steam-explorer" element={<FullClassroomKibo21SteamExplorer />} />
        <Route path="/products/activity-center-kibo-21" element={<ActivityCenterKibo21 />} />
        <Route path="/products/small-classroom-kibo-21" element={<SmallClassroomKibo21 />} />
        <Route path="/products/full-classroom-kibo-21" element={<FullClassroomKibo21 />} />
        <Route path="/products/activity-center-kibo-18" element={<ActivityCenterKibo18 />} />
        <Route path="/products/small-classroom-kibo-18" element={<SmallClassroomKibo18 />} />
        <Route path="/products/full-classroom-kibo-18" element={<FullClassroomKibo18 />} />

        {/* Product routes - Fun Extension Sets */}
        <Route path="/products/advanced-coding-extension-set" element={<AdvancedCodingExtensionSet />} />
        <Route path="/products/building-brick-extension-set-basic" element={<BuildingBrickExtensionSetBasic />} />
        <Route path="/products/building-brick-extension-set-deluxe" element={<BuildingBrickExtensionSetDeluxe />} />
        <Route path="/products/bundle-of-fun-extension-package" element={<BundleOfFunExtensionPackage />} />
        <Route path="/products/expression-module" element={<ExpressionModule />} />
        <Route path="/products/free-throw-extension-set" element={<FreeThrowExtensionSet />} />
        <Route path="/products/kibo-18-to-kibo-21-upgrade-package" element={<Kibo18ToKibo21UpgradePackage />} />
        <Route path="/products/kibo-costumes" element={<KiboCostumes />} />
        <Route path="/products/marker-extension-set" element={<MarkerExtensionSet />} />
        <Route path="/products/marker-extension-set-extras" element={<MarkerExtensionSetExtras />} />
        <Route path="/products/sound-record-playback-module" element={<SoundRecordPlaybackModule />} />

        {/* Product routes - Parts and Replacements */}
        <Route path="/products/beep-block" element={<BeepBlock />} />
        <Route path="/products/begin-and-end-blocks" element={<BeginAndEndBlocks />} />
        <Route path="/products/block-sticker-upgrade" element={<BlockStickerUpgrade />} />
        <Route path="/products/block-sticker-upgrade-for-kibo-18" element={<BlockStickerUpgradeForKIBO18 />} />
        <Route path="/products/block-sticker-upgrade-for-kibo-21" element={<BlockStickerUpgradeForKIBO21 />} />
        <Route path="/products/clap-sound-sensor-ear" element={<ClapSoundSensorEar />} />
        <Route path="/products/conditional-blocks" element={<ConditionalBlocks />} />
        <Route path="/products/distance-sensor-telescope" element={<DistanceSensorTelescope />} />
        <Route path="/products/firmware-update-cable" element={<FirmwareUpdateCable />} />
        <Route path="/products/forward-block" element={<FORWARDBlock />} />
        <Route path="/products/if-and-end-if-blocks" element={<IFAndENDIFBlocks />} />
        <Route path="/products/light-on-blocks" element={<LIGHTONBlocks />} />
        <Route path="/products/light-output-sensor-lightbulb" element={<LightOutputSensorLightbulb />} />
        <Route path="/products/light-sensor-eye" element={<LightSensorEye />} />
        <Route path="/products/motion-blocks" element={<MotionBlocks />} />
        <Route path="/products/motor-module" element={<MotorModule />} />
        <Route path="/products/parameters-for-if-then-blocks" element={<ParametersForIFTHENBlocks />} />
        <Route path="/products/parameters-for-repeat-blocks" element={<ParametersForREPEATBlocks />} />
        <Route path="/products/parameters-for-repeat-blocks-numbers-only" element={<ParametersForRepeatNumbersOnly />} />
        <Route path="/products/sing-block" element={<SINGBlock />} />
        <Route path="/products/spin-block" element={<SPINBlock />} />
        <Route path="/products/stage-art-platform" element={<StageArtPlatform />} />
        <Route path="/products/stage-pedestal" element={<StagePedestal />} />
        <Route path="/products/stage-support" element={<StageSupport />} />
        <Route path="/products/turntable-art-platform" element={<TurntableArtPlatform />} />
        <Route path="/products/wait-for-clap-block" element={<WAITFORCLAPBlock />} />
        <Route path="/products/wheel" element={<Wheel />} />

        {/* Product routes - Teaching Materials */}
        <Route path="/products/growing-with-kibo" element={<GrowingWithKIBO />} />
        <Route path="/products/exploring-with-kibo" element={<ExploringWithKIBO />} />
        <Route path="/products/kibo-coding-cards" element={<KiboCodingCards />} />
        <Route path="/products/training-one-hour-web-conference" element={<TrainingOneHourWebConference />} />
        <Route path="/products/activity-cards-1st-edition-clearance" element={<ActivityCards1stEditionClearance />} />
        <Route path="/products/assessment-workbook-1st-edition-clearance" element={<AssessmentWorkbook1stEditionClearance />} />
        <Route path="/products/build-it-better-clearance" element={<BuildItBetterClearance />} />
        <Route path="/products/express-yourself-clearance" element={<ExpressYourselfClearance />} />
        <Route path="/products/make-learning-visible-clearance" element={<MakeLearningVisibleClearance />} />
        <Route path="/products/showtime-with-kibo-clearance" element={<ShowtimeWithKiboClearance />} />
        <Route path="/products/activity-center-guidebook" element={<ActivityCenterGuidebook />} />
        <Route path="/products/creating-with-kibo-guide" element={<CreatingWithKiboGuide />} />
        <Route path="/products/kibo-activity-cards" element={<KiboActivityCards />} />
        <Route path="/products/kibo-says-game" element={<KiboSaysGame />} />
        <Route path="/products/ask-and-imagine-guide" element={<AskAndImagineGuide />} />
        <Route path="/products/assessment-workbook" element={<AssessmentWorkbook />} />
        <Route path="/products/blended-learning-bundle" element={<BlendedLearningBundle />} />
        <Route path="/products/build-it-better-guide" element={<BuildItBetterGuide />} />
        <Route path="/products/engineering-design-journals" element={<EngineeringDesignJournals />} />
        <Route path="/products/express-yourself-guide" element={<ExpressYourselfGuide />} />
        <Route path="/products/make-learning-visible-guide" element={<MakeLearningVisibleGuide />} />
        <Route path="/products/module-curriculum-guides-bundle" element={<ModuleCurriculumGuidesBundle />} />
        <Route path="/products/showtime-with-kibo-guide" element={<ShowtimeWithKiboGuide />} />
        <Route path="/products/teaching-materials-package" element={<TeachingMaterialsPackage />} />
        <Route path="/products/two-posters" element={<TwoPosters />} />
        <Route path="/products/kibo-repair-service" element={<KiboRepairService />} />

        {/* Blog, Media Coverage and Press Releases */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPostDetail />} />
        <Route path="/media-coverage" element={<MediaCoverage />} />
        <Route path="/media-coverage/:id" element={<MediaCoverageDetail />} />
        <Route path="/press-releases" element={<PressReleases />} />
        <Route path="/press-releases/:id" element={<PressReleaseDetail />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
    </Routes>
);

export default AppRoutes;

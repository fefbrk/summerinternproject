import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

import ProductDetail from "./pages/ProductDetail";
import HelpMeChoose from "./pages/HelpMeChoose";
import ComparePackages from "./pages/ComparePackages";
import CompareKits from "./pages/CompareKits";
import Checkout from "./pages/Checkout";
import AccountPage from "./pages/account/AccountPage";
import WhyKibo from "./pages/WhyKibo";
import WhichKibo from "./pages/WhichKibo";
import Kibo from "./pages/Kibo";
import KiboInAction from "./pages/KiboInAction";
import KiboInTheClassroom from "./pages/KiboInTheClassroom";
import SteamLessons from "./pages/SteamLessons";
import KiboAtHome from "./pages/KiboAtHome";
import SignUpKiboHomeCourse from "./pages/SignUpKiboHomeCourse";
import KiboUse from "./pages/KiboUse";
import StemCurriculum from "./pages/StemCurriculum";
import KiboResearch from "./pages/KiboResearch";
import ProfessionalDevelopment from "./pages/ProfessionalDevelopment";
import Grants from "./pages/Grants";
import SteamGrants from "./pages/SteamGrants";
import Tutorials from "./pages/Tutorials";
import Activities from "./pages/Activities";
import Experiences from "./pages/Experiences";
import WhitePapersWebinars from "./pages/WhitePapersWebinars";
import TechnicalSupport from "./pages/TechnicalSupport";
import SimpleAdminDashboard from "./pages/SimpleAdminDashboard";
import About from "./pages/About";
import Testimonials from "./pages/Testimonials";
import Awards from "./pages/Awards";
import Events from "./pages/Events";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Kibo10Kit from "./pages/products/kibokits/Kibo10Kit";
import Kibo15Kit from "./pages/products/kibokits/Kibo15Kit";
import Kibo18Kit from "./pages/products/kibokits/Kibo18Kit";
import Kibo21Kit from "./pages/products/kibokits/Kibo21Kit";
import Kibo10HomeEdition from "./pages/products/kibohomeedition/Kibo10HomeEdition";
import Kibo15HomeEdition from "./pages/products/kibohomeedition/Kibo15HomeEdition";
import ActivityCenterKibo21SteamExplorer from "./pages/products/classroompackages/ActivityCenterKibo21SteamExplorer";
import SmallClassroomKibo21SteamExplorer from "./pages/products/classroompackages/SmallClassroomKibo21SteamExplorer";
import FullClassroomKibo21SteamExplorer from "./pages/products/classroompackages/FullClassroomKibo21SteamExplorer";
import ActivityCenterKibo21 from "./pages/products/classroompackages/ActivityCenterKibo21";
import SmallClassroomKibo21 from "./pages/products/classroompackages/SmallClassroomKibo21";
import FullClassroomKibo21 from "./pages/products/classroompackages/FullClassroomKibo21";
import ActivityCenterKibo18 from "./pages/products/classroompackages/ActivityCenterKibo18";
import SmallClassroomKibo18 from "./pages/products/classroompackages/SmallClassroomKibo18";
import FullClassroomKibo18 from "./pages/products/classroompackages/FullClassroomKibo18";
import AdvancedCodingExtensionSet from "./pages/products/funextensionsets/AdvancedCodingExtensionSet";
import BuildingBrickExtensionSetBasic from "./pages/products/funextensionsets/BuildingBrickExtensionSetBasic";
import BuildingBrickExtensionSetDeluxe from "./pages/products/funextensionsets/BuildingBrickExtensionSetDeluxe";
import BundleOfFunExtensionPackage from "./pages/products/funextensionsets/BundleOfFunExtensionPackage";
import ExpressionModule from "./pages/products/funextensionsets/ExpressionModule";
import FreeThrowExtensionSet from "./pages/products/funextensionsets/FreeThrowExtensionSet";
import Kibo18ToKibo21UpgradePackage from "./pages/products/funextensionsets/Kibo18ToKibo21UpgradePackage";
import KiboCostumes from "./pages/products/funextensionsets/KiboCostumes";
import MarkerExtensionSet from "./pages/products/funextensionsets/MarkerExtensionSet";
import MarkerExtensionSetExtras from "./pages/products/funextensionsets/MarkerExtensionSetExtras";
import SoundRecordPlaybackModule from "./pages/products/funextensionsets/SoundRecordPlaybackModule";
import BeepBlock from "./pages/products/partsandreplacements/BEEPBlock";
import BeginAndEndBlocks from "./pages/products/partsandreplacements/BeginAndEndBlocks";
import BlockStickerUpgrade from "./pages/products/partsandreplacements/BlockStickerUpgrade";
import BlockStickerUpgradeForKIBO18 from "./pages/products/partsandreplacements/BlockStickerUpgradeForKIBO18";
import BlockStickerUpgradeForKIBO21 from "./pages/products/partsandreplacements/BlockStickerUpgradeForKIBO21";
import ClapSoundSensorEar from "./pages/products/partsandreplacements/ClapSoundSensorEar";
import ConditionalBlocks from "./pages/products/partsandreplacements/ConditionalBlocks";
import DistanceSensorTelescope from "./pages/products/partsandreplacements/DistanceSensorTelescope";
import FirmwareUpdateCable from "./pages/products/partsandreplacements/FirmwareUpdateCable";
import FORWARDBlock from "./pages/products/partsandreplacements/FORWARDBlock";
import IFAndENDIFBlocks from "./pages/products/partsandreplacements/IFAndENDIFBlocks";
import LIGHTONBlocks from "./pages/products/partsandreplacements/LIGHTONBlocks";
import LightOutputSensorLightbulb from "./pages/products/partsandreplacements/LightOutputSensorLightbulb";
import LightSensorEye from "./pages/products/partsandreplacements/LightSensorEye";
import MotionBlocks from "./pages/products/partsandreplacements/MotionBlocks";
import MotorModule from "./pages/products/partsandreplacements/MotorModule";
import ParametersForIFTHENBlocks from "./pages/products/partsandreplacements/ParametersForIFTHENBlocks";
import ParametersForREPEATBlocks from "./pages/products/partsandreplacements/ParametersForREPEATBlocks";
import ParametersForRepeatNumbersOnly from "./pages/products/partsandreplacements/ParametersForRepeatNumbersOnly";
import SINGBlock from "./pages/products/partsandreplacements/SINGBlock";
import SPINBlock from "./pages/products/partsandreplacements/SPINBlock";
import StageArtPlatform from "./pages/products/partsandreplacements/StageArtPlatform";
import StagePedestal from "./pages/products/partsandreplacements/StagePedestal";
import StageSupport from "./pages/products/partsandreplacements/StageSupport";
import TurntableArtPlatform from "./pages/products/partsandreplacements/TurntableArtPlatform";
import WAITFORCLAPBlock from "./pages/products/partsandreplacements/WAITFORCLAPBlock";
import Wheel from "./pages/products/partsandreplacements/Wheel";
import GrowingWithKIBO from "./pages/products/teachingmaterials/GrowingWithKIBO";
import ExploringWithKIBO from "./pages/products/teachingmaterials/ExploringWithKIBO";
import KiboCodingCards from "./pages/products/teachingmaterials/KiboCodingCards";
import ActivityCenterGuidebook from "./pages/products/teachingmaterials/ActivityCenterGuidebook";
import CreatingWithKiboGuide from "./pages/products/teachingmaterials/CreatingWithKiboGuide";
import KiboActivityCards from "./pages/products/teachingmaterials/KiboActivityCards";
import KiboSaysGame from "./pages/products/teachingmaterials/KiboSaysGame";
import AskAndImagineGuide from "./pages/products/teachingmaterials/AskAndImagineGuide";
import AssessmentWorkbook from "./pages/products/teachingmaterials/AssessmentWorkbook";
import BlendedLearningBundle from "./pages/products/teachingmaterials/BlendedLearningBundle";
import BuildItBetterGuide from "./pages/products/teachingmaterials/BuildItBetterGuide";
import EngineeringDesignJournals from "./pages/products/teachingmaterials/EngineeringDesignJournals";
import ExpressYourselfGuide from "./pages/products/teachingmaterials/ExpressYourselfGuide";
import MakeLearningVisibleGuide from "./pages/products/teachingmaterials/MakeLearningVisibleGuide";
import ModuleCurriculumGuidesBundle from "./pages/products/teachingmaterials/ModuleCurriculumGuidesBundle";
import ShowtimeWithKiboGuide from "./pages/products/teachingmaterials/ShowtimeWithKiboGuide";
import TeachingMaterialsPackage from "./pages/products/teachingmaterials/TeachingMaterialsPackage";
import TwoPosters from "./pages/products/teachingmaterials/TwoPosters";
import TrainingOneHourWebConference from "./pages/products/training/TrainingOneHourWebConference";
import ActivityCards1stEditionClearance from "./pages/products/clearance/ActivityCards1stEditionClearance";
import AssessmentWorkbook1stEditionClearance from "./pages/products/clearance/AssessmentWorkbook1stEditionClearance";
import BuildItBetterClearance from "./pages/products/clearance/BuildItBetterClearance";
import ExpressYourselfClearance from "./pages/products/clearance/ExpressYourselfClearance";
import MakeLearningVisibleClearance from "./pages/products/clearance/MakeLearningVisibleClearance";
import ShowtimeWithKiboClearance from "./pages/products/clearance/ShowtimeWithKiboClearance";
import KiboRepairService from "./pages/products/service/KiboRepairService";
import Blog from "./pages/blog/Blog";
import BlogPostDetail from "./pages/blog/BlogPostDetail";
import MediaCoverage from "./pages/mediacoverage/MediaCoverage";
import MediaCoverageDetail from "./pages/mediacoverage/MediaCoverageDetail";
import PressReleases from "./pages/pressreleases/PressReleases";
import PressReleaseDetail from "./pages/pressreleases/PressReleaseDetail";

// ... (other imports)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserDataProvider>
        <CartProvider>
          <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <Sonner />
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
            {/* New route for Kibo in the Classroom */}
            <Route path="/kibo/in-the-classroom" element={<KiboInTheClassroom />} />
            {/* New route for STEAM Lessons */}
            <Route path="/kibo/use/steam-lessons-and-activities" element={<SteamLessons />} />
            {/* New route for Kibo at Home */}
            <Route path="/kibo/at-home" element={<KiboAtHome />} />
            {/* New route for Sign Up KIBO Home Course */}
            <Route path="/sign-up-for-the-kibo-home-robotics-course" element={<SignUpKiboHomeCourse />} />
            {/* New route for Using KIBO */}
            <Route path="/kibo/use" element={<KiboUse />} />
            {/* New route for STEM Curriculum */}
            <Route path="/education/stem-curriculum" element={<StemCurriculum />} />
            {/* New route for KIBO Research */}
            <Route path="/kibo/why/research" element={<KiboResearch />} />
            {/* New route for Professional Development */}
            <Route path="/education/professional-development" element={<ProfessionalDevelopment />} />
            {/* New route for Grants */}
            <Route path="/grants" element={<Grants />} />
            {/* New route for STEAM Grants */}
            <Route path="/kibo/steam-grants" element={<SteamGrants />} />
            {/* New route for Tutorials */}
            <Route path="/resources/tutorials" element={<Tutorials />} />
            {/* New route for Activities */}
            <Route path="/resources/activities" element={<Activities />} />
            {/* New route for Experiences */}
            <Route path="/resources/experiences" element={<Experiences />} />
            {/* New route for White Papers & Webinars */}
            <Route path="/resources/white-papers-webinars" element={<WhitePapersWebinars />} />
            {/* New route for Technical Support */}
            <Route path="/technical-support" element={<TechnicalSupport />} />
            {/* Admin Dashboard */}
            <Route path="/admin" element={<ProtectedRoute><SimpleAdminDashboard /></ProtectedRoute>} />
            {/* Footer Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/awards" element={<Awards />} />
            <Route path="/events" element={<Events />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/products/kibo-10-kit" element={<Kibo10Kit />} />
            <Route path="/products/kibo-15-kit" element={<Kibo15Kit />} />
            <Route path="/products/kibo-18-kit" element={<Kibo18Kit />} />
            <Route path="/products/kibo-21-kit" element={<Kibo21Kit />} />
            <Route path="/products/kibo-10-home-edition" element={<Kibo10HomeEdition />} />
            <Route path="/products/kibo-15-home-edition" element={<Kibo15HomeEdition />} />

            <Route path="/products/activity-center-kibo-21-steam-explorer" element={<ActivityCenterKibo21SteamExplorer />} />
            <Route path="/products/small-classroom-kibo-21-steam-explorer" element={<SmallClassroomKibo21SteamExplorer />} />
            <Route path="/products/full-classroom-kibo-21-steam-explorer" element={<FullClassroomKibo21SteamExplorer />} />
            <Route path="/products/activity-center-kibo-21" element={<ActivityCenterKibo21 />} />
            <Route path="/products/small-classroom-kibo-21" element={<SmallClassroomKibo21 />} />
            <Route path="/products/full-classroom-kibo-21" element={<FullClassroomKibo21 />} />
            <Route path="/products/activity-center-kibo-18" element={<ActivityCenterKibo18 />} />
            <Route path="/products/small-classroom-kibo-18" element={<SmallClassroomKibo18 />} />
            <Route path="/products/full-classroom-kibo-18" element={<FullClassroomKibo18 />} />

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
            <Route path="/products/training-one-hour-web-conference" element={<TrainingOneHourWebConference />} />
            <Route path="/products/kibo-repair-service" element={<KiboRepairService />} />
            
            {/* Blog, Media Coverage and Press Releases Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPostDetail />} />
            <Route path="/media-coverage" element={<MediaCoverage />} />
            <Route path="/media-coverage/:id" element={<MediaCoverageDetail />} />
            <Route path="/press-releases" element={<PressReleases />} />
            <Route path="/press-releases/:id" element={<PressReleaseDetail />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </TooltipProvider>
        </CartProvider>
      </UserDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

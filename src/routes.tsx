import { Route, Routes } from 'react-router-dom';
import { lazy } from 'react';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const HelpMeChoose = lazy(() => import('./pages/HelpMeChoose'));
const ComparePackages = lazy(() => import('./pages/ComparePackages'));
const CompareKits = lazy(() => import('./pages/CompareKits'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AccountPage = lazy(() => import('./pages/account/AccountPage'));
const WhyKibo = lazy(() => import('./pages/WhyKibo'));
const WhichKibo = lazy(() => import('./pages/WhichKibo'));
const Kibo = lazy(() => import('./pages/Kibo'));
const KiboInAction = lazy(() => import('./pages/KiboInAction'));
const KiboInTheClassroom = lazy(() => import('./pages/KiboInTheClassroom'));
const SteamLessons = lazy(() => import('./pages/SteamLessons'));
const KiboAtHome = lazy(() => import('./pages/KiboAtHome'));
const SignUpKiboHomeCourse = lazy(() => import('./pages/SignUpKiboHomeCourse'));
const KiboUse = lazy(() => import('./pages/KiboUse'));
const StemCurriculum = lazy(() => import('./pages/StemCurriculum'));
const KiboResearch = lazy(() => import('./pages/KiboResearch'));
const ProfessionalDevelopment = lazy(() => import('./pages/ProfessionalDevelopment'));
const Grants = lazy(() => import('./pages/Grants'));
const SteamGrants = lazy(() => import('./pages/SteamGrants'));
const Tutorials = lazy(() => import('./pages/Tutorials'));
const Activities = lazy(() => import('./pages/Activities'));
const Experiences = lazy(() => import('./pages/Experiences'));
const WhitePapersWebinars = lazy(() => import('./pages/WhitePapersWebinars'));
const TechnicalSupport = lazy(() => import('./pages/TechnicalSupport'));
const SimpleAdminDashboard = lazy(() => import('./pages/SimpleAdminDashboard'));
const About = lazy(() => import('./pages/About'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Awards = lazy(() => import('./pages/Awards'));
const Events = lazy(() => import('./pages/Events'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Blog = lazy(() => import('./pages/blog/Blog'));
const BlogPostDetail = lazy(() => import('./pages/blog/BlogPostDetail'));
const MediaCoverage = lazy(() => import('./pages/mediacoverage/MediaCoverage'));
const MediaCoverageDetail = lazy(() => import('./pages/mediacoverage/MediaCoverageDetail'));
const PressReleases = lazy(() => import('./pages/pressreleases/PressReleases'));
const PressReleaseDetail = lazy(() => import('./pages/pressreleases/PressReleaseDetail'));

const ADMIN_ROLES = ['super_admin', 'admin', 'content_manager', 'support'] as const;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/shop/:category" element={<Shop />} />
    <Route path="/shop/product/:id" element={<ProductDetail />} />
    <Route path="/products/:slug" element={<ProductDetail />} />
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
    <Route path="/admin" element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES]}><SimpleAdminDashboard /></ProtectedRoute>} />
    <Route path="/about" element={<About />} />
    <Route path="/testimonials" element={<Testimonials />} />
    <Route path="/awards" element={<Awards />} />
    <Route path="/events" element={<Events />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/blog" element={<Blog />} />
    <Route path="/blog/:id" element={<BlogPostDetail />} />
    <Route path="/media-coverage" element={<MediaCoverage />} />
    <Route path="/media-coverage/:id" element={<MediaCoverageDetail />} />
    <Route path="/press-releases" element={<PressReleases />} />
    <Route path="/press-releases/:id" element={<PressReleaseDetail />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;

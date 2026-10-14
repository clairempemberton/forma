import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Outlet, Navigate, useLocation, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader.jsx";
import ProjectHeader from "./components/ProjectHeader.jsx";
import { activateLoaded, isFullProject, loadProject, useActiveProjectId } from "./data/featured.js";

const page = (load) => lazy(load);
const Home = page(() => import("./pages/Home.jsx"));
const Overview = page(() => import("./pages/Overview.jsx"));
const ProjectPreview = page(() => import("./pages/ProjectPreview.jsx"));
const Explore = page(() => import("./pages/Explore.jsx"));
const Compare = page(() => import("./pages/Compare.jsx"));
const Alternatives = page(() => import("./pages/Alternatives.jsx"));
const Inspector = page(() => import("./pages/Inspector.jsx"));
const Evidence = page(() => import("./pages/Evidence.jsx"));
const Perspectives = page(() => import("./pages/Perspectives.jsx"));
const FeedbackPlace = page(() => import("./pages/FeedbackPlace.jsx"));
const FeedbackCompose = page(() => import("./pages/FeedbackCompose.jsx"));
const FeedbackReview = page(() => import("./pages/FeedbackReview.jsx"));
const FeedbackReceipt = page(() => import("./pages/FeedbackReceipt.jsx"));
const MyContributions = page(() => import("./pages/MyContributions.jsx"));
const Themes = page(() => import("./pages/Themes.jsx"));
const Revision = page(() => import("./pages/Revision.jsx"));
const Decision = page(() => import("./pages/Decision.jsx"));
const Updates = page(() => import("./pages/Updates.jsx"));
const TextVersion = page(() => import("./pages/TextVersion.jsx"));
const StaffDashboard = page(() => import("./pages/StaffDashboard.jsx"));
const StaffTriage = page(() => import("./pages/StaffTriage.jsx"));
const StaffThemes = page(() => import("./pages/StaffThemes.jsx"));
const StaffRevisions = page(() => import("./pages/StaffRevisions.jsx"));
const StaffPublish = page(() => import("./pages/StaffPublish.jsx"));
const States = page(() => import("./pages/States.jsx"));
const NotFound = page(() => import("./pages/NotFound.jsx"));

function PageFallback() {
  return <div className="route-loading" role="status" aria-live="polite"><span className="mv__spinner" /><span className="sr-only">Loading</span></div>;
}

function ScrollAndTitle() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <AppHeader />
      <Suspense fallback={<PageFallback />}><Outlet /></Suspense>
    </>
  );
}

// Old directory links (/projects?q=…) keep their filters on the home map.
function ToHome() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

// Screens outside a project's routes (/me, /staff) remount when the active project changes.
function ActiveProjectOutlet() {
  const id = useActiveProjectId();
  return <Suspense fallback={<PageFallback />}><Outlet key={id} /></Suspense>;
}

function ProjectLayout() {
  const { id } = useParams();
  const { pathname, search } = useLocation();
  // Fully built projects load their data module first; every other project is a preview card.
  const [ready, setReady] = useState(() => activateLoaded(id));
  useEffect(() => {
    if (!isFullProject(id) || activateLoaded(id)) { setReady(true); return; }
    let live = true;
    setReady(false);
    loadProject(id).then(() => live && setReady(true));
    return () => { live = false; };
  }, [id]);
  // The featured project used to live at /projects/alder-8th; keep old links working.
  if (id === "alder-8th") return <Navigate to={pathname.replace("/projects/alder-8th", "/projects/hawthorne") + search} replace />;
  if (!isFullProject(id)) return <Suspense fallback={<PageFallback />}><ProjectPreview /></Suspense>;
  if (!ready || !activateLoaded(id)) return <PageFallback />;
  return (
    <div className="project-layout" key={id}>
      <ProjectHeader />
      <div className="project-layout__main"><Suspense fallback={<PageFallback />}><Outlet /></Suspense></div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollAndTitle />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="how-it-works" element={<Navigate to="/" replace />} />
          <Route path="projects" element={<ToHome />} />
          <Route element={<ActiveProjectOutlet />}><Route path="me" element={<MyContributions />} /></Route>
          <Route path="states" element={<States />} />
          <Route path="projects/:id" element={<ProjectLayout />}>
            <Route index element={<Overview />} />
            <Route path="explore" element={<Explore />} />
            <Route path="compare" element={<Compare />} />
            <Route path="alternatives" element={<Alternatives />} />
            <Route path="inspect/:fid" element={<Inspector />} />
            <Route path="evidence" element={<Evidence />} />
            <Route path="perspectives" element={<Perspectives />} />
            <Route path="feedback" element={<FeedbackPlace />} />
            <Route path="feedback/compose" element={<FeedbackCompose />} />
            <Route path="feedback/review" element={<FeedbackReview />} />
            <Route path="feedback/receipt/:ref" element={<FeedbackReceipt />} />
            <Route path="themes" element={<Themes />} />
            <Route path="revision" element={<Revision />} />
            <Route path="decision" element={<Decision />} />
            <Route path="updates" element={<Updates />} />
            <Route path="text" element={<TextVersion />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="staff" element={<ActiveProjectOutlet />}>
          <Route index element={<StaffDashboard />} />
          <Route path="triage" element={<StaffTriage />} />
          <Route path="themes" element={<StaffThemes />} />
          <Route path="revisions" element={<StaffRevisions />} />
          <Route path="publish" element={<StaffPublish />} />
        </Route>
      </Routes>
    </>
  );
}

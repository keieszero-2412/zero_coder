import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef, Fragment } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useProblems } from '../context/ProblemsContext';
import {
  Code2,
  Database,
  ChevronRight,
  Terminal,
  CheckCircle,
  Circle,
  Flag,
  Search,
  FileText,
  ListChecks,
  GraduationCap,
  Copy,
  Check,
  Maximize2,
  X,
  Play,
  ArrowRight,
  FolderGit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SOLE_ADMIN_UID } from '../utils/accessPolicy';
import { SettingsModal } from '../components/SettingsModal';
import { CheatsheetModal } from '../components/CheatsheetModal';
import { highlightMatch } from '../components/GlobalHeader';
import { CHEATSHEETS, MIDTERM_CHEATSHEETS, getAllCheatsheetItems } from '../data/cheatsheets';
import '../index.css';
import {
  useTerm,
  COURSES,
  normalizeCourse,
  normalizeTerm,
  resolveValidTool,
  getDestinationMeta,
  getDestinationUrl,
  buildSearchIndex,
  queryGroupedSearchResults,
  recordRecentActivity
} from '../context/TermContext';
import { getLecturesManifest, getCachedLecturesManifest } from '../utils/lecturesCache';

const TOOL_ICONS = {
  cheatsheet: FileText,
  tests: ListChecks,
  interactive: GraduationCap
};

export function Dashboard() {
  const {
    activeCourse,
    setActiveCourse,
    activeTerm,
    setActiveTerm,
    activeTool,
    setActiveTool,
    triggerLogoTransition
  } = useTerm();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser } = useAuth();
  const { problems, isLoading } = useProblems();

  const rawCourseParam = searchParams.get('course');
  const rawTermParam = searchParams.get('term');
  const rawToolParam = searchParams.get('tool');
  const rawFilterParam = searchParams.get('filter');

  // Home mode is active when at "/" with no ?course= and no ?tool=
  const isWorkspaceOpen = Boolean(rawCourseParam || rawToolParam);
  const currentCourse = normalizeCourse(rawCourseParam || activeCourse) || 'programming';
  const currentTerm = normalizeTerm(rawTermParam || activeTerm) || 'mid';
  const currentTool = resolveValidTool(currentTerm, rawToolParam || activeTool || 'tests');

  // Synchronize URL query params and TermContext state when inside a course workspace
  useEffect(() => {
    if (!isWorkspaceOpen) return;

    const urlCourse = normalizeCourse(rawCourseParam);
    const urlTerm = normalizeTerm(rawTermParam);
    const urlTool = rawToolParam ? resolveValidTool(urlTerm || currentTerm, rawToolParam) : null;

    if (urlCourse && urlCourse !== activeCourse) {
      setActiveCourse(urlCourse);
    }
    if (urlTerm && urlTerm !== activeTerm) {
      setActiveTerm(urlTerm);
    }
    if (urlTool && urlTool !== activeTool) {
      setActiveTool(urlTool, urlTerm || currentTerm);
    }

    if (!urlCourse || !urlTerm || !urlTool || rawToolParam !== urlTool) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('course', currentCourse);
      nextParams.set('term', currentTerm);
      nextParams.set('tool', currentTool);
      setSearchParams(nextParams, { replace: true });
    }
  }, [isWorkspaceOpen, rawCourseParam, rawTermParam, rawToolParam]);

  // Record active destination when workspace is open
  useEffect(() => {
    if (!isWorkspaceOpen) return;
    const meta = getDestinationMeta(currentCourse, currentTerm, currentTool);
    if (meta) {
      recordRecentActivity({
        id: `dest-${currentCourse}-${currentTerm}-${currentTool}`,
        type: currentTool,
        title: meta.title,
        subtitle: meta.subtitle,
        course: currentCourse,
        term: currentTerm,
        tool: currentTool,
        path: getDestinationUrl(currentCourse, currentTerm, currentTool)
      });
    }
  }, [isWorkspaceOpen, currentCourse, currentTerm, currentTool]);

  const [completedProblems, setCompletedProblems] = useState({});
  const [flaggedProblems, setFlaggedProblems] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  // Home Central Search state
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [isHomeSearchOpen, setIsHomeSearchOpen] = useState(false);
  const [homeSelectedIdx, setHomeSelectedIdx] = useState(0);
  const homeSearchInputRef = useRef(null);
  const homeSearchWrapRef = useRef(null);

  // Focus Home Search when header search button or Ctrl+K is triggered on Home
  useEffect(() => {
    const handleFocusHomeSearch = () => {
      if (homeSearchInputRef.current) {
        homeSearchInputRef.current.focus();
        setIsHomeSearchOpen(true);
      }
    };
    window.addEventListener('zc-focus-home-search', handleFocusHomeSearch);
    return () => window.removeEventListener('zc-focus-home-search', handleFocusHomeSearch);
  }, []);

  // Close Home Search dropdown when clicking outside
  useEffect(() => {
    if (!isHomeSearchOpen) return;
    const handleClickOutside = (e) => {
      if (homeSearchWrapRef.current && !homeSearchWrapRef.current.contains(e.target)) {
        setIsHomeSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isHomeSearchOpen]);

  // Handle returnToId from Workspace back button
  useEffect(() => {
    if (location.state?.returnToId) {
      const targetProblem = problems.find(
        (p) => p.id === location.state.returnToId || p.id === Number(location.state.returnToId)
      );
      const targetTerm = targetProblem
        ? (targetProblem.category || '').toLowerCase().includes('last-term') ||
          (targetProblem.category || '').toLowerCase().includes('final')
          ? 'final'
          : 'mid'
        : currentTerm;

      setActiveCourse('programming');
      setActiveTerm(targetTerm);
      setActiveTool('tests', targetTerm);
      setSearchParams(
        { course: 'programming', term: targetTerm, tool: 'tests' },
        { replace: true }
      );

      setTimeout(() => {
        const el = document.getElementById(`problem-${location.state.returnToId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'background-color 0.5s ease';
          el.style.backgroundColor = 'color-mix(in srgb, var(--accent-primary) 20%, transparent)';
          setTimeout(() => {
            el.style.backgroundColor = '';
          }, 1500);
        }
      }, 120);
    }

    try {
      const flagged = JSON.parse(localStorage.getItem('flagged_problems') || '{}');
      setFlaggedProblems(flagged);
    } catch (e) {
      console.error(e);
    }
  }, [location.state, problems]);

  // Listen to user progress in Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    if (currentUser) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('../config/firebase').then(({ db }) => {
          unsubscribe = onSnapshot(
            doc(db, 'user_progress', currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setCompletedProblems(docSnap.data());
              } else {
                setCompletedProblems({});
              }
            },
            (err) => {
              console.error('Failed to listen to progress:', err);
            }
          );
        });
      });
    } else {
      setCompletedProblems({});
    }
    return () => unsubscribe();
  }, [currentUser]);

  // Load Lectures Manifest
  const [lecturesManifest, setLecturesManifest] = useState(
    () => getCachedLecturesManifest()?.lectures || null
  );

  useEffect(() => {
    getLecturesManifest()
      .then((data) => setLecturesManifest(data.lectures))
      .catch((err) => console.error('Failed to load lectures:', err));
  }, []);

  // Cheatsheet Modal state
  const [cheatsheetState, setCheatsheetState] = useState({
    isOpen: false,
    mode: 'master',
    lectureId: currentTerm === 'mid' ? 'Topic1' : 'Lecture5',
    term: currentTerm
  });

  const has2809Access = (currentUser?.role === 'Admin' && currentUser?.uid === SOLE_ADMIN_UID) || currentUser?.colorCode === 'Blue';

  // Build shared Path-Grouped Search Index
  const allSearchItems = useMemo(() => {
    return buildSearchIndex({
      midtermCheatsheets: MIDTERM_CHEATSHEETS,
      finalCheatsheets: CHEATSHEETS,
      lecturesManifest: lecturesManifest || [],
      problems,
      has2809Access
    });
  }, [lecturesManifest, problems, has2809Access]);

  const { groups: homeSearchGroups, flatItems: homeSearchFlatItems } = useMemo(() => {
    return queryGroupedSearchResults(allSearchItems, homeSearchQuery, 16);
  }, [allSearchItems, homeSearchQuery]);

  useEffect(() => {
    setHomeSelectedIdx(0);
  }, [homeSearchQuery]);

  const handleSelectSearchResult = (item) => {
    if (!item) return;
    if (item.course) setActiveCourse(item.course);
    if (item.term) setActiveTerm(item.term);
    if (item.tool) setActiveTool(item.tool, item.term || currentTerm);

    triggerLogoTransition(`${item.courseLabel || 'Course'} Workspace`);
    setIsHomeSearchOpen(false);
    navigate(item.path);
  };

  const handleHomeSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsHomeSearchOpen(false);
      return;
    }
    if (!isHomeSearchOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsHomeSearchOpen(true);
    }
    if (homeSearchFlatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHomeSelectedIdx((prev) => (prev + 1) % homeSearchFlatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHomeSelectedIdx(
        (prev) => (prev - 1 + homeSearchFlatItems.length) % homeSearchFlatItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectSearchResult(homeSearchFlatItems[homeSelectedIdx]);
    }
  };

  const handleEnterCourseFromHome = (courseId) => {
    const validCourse = normalizeCourse(courseId) || 'programming';
    const validTerm = normalizeTerm(activeTerm) || 'mid';
    const validTool = resolveValidTool(validTerm, activeTool || 'tests');

    setActiveCourse(validCourse);
    setActiveTerm(validTerm);
    setActiveTool(validTool, validTerm);

    const courseLabel = validCourse === 'database' ? 'Database' : 'Programming';
    triggerLogoTransition(`${courseLabel} Workspace`);
    navigate(getDestinationUrl(validCourse, validTerm, validTool));
  };

  // Inline Cheatsheet workspace state
  const [csLectureFilter, setCsLectureFilter] = useState(rawFilterParam || 'all');
  const [csSearchQuery, setCsSearchQuery] = useState('');
  const [copiedCodeKey, setCopiedCodeKey] = useState(null);

  useEffect(() => {
    if (rawFilterParam) {
      setCsLectureFilter(rawFilterParam);
    } else {
      setCsLectureFilter('all');
    }
  }, [currentTerm, rawFilterParam]);

  // Tests workspace filter state
  const [testStatusFilter, setTestStatusFilter] = useState('all');
  const [testSearchQuery, setTestSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = {};
    for (const p of problems) {
      const catLower = (p.category || '').toLowerCase();
      if (catLower.includes('2809') && !has2809Access) {
        continue;
      }

      const isFinalProblem = catLower.includes('last-term') || catLower.includes('final');
      if (currentTerm === 'mid' && isFinalProblem) continue;
      if (currentTerm === 'final' && !isFinalProblem) continue;

      let catName = p.category || '';
      let subCategory = p.subcategory || p.subCategory || null;
      if (
        catName === 'Mid-term practice' ||
        catName === 'Last-term practice' ||
        catName === 'Final-term practice' ||
        catName === 'FTDS coding practice'
      ) {
        catName = 'Coding practice';
      } else if (catName.startsWith('Last-term ') || catName.startsWith('Final-term ')) {
        const remaining = catName.replace(/^(Last-term|Final-term)\s+/, '');
        if (remaining.toLowerCase().includes('mock')) {
          catName = 'Mock test';
        } else if (remaining.toLowerCase().includes('quiz')) {
          catName = 'Quiz';
          subCategory = p.subcategory || p.subCategory || remaining;
        } else if (remaining.toLowerCase().includes('test')) {
          catName = remaining;
        } else {
          catName = 'Coding practice';
          subCategory = remaining;
        }
      } else if (
        catName.toLowerCase() === 'quiz' ||
        catName.toLowerCase() === 'last-term quiz' ||
        catName.toLowerCase() === 'final-term quiz'
      ) {
        catName = 'Quiz';
        subCategory = p.subcategory || p.subCategory;
      }

      let enrichedP = { ...p, subCategory };
      if (catName === 'Summer Course Test') {
        if (p.defaultCode?.includes('max_profit')) {
          enrichedP.title = 'Bài 1';
          enrichedP._sortOrder = 1;
        } else if (p.defaultCode?.includes('kelly_fractions')) {
          enrichedP.title = 'Bài 2';
          enrichedP._sortOrder = 2;
        } else if (p.defaultCode?.includes('sharpe_ratio')) {
          enrichedP.title = 'Bài 3';
          enrichedP._sortOrder = 3;
        } else if (p.defaultCode?.includes('optimal_weights')) {
          enrichedP.title = 'Bài 4';
          enrichedP._sortOrder = 4;
        }
      }

      if (!cats[catName]) {
        cats[catName] = [];
      }
      cats[catName].push(enrichedP);
    }

    const sortedCats = {};
    const keys = Object.keys(cats).sort((a, b) => a.localeCompare(b));
    const orderedKeys = [];
    const tests2809 = keys.filter((k) => k.toLowerCase().includes('2809'));
    const tests = keys.filter(
      (k) =>
        !k.toLowerCase().includes('2809') &&
        k.toLowerCase().includes('test') &&
        !k.toLowerCase().includes('mock') &&
        !k.toLowerCase().includes('summer')
    );
    const mocks = keys.filter((k) => k.toLowerCase().includes('mock'));
    const summers = keys.filter((k) => k.toLowerCase().includes('summer'));
    const quizzes = keys.filter((k) => k.toLowerCase().includes('quiz'));
    const practices = keys.filter((k) => k.toLowerCase().includes('coding practice'));
    const others = keys.filter(
      (k) =>
        !tests2809.includes(k) &&
        !tests.includes(k) &&
        !mocks.includes(k) &&
        !summers.includes(k) &&
        !quizzes.includes(k) &&
        !practices.includes(k)
    );

    orderedKeys.push(
      ...tests2809,
      ...tests,
      ...mocks,
      ...summers,
      ...quizzes,
      ...others,
      ...practices
    );

    const subCatOrder = { EASY: 1, MEDIUM: 2, HARD: 3, OMG: 4 };

    for (const k of orderedKeys) {
      sortedCats[k] = cats[k].sort((a, b) => {
        if (a.subCategory && b.subCategory && a.subCategory !== b.subCategory) {
          const orderA = subCatOrder[a.subCategory.toUpperCase()] || 99;
          const orderB = subCatOrder[b.subCategory.toUpperCase()] || 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.subCategory.localeCompare(b.subCategory, undefined, { numeric: true });
        }
        if (a._sortOrder && b._sortOrder) {
          return a._sortOrder - b._sortOrder;
        }
        if (a.type === 'multiple_choice' && b.type !== 'multiple_choice') return -1;
        if (a.type !== 'multiple_choice' && b.type === 'multiple_choice') return 1;
        return (a.title || '').localeCompare(b.title || '', undefined, { numeric: true });
      });
    }

    return sortedCats;
  }, [currentTerm, problems, has2809Access]);

  const filteredTestCategories = useMemo(() => {
    const q = testSearchQuery.trim().toLowerCase();
    const out = {};
    Object.entries(categories).forEach(([cat, items]) => {
      const filtered = items.filter((p) => {
        const isSolved = Boolean(completedProblems[p.id]);
        const isFlagged = Boolean(flaggedProblems[p.id]);
        if (testStatusFilter === 'solved' && !isSolved) return false;
        if (testStatusFilter === 'unsolved' && isSolved) return false;
        if (testStatusFilter === 'flagged' && !isFlagged) return false;
        if (q) {
          const text = `${p.title || ''} ${cat} ${p.subCategory || ''}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      });
      if (filtered.length > 0 || (!q && testStatusFilter === 'all')) {
        out[cat] = filtered;
      }
    });
    return out;
  }, [categories, completedProblems, flaggedProblems, testStatusFilter, testSearchQuery]);

  const filteredCategoryKeys = useMemo(
    () => Object.keys(filteredTestCategories),
    [filteredTestCategories]
  );

  // Shared sticky offsets + scroll-spy for all Tests pages (Mid-term & Final-term)
  const testsSectionRef = useRef(null);
  const catNavRef = useRef(null);
  const categoryClickLockRef = useRef({ cat: null, until: 0 });
  const [activeTestCategory, setActiveTestCategory] = useState('');

  const getCategoryDomId = useCallback((cat) => {
    return `category-${String(cat || '').replace(/\s+/g, '-')}`;
  }, []);

  const syncTestsStickyState = useCallback(() => {
    const sectionEl = testsSectionRef.current;
    if (!sectionEl) return;

    const headerEl = document.querySelector('.zc-command-header, .global-header');
    const scrollEl = sectionEl.closest('.zc-layout-scroll');
    const catNavEl = catNavRef.current;

    const headerRect = headerEl ? headerEl.getBoundingClientRect() : { bottom: 0, height: 0 };
    const scrollRect = scrollEl
      ? scrollEl.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };

    // When scrollEl starts directly below GlobalHeader (Layout.jsx), headerRect.bottom - scrollRect.top === 0.
    // If scrolling happens at the document/viewport level, catStickyTop === headerRect.bottom.
    const catStickyTop = Math.max(0, Math.round(headerRect.bottom - scrollRect.top));
    const catBarHeight = catNavEl ? Math.ceil(catNavEl.getBoundingClientRect().height) : 52;
    const sectionStickyTop = catStickyTop + catBarHeight;

    sectionEl.style.setProperty('--zc-cat-sticky-top', `${catStickyTop}px`);
    sectionEl.style.setProperty('--zc-cat-bar-height', `${catBarHeight}px`);
    sectionEl.style.setProperty('--zc-section-sticky-top', `${sectionStickyTop}px`);
    sectionEl.style.setProperty('--zc-section-scroll-margin', `${sectionStickyTop}px`);

    const stickyTopViewport = scrollRect.top + catStickyTop;
    if (catNavEl) {
      const navRect = catNavEl.getBoundingClientRect();
      const isNavStuck = navRect.top <= stickyTopViewport + 1.5 && (scrollEl ? scrollEl.scrollTop > 8 : window.scrollY > 8);
      catNavEl.toggleAttribute('data-stuck', isNavStuck);
    }

    const sectionNodes = Array.from(sectionEl.querySelectorAll('.category-section[data-category]'));
    if (sectionNodes.length === 0) {
      setActiveTestCategory('');
      return;
    }

    const activationLine = scrollRect.top + sectionStickyTop + 16;
    let currentCat = sectionNodes[0].getAttribute('data-category') || '';

    for (const node of sectionNodes) {
      const rect = node.getBoundingClientRect();
      const cat = node.getAttribute('data-category') || '';
      const headerNode = node.querySelector('.category-header-sticky');
      if (rect.top <= activationLine) {
        currentCat = cat;
      }
      if (headerNode) {
        const hRect = headerNode.getBoundingClientRect();
        const isHeaderPinned =
          rect.top <= scrollRect.top + sectionStickyTop + 2 &&
          rect.bottom > hRect.bottom + 2;
        headerNode.toggleAttribute('data-stuck', isHeaderPinned);
      }
    }

    const now = Date.now();
    if (
      categoryClickLockRef.current.cat &&
      now < categoryClickLockRef.current.until &&
      filteredCategoryKeys.includes(categoryClickLockRef.current.cat)
    ) {
      currentCat = categoryClickLockRef.current.cat;
    } else if (
      scrollEl &&
      scrollEl.scrollHeight - (scrollEl.scrollTop + scrollEl.clientHeight) <= 3 &&
      scrollEl.scrollTop > 20
    ) {
      currentCat = sectionNodes[sectionNodes.length - 1].getAttribute('data-category') || currentCat;
    }

    setActiveTestCategory((prev) => (prev === currentCat ? prev : currentCat));
  }, [filteredCategoryKeys]);

  useLayoutEffect(() => {
    if (!isWorkspaceOpen || currentCourse !== 'programming' || currentTool !== 'tests') return;
    syncTestsStickyState();
  }, [
    isWorkspaceOpen,
    currentCourse,
    currentTerm,
    currentTool,
    filteredCategoryKeys,
    syncTestsStickyState
  ]);

  useEffect(() => {
    if (!isWorkspaceOpen || currentCourse !== 'programming' || currentTool !== 'tests') {
      return undefined;
    }
    const sectionEl = testsSectionRef.current;
    if (!sectionEl) return undefined;

    const scrollEl = sectionEl.closest('.zc-layout-scroll');
    const headerEl = document.querySelector('.zc-command-header, .global-header');
    const catNavEl = catNavRef.current;

    let rafId = 0;
    const scheduleSync = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        syncTestsStickyState();
      });
    };

    syncTestsStickyState();

    const scrollTarget = scrollEl || window;
    scrollTarget.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleSync);
      if (catNavEl) ro.observe(catNavEl);
      if (headerEl) ro.observe(headerEl);
      if (scrollEl) ro.observe(scrollEl);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scrollTarget.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
      if (ro) ro.disconnect();
    };
  }, [isWorkspaceOpen, currentCourse, currentTerm, currentTool, syncTestsStickyState]);

  // Keep active category button scrolled into horizontal view inside .category-nav-container
  useEffect(() => {
    const navEl = catNavRef.current;
    if (!navEl || !activeTestCategory) return;
    if (navEl.scrollWidth <= navEl.clientWidth + 2) return;
    const buttons = Array.from(navEl.querySelectorAll('.category-nav-btn[data-category]'));
    const activeBtn = buttons.find((b) => b.getAttribute('data-category') === activeTestCategory);
    if (!activeBtn) return;
    const targetLeft =
      activeBtn.offsetLeft - navEl.clientWidth / 2 + activeBtn.offsetWidth / 2;
    navEl.scrollTo({ left: Math.max(0, Math.round(targetLeft)), behavior: 'smooth' });
  }, [activeTestCategory]);

  const handleSelectTestCategory = useCallback(
    (cat) => {
      const domId = getCategoryDomId(cat);
      const targetEl = document.getElementById(domId);
      if (!targetEl) return;

      setActiveTestCategory(cat);
      categoryClickLockRef.current = { cat, until: Date.now() + 700 };

      const sectionEl = testsSectionRef.current;
      const scrollEl = sectionEl?.closest('.zc-layout-scroll');
      const headerEl = document.querySelector('.zc-command-header, .global-header');
      const catNavEl = catNavRef.current;

      const headerRect = headerEl ? headerEl.getBoundingClientRect() : { bottom: 0 };
      const catBarHeight = catNavEl ? Math.ceil(catNavEl.getBoundingClientRect().height) : 52;

      if (scrollEl) {
        const scrollRect = scrollEl.getBoundingClientRect();
        const catStickyTop = Math.max(0, Math.round(headerRect.bottom - scrollRect.top));
        const desiredViewportTop = scrollRect.top + catStickyTop + catBarHeight;
        const targetRect = targetEl.getBoundingClientRect();
        const nextScrollTop = Math.max(
          0,
          Math.round(scrollEl.scrollTop + (targetRect.top - desiredViewportTop))
        );
        scrollEl.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [getCategoryDomId]
  );

  const handleCopySnippet = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 1500);
  };

  const solvedCount = useMemo(() => {
    return Object.keys(completedProblems).filter((k) => completedProblems[k]).length;
  }, [completedProblems]);

  const flaggedCount = useMemo(() => {
    return Object.keys(flaggedProblems).filter((k) => flaggedProblems[k]).length;
  }, [flaggedProblems]);

  // --- 1. Render Programming Cheatsheet Workspace ---
  const renderCheatsheetWorkspace = () => {
    const isMid = currentTerm === 'mid';
    const sourceObj = isMid ? MIDTERM_CHEATSHEETS : CHEATSHEETS;
    const allItems = getAllCheatsheetItems(isMid ? 'mid' : 'final');

    const filteredItems = allItems.filter((item) => {
      if (csLectureFilter !== 'all' && item.lectureId !== csLectureFilter) {
        return false;
      }
      if (csSearchQuery.trim()) {
        const q = csSearchQuery.trim().toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.syntax.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="zc-ws-section">
        <div className="zc-cs-toolbar glass-panel">
          <div className="zc-cs-toolbar-top">
            <div className="zc-cs-search-box">
              <Search size={16} className="zc-cs-search-icon" />
              <input
                type="text"
                value={csSearchQuery}
                onChange={(e) => setCsSearchQuery(e.target.value)}
                placeholder={`Filter ${
                  isMid ? 'Mid-term Python' : 'Final-term Data Science & SQL'
                } commands...`}
                className="zc-cs-search-input"
                aria-label="Filter cheatsheet commands"
              />
              {csSearchQuery && (
                <button
                  type="button"
                  className="zc-cs-clear-btn"
                  onClick={() => setCsSearchQuery('')}
                  aria-label="Clear cheatsheet filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="button-primary zc-cs-modal-btn"
              onClick={() =>
                setCheatsheetState({
                  isOpen: true,
                  mode: 'master',
                  lectureId:
                    csLectureFilter !== 'all'
                      ? csLectureFilter
                      : isMid
                      ? 'Topic1'
                      : 'Lecture5',
                  term: currentTerm
                })
              }
            >
              <Maximize2 size={14} />
              <span>Open Cheatsheet</span>
            </button>
          </div>

          <div className="zc-cs-lecture-pills" role="group" aria-label="Filter by topic or lecture">
            <button
              type="button"
              className={`zc-cs-pill ${csLectureFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCsLectureFilter('all')}
            >
              All ({allItems.length})
            </button>
            {Object.values(sourceObj).map((group) => {
              const active = csLectureFilter === group.lectureId;
              return (
                <button
                  key={group.lectureId}
                  type="button"
                  className={`zc-cs-pill ${active ? 'active' : ''}`}
                  onClick={() => setCsLectureFilter(group.lectureId)}
                >
                  {group.title.split(':')[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="zc-cs-cards-grid">
          {filteredItems.length === 0 ? (
            <div className="zc-empty-state glass-panel">
              <p>No cheatsheet commands match "{csSearchQuery}".</p>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setCsSearchQuery('');
                  setCsLectureFilter('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const key = `${item.lectureId}-${item.categoryId}-${idx}`;
              const copied = copiedCodeKey === key;
              return (
                <div key={key} className="zc-cs-item-card glass-panel">
                  <div className="zc-cs-item-header">
                    <div>
                      <span className="zc-cs-item-cat">{item.categoryName}</span>
                      <h3 className="zc-cs-item-title">{item.title}</h3>
                    </div>
                    <button
                      type="button"
                      className="zc-cs-copy-btn"
                      onClick={() => handleCopySnippet(item.code, key)}
                      title="Copy example code"
                      aria-label={`Copy code for ${item.title}`}
                    >
                      {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="zc-cs-syntax-box">
                    <code>{item.syntax}</code>
                  </div>
                  <p className="zc-cs-item-desc">{item.description}</p>
                  <pre className="zc-cs-code-pre">
                    <code>{item.code}</code>
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // --- 2. Render Programming Interactive Learning Workspace (Final-term) ---
  const renderInteractiveLearningWorkspace = () => {
    const allNotebooks = [];
    if (Array.isArray(lecturesManifest)) {
      lecturesManifest.forEach((lecture) => {
        lecture.notebooks.forEach((nb) => {
          allNotebooks.push({
            lectureId: lecture.id,
            lectureTitle: lecture.title,
            datasetCount: lecture.datasetFiles?.length || 0,
            ...nb
          });
        });
      });
    }

    return (
      <div className="zc-ws-section">
        <div className="master-cheatsheet-card" style={{ marginBottom: '1.75rem' }}>
          <div className="master-cheatsheet-content">
            <div className="master-cheatsheet-badges">
              <span className="badge-master-tag">INTERACTIVE LEARNING</span>
              <span className="badge-master-sub">FINAL-TERM</span>
              <span className="badge-master-sub">{allNotebooks.length} JUPYTER LABS</span>
            </div>
            <h2 className="master-cheatsheet-title">
              Interactive Python & Data Science Notebook Labs
            </h2>
            <p className="master-cheatsheet-desc">
              Execute Python cells directly in your browser with Pyodide, inspect real CSV/Excel/SQL
              datasets, and get step-by-step AI guidance.
            </p>
          </div>
          <div className="master-cheatsheet-action">
            <Link
              to="/learn/Lecture5/Lecture_5.1_Practice_Importing_Data"
              className="button-primary master-open-btn"
              style={{ textDecoration: 'none' }}
            >
              <Play size={16} />
              <span>Launch Lab 5.1</span>
            </Link>
            <button
              type="button"
              onClick={() =>
                setCheatsheetState({
                  isOpen: true,
                  mode: 'master',
                  lectureId: 'Lecture5',
                  term: 'final'
                })
              }
              className="lecture-cheatsheet-btn"
            >
              <span>Open Final-term Cheatsheet</span>
            </button>
          </div>
        </div>

        <div className="zc-interactive-labs-grid">
          {allNotebooks.map((nb) => (
            <div key={`${nb.lectureId}-${nb.id}`} className="zc-lab-card glass-panel">
              <div className="zc-lab-card-top">
                <div className="zc-lab-badges">
                  <span className="badge-practice-pill">PRACTICE LAB</span>
                  <span className="zc-lab-lec-badge">{nb.lectureId}</span>
                  {nb.datasetCount > 0 && (
                    <span className="zc-lab-lec-badge">{nb.datasetCount} files</span>
                  )}
                </div>
              </div>

              <h3 className="zc-lab-title">{nb.title}</h3>
              <p className="zc-lab-desc">{nb.description || nb.lectureTitle}</p>

              <div className="zc-lab-footer">
                <button
                  type="button"
                  className="lecture-cheatsheet-btn"
                  onClick={() =>
                    setCheatsheetState({
                      isOpen: true,
                      mode: 'single',
                      lectureId: nb.lectureId,
                      term: 'final'
                    })
                  }
                >
                  Cheatsheet {nb.lectureId.replace('Lecture', 'Lec ')}
                </button>
                <Link
                  to={`/learn/${nb.lectureId}/${nb.id}`}
                  className="button-primary zc-lab-open-btn"
                  onClick={() =>
                    recordRecentActivity({
                      id: `notebook:${nb.lectureId}:${nb.id}`,
                      type: 'interactive',
                      title: nb.title,
                      subtitle: nb.description || nb.lectureTitle,
                      course: 'programming',
                      term: 'final',
                      tool: 'interactive',
                      path: `/learn/${nb.lectureId}/${nb.id}`
                    })
                  }
                >
                  <span>Open Notebook</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- 3. Render Programming Tests Workspace ---
  const renderTestsWorkspace = () => {
    const effectiveActiveCat =
      activeTestCategory && filteredCategoryKeys.includes(activeTestCategory)
        ? activeTestCategory
        : filteredCategoryKeys[0] || '';

    return (
      <div className="zc-ws-section zc-tests-ws-section" ref={testsSectionRef}>
        <div className="zc-tests-filter-bar glass-panel">
          <div className="zc-tests-search-row">
            <div className="zc-cs-search-box">
              <Search size={15} className="zc-cs-search-icon" />
              <input
                type="text"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder={`Search ${
                  currentTerm === 'mid' ? 'Mid-term' : 'Final-term'
                } test problems...`}
                className="zc-cs-search-input"
                aria-label="Filter test problems"
              />
              {testSearchQuery && (
                <button
                  type="button"
                  className="zc-cs-clear-btn"
                  onClick={() => setTestSearchQuery('')}
                  aria-label="Clear test search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              className="zc-tests-status-pills"
              role="group"
              aria-label="Filter by completion status"
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'unsolved', label: 'Unsolved' },
                { id: 'solved', label: 'Solved' },
                { id: 'flagged', label: 'Flagged' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`zc-cs-pill ${testStatusFilter === st.id ? 'active' : ''}`}
                  onClick={() => setTestStatusFilter(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Test Category Navigation Bar (Sticks directly below GlobalHeader) */}
        {filteredCategoryKeys.length > 0 && (
          <nav
            ref={catNavRef}
            className="category-nav-container zc-tests-sticky-nav"
            aria-label={`${currentTerm === 'mid' ? 'Mid-term' : 'Final-term'} Test Categories`}
          >
            {filteredCategoryKeys.map((cat) => {
              const isActive = effectiveActiveCat === cat;
              const count = filteredTestCategories[cat]?.length || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  data-category={cat}
                  aria-current={isActive ? 'true' : undefined}
                  className={`category-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTestCategory(cat)}
                >
                  <span className="category-nav-label">{cat}</span>
                  <span className="category-nav-count">({count})</span>
                </button>
              );
            })}
          </nav>
        )}

        {Object.entries(filteredTestCategories).map(([category, items]) => (
          <div
            key={category}
            id={getCategoryDomId(category)}
            data-category={category}
            className="category-section"
          >
            <div className="category-header-sticky">
              <h2 className="category-sticky-heading">{category}</h2>
            </div>

            {items.length === 0 ? (
              <div className="zc-empty-state glass-panel">
                No matching problems in this category.
              </div>
            ) : (
              <div className="category-problems-list">
                {items.map((problem, index) => {
                  const isCompleted = completedProblems[problem.id];
                  const prevSubCat = index > 0 ? items[index - 1].subCategory : null;
                  const showSubCatHeader =
                    problem.subCategory && problem.subCategory !== prevSubCat;

                  return (
                    <Fragment key={problem.id}>
                      {showSubCatHeader && (
                        <h3
                          style={{
                            marginTop: index === 0 ? '0' : '1.15rem',
                            marginBottom: '0.2rem',
                            color: 'var(--accent-primary)',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          {problem.subCategory}
                        </h3>
                      )}
                      <div className="zc-problem-row-wrapper">
                        <Link
                          to={`/workspace/${problem.id}`}
                          id={`problem-${problem.id}`}
                          className="problem-list-item glass-panel"
                          onClick={() =>
                            recordRecentActivity({
                              id: `problem:${problem.id}`,
                              type: 'tests',
                              title: problem.title,
                              subtitle: `${category}${
                                problem.subCategory ? ` • ${problem.subCategory}` : ''
                              }`,
                              course: 'programming',
                              term: currentTerm,
                              tool: 'tests',
                              path: `/workspace/${problem.id}`
                            })
                          }
                        >
                          <div className="problem-list-icon">
                            {isCompleted ? (
                              <CheckCircle size={20} color="var(--accent-primary)" />
                            ) : (
                              <Circle size={20} color="var(--text-tertiary)" />
                            )}
                          </div>
                          <div className="problem-list-content">
                            <h3
                              className="problem-list-title"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              {problem.title}
                              {flaggedProblems[problem.id] && (
                                <Flag
                                  size={14}
                                  fill="#fbbf24"
                                  color="#fbbf24"
                                  title="Flagged for review"
                                />
                              )}
                            </h3>
                            <div
                              className="problem-list-desc"
                              dangerouslySetInnerHTML={{ __html: problem.description }}
                            />
                          </div>
                          <div className="problem-list-action">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              Solve
                            </span>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                          </div>
                        </Link>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // --- 4. Render Database Empty-State Scaffold Workspace ---
  const renderDatabaseEmptyWorkspace = (meta) => {
    const ToolIcon = TOOL_ICONS[currentTool] || Database;
    return (
      <div className="zc-ws-section">
        <div
          className="zc-db-empty-card glass-panel"
          data-testid={`database-empty-${currentTerm}-${currentTool}`}
        >
          <div className="zc-db-empty-icon-ring">
            <Database size={26} />
          </div>
          <div className="zc-db-empty-path">{meta.pathLabel}</div>
          <h2 className="zc-db-empty-title">Database workspace is ready for future content.</h2>
          <p className="zc-db-empty-status">{meta.emptyMessage}</p>
          <div className="zc-db-scaffold-pill">
            <FolderGit2 size={14} />
            <code>{meta.scaffoldDir}</code>
          </div>
          <div className="zc-db-empty-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => {
                setActiveCourse('programming');
                triggerLogoTransition('Programming Workspace');
                navigate(getDestinationUrl('programming', currentTerm, currentTool));
              }}
            >
              <Code2 size={15} />
              <span>Switch to Programming ({meta.termLabel})</span>
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                triggerLogoTransition('ZeroCoder Home');
                navigate('/');
              }}
            >
              <ToolIcon size={15} />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentMeta = getDestinationMeta(currentCourse, currentTerm, currentTool);

  return (
    <div
      className="app-container zc-dashboard-container"
      style={{ height: 'auto', minHeight: '100%', overflow: 'visible' }}
    >
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <main className="dashboard-main zc-hub-main">
        {!isWorkspaceOpen ? (
          /* ============================================================
             MODE 1: MINIMAL HOME PAGE (ONLY GLOBAL SEARCH + 2 COURSE CARDS)
             ============================================================ */
          <div className="zc-minimal-home" data-testid="zc-minimal-home">
            <div className="zc-home-hero">
              <div className="zc-home-terminal-tag">
                <span className="zc-ws-prompt">$</span>
                <span>~/zerocoder/home</span>
              </div>
              <h1 className="zc-home-heading">Select a Course or Search Resources</h1>
            </div>

            {/* A. Prominent Central Global Search */}
            <div
              className="zc-home-search-container"
              ref={homeSearchWrapRef}
              role="search"
              aria-label="Global Resource Search"
            >
              <div className={`zc-home-search-bar glass-panel ${isHomeSearchOpen ? 'focused' : ''}`}>
                <Search size={19} className="zc-home-search-icon" />
                <input
                  ref={homeSearchInputRef}
                  type="text"
                  className="zc-home-search-input"
                  placeholder="Search by path or resource (e.g. Programming / Final-term / Tests, Pandas, Database)..."
                  value={homeSearchQuery}
                  onFocus={() => setIsHomeSearchOpen(true)}
                  onChange={(e) => {
                    setHomeSearchQuery(e.target.value);
                    setIsHomeSearchOpen(true);
                  }}
                  onKeyDown={handleHomeSearchKeyDown}
                  aria-label="Search courses, terms, tools, and learning resources"
                />
                {homeSearchQuery && (
                  <button
                    type="button"
                    className="zc-cmd-clear-btn"
                    onClick={() => {
                      setHomeSearchQuery('');
                      if (homeSearchInputRef.current) homeSearchInputRef.current.focus();
                    }}
                    aria-label="Clear search query"
                  >
                    <X size={14} />
                  </button>
                )}
                <kbd className="zc-cmd-kbd">Ctrl K</kbd>
              </div>

              {/* Path-Grouped Search Dropdown */}
              {isHomeSearchOpen && (
                <div
                  className="zc-home-search-dropdown glass-panel"
                  role="listbox"
                  aria-label="Path-Grouped Search Results"
                >
                  <div className="zc-cmd-results">
                    {homeSearchGroups.length === 0 ? (
                      <div className="zc-cmd-empty">
                        <Terminal size={22} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                        <div>No matching resources found for "{homeSearchQuery}"</div>
                      </div>
                    ) : (
                      homeSearchGroups.map((group) => (
                        <div key={group.groupPath} className="zc-search-path-group">
                          <div className="zc-search-group-header">
                            <span className="zc-search-breadcrumb">{group.groupPath}</span>
                            <span className="zc-search-group-count">{group.items.length}</span>
                          </div>
                          {group.items.map((item) => {
                            const Icon = TOOL_ICONS[item.tool] || Terminal;
                            const isSelected = item.flatIndex === homeSelectedIdx;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`zc-cmd-item ${isSelected ? 'selected' : ''}`}
                                onMouseEnter={() => setHomeSelectedIdx(item.flatIndex)}
                                onClick={() => handleSelectSearchResult(item)}
                              >
                                <div className="zc-cmd-item-icon">
                                  <Icon size={15} />
                                </div>
                                <div className="zc-cmd-item-main">
                                  <div className="zc-cmd-item-title">
                                    {highlightMatch(item.title, homeSearchQuery)}
                                  </div>
                                  <div className="zc-cmd-item-subtitle">
                                    {highlightMatch(item.subtitle, homeSearchQuery)}
                                  </div>
                                </div>
                                <div className="zc-cmd-item-badges">
                                  <span
                                    className={`zc-cmd-badge ${
                                      item.isEmptyScaffold
                                        ? 'zc-cmd-badge-scaffold'
                                        : 'zc-cmd-badge-tool'
                                    }`}
                                  >
                                    {item.badge || item.toolLabel}
                                  </span>
                                  <ArrowRight size={14} className="zc-cmd-item-arrow" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* B. Two Visually Balanced Course Selection Cards */}
            <div className="zc-home-courses-grid" role="region" aria-label="Course Selection">
              {COURSES.map((course) => {
                const isProg = course.id === 'programming';
                const CourseIcon = isProg ? Code2 : Database;
                return (
                  <button
                    key={course.id}
                    type="button"
                    className={`zc-home-course-card glass-panel course-${course.id}`}
                    data-testid={`home-course-card-${course.id}`}
                    onClick={() => handleEnterCourseFromHome(course.id)}
                  >
                    <div className="zc-home-course-top">
                      <div className="zc-home-course-icon">
                        <CourseIcon size={24} />
                      </div>
                      <span className={`zc-home-course-badge badge-${course.id}`}>
                        {course.badge}
                      </span>
                    </div>
                    <h2 className="zc-home-course-title">{course.label}</h2>
                    <p className="zc-home-course-desc">{course.description}</p>
                    <div className="zc-home-course-footer">
                      <span className="zc-home-course-structure">
                        Mid-term &bull; Final-term
                      </span>
                      <span className="zc-home-course-cta">
                        <span>Enter Workspace</span>
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : isLoading && currentCourse === 'programming' && problems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem'
            }}
          >
            <div
              className="loading-spinner"
              style={{
                marginBottom: '1rem',
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>Loading workspace...</p>
          </div>
        ) : (
          /* ============================================================
             MODE 2: COURSE LEARNING WORKSPACE (PROGRAMMING OR DATABASE)
             ============================================================ */
          <div
            key={`${currentCourse}-${currentTerm}-${currentTool}`}
            className="zc-adaptive-workspace zc-fast-content-transition"
            data-testid={`workspace-${currentCourse}-${currentTerm}-${currentTool}`}
          >
            {/* Compact Cyber-Minimal Workspace Context Header */}
            <div className="zc-ws-header zc-ws-compact-header">
              <div className="zc-ws-header-top">
                <div className="zc-ws-terminal-line">
                  <span className="zc-ws-prompt">$</span>
                  <span className="zc-ws-path">
                    ~/zerocoder/{currentCourse}/{currentTerm === 'mid' ? 'mid-term' : 'final-term'}/
                    {currentTool}
                  </span>
                  <span className="zc-ws-badge-pill">{currentMeta.badge}</span>
                </div>
                <div className="zc-ws-title-row">
                  <div>
                    <h1 className="zc-ws-title">{currentMeta.title}</h1>
                    <p className="zc-ws-subtitle">{currentMeta.subtitle}</p>
                  </div>
                  {currentCourse === 'programming' && (
                    <div className="zc-progress-pills">
                      <span className="zc-stat-pill" title="Solved Programming Problems">
                        <CheckCircle size={13} color="var(--accent-primary)" />
                        <span>{solvedCount} Solved</span>
                      </span>
                      {flaggedCount > 0 && (
                        <span className="zc-stat-pill" title="Flagged Problems">
                          <Flag size={13} color="#fbbf24" />
                          <span>{flaggedCount} Flagged</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Tool Content */}
            {currentCourse === 'database' ? (
              renderDatabaseEmptyWorkspace(currentMeta)
            ) : (
              <>
                {currentTool === 'cheatsheet' && renderCheatsheetWorkspace()}
                {currentTool === 'tests' && renderTestsWorkspace()}
                {currentTool === 'interactive' && renderInteractiveLearningWorkspace()}
              </>
            )}
          </div>
        )}
      </main>

      <CheatsheetModal
        isOpen={cheatsheetState.isOpen}
        onClose={() => setCheatsheetState({ ...cheatsheetState, isOpen: false })}
        mode={cheatsheetState.mode}
        initialLecture={cheatsheetState.lectureId}
        term={cheatsheetState.term}
      />
    </div>
  );
}

export default Dashboard;

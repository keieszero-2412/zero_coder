import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Settings,
  LogOut,
  Code2,
  Database,
  ChevronDown,
  FileText,
  ListChecks,
  GraduationCap,
  Search,
  X,
  CornerDownLeft,
  ArrowRight,
  Terminal,
  Check,
  Shield,
  Info,
  User,
  Ellipsis,
  MessageSquare
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { UserNotificationModal } from './UserNotificationModal';
import {
  useTerm,
  COURSES,
  TOOLS_BY_TERM,
  DESTINATION_METADATA,
  normalizeCourse,
  normalizeTerm,
  resolveValidTool,
  getDestinationUrl,
  buildSearchIndex,
  queryGroupedSearchResults,
  recordRecentActivity
} from '../context/TermContext';
import { useProblems } from '../context/ProblemsContext';
import { useNotification } from '../context/NotificationContext';
import { CHEATSHEETS, MIDTERM_CHEATSHEETS } from '../data/cheatsheets';
import { getLecturesManifest, getCachedLecturesManifest } from '../utils/lecturesCache';
import FeedbackWidget from './FeedbackWidget';
import { SOLE_ADMIN_UID } from '../utils/accessPolicy';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const TOOL_DESCRIPTIONS = {
  cheatsheet: 'Syntax reference cards & formulas',
  tests: 'Coding practice problems & mock tests',
  interactive: 'Interactive Jupyter notebooks'
};

const TOOL_ICONS = {
  cheatsheet: FileText,
  tests: ListChecks,
  interactive: GraduationCap
};

/*
 * Content-aware header collapse.
 * States are ordered from most to least spacious. The header measures its real
 * regions and picks the FIRST state in which nothing overflows or intersects.
 * Each state is cumulative: a `data-h-<flag>` attribute is set for every step
 * reached, and index.css keys all collapse styling off those attributes.
 */
const HEADER_STATES = ['full', 'tight', 'study', 'search', 'narrow', 'minimal', 'micro'];

function applyHeaderLevel(el, level) {
  el.setAttribute('data-hstate', HEADER_STATES[level]);
  for (let i = 1; i < HEADER_STATES.length; i++) {
    el.toggleAttribute(`data-h-${HEADER_STATES[i]}`, level >= i);
  }
}

function isRendered(node) {
  if (!node) return false;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function headerFits(el) {
  if (el.scrollWidth > el.clientWidth + 1) return false;
  const brand = el.querySelector(':scope > .zc-hdr-brand');
  const nav = el.querySelector(':scope > .zc-hdr-nav');
  const utils = el.querySelector(':scope > .zc-hdr-utilities');
  const cs = getComputedStyle(el);
  const hb = el.getBoundingClientRect();
  if (hb.width <= 0) return true;
  const innerLeft = hb.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) - 0.5;
  const innerRight = hb.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) + 0.5;

  const regions = [brand, nav, utils].filter(isRendered);
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i].getBoundingClientRect();
    if (r.left < innerLeft || r.right > innerRight) return false;
    if (regions[i].scrollWidth > regions[i].clientWidth + 1) return false;
    if (i > 0 && regions[i - 1].getBoundingClientRect().right + 6 > r.left) return false;
    for (const child of regions[i].querySelectorAll('a, button, .dashboard-user-profile, .zc-cmd-group')) {
      if (!isRendered(child)) continue;
      const c = child.getBoundingClientRect();
      if (c.left < r.left - 0.5 || c.right > r.right + 0.5) return false;
    }
  }
  return true;
}

export function highlightMatch(text, rawQuery) {
  const q = String(rawQuery || '').trim();
  if (!q || !text) return text;
  const firstToken = q.split(/\s+/)[0];
  if (!firstToken) return text;
  const escaped = firstToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === firstToken.toLowerCase() ? (
      <mark key={i} className="zc-search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function GlobalHeader() {
  const { currentUser, logout } = useAuth();
  const isSoleAdmin = currentUser?.role === 'Admin' && currentUser?.uid === SOLE_ADMIN_UID;
  const {
    activeCourse,
    setActiveCourse,
    activeTerm,
    setActiveTerm,
    activeTool,
    setActiveTool,
    logoTransition,
    triggerLogoTransition
  } = useTerm();
  const { showToast } = useNotification();

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showUserNotif, setShowUserNotif] = useState(false);
  const [userNotifications, setUserNotifications] = useState([]);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseDropdownCoords, setCourseDropdownCoords] = useState(null);
  const [isStudyDropdownOpen, setIsStudyDropdownOpen] = useState(false);
  const [studyDropdownCoords, setStudyDropdownCoords] = useState(null);
  const studyDropdownRef = useRef(null);
  const studyMenuPortalRef = useRef(null);
  const headerRef = useRef(null);
  const [headerLevel, setHeaderLevel] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [moreCoords, setMoreCoords] = useState(null);
  const moreBtnRef = useRef(null);
  const moreMenuRef = useRef(null);
  const feedbackSlotRef = useRef(null);
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const [quickJumpQuery, setQuickJumpQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lecturesManifest, setLecturesManifest] = useState(
    () => getCachedLecturesManifest()?.lectures || []
  );

  const courseDropdownRef = useRef(null);
  const quickInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { problems } = useProblems();

  const searchParams = new URLSearchParams(location.search);
  const urlCourseParam = normalizeCourse(searchParams.get('course'));
  const isHomeRoute = location.pathname === '/' && !urlCourseParam && !searchParams.get('tool');

  const [lastViewedNoti, setLastViewedNoti] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_last_viewed_noti');
      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);

  // Sync URL ?course=, ?term=, and ?tool= into TermContext
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCourse = normalizeCourse(params.get('course'));
    const urlTerm = normalizeTerm(params.get('term'));
    const urlTool = params.get('tool');
    const targetTerm = urlTerm || activeTerm || 'mid';

    if (urlCourse && urlCourse !== activeCourse) {
      setActiveCourse(urlCourse);
    }
    if (urlTerm && urlTerm !== activeTerm) {
      setActiveTerm(urlTerm);
    }
    if (urlTool) {
      const validTool = resolveValidTool(targetTerm, urlTool);
      if (validTool !== activeTool) {
        setActiveTool(validTool, targetTerm);
      }
    }
  }, [location.search]);

  // Course dropdown positioning and outside click / Escape handler
  useEffect(() => {
    if (!isCourseDropdownOpen) {
      setCourseDropdownCoords(null);
      return;
    }

    const updateCoords = () => {
      if (courseDropdownRef.current) {
        const rect = courseDropdownRef.current.getBoundingClientRect();
        const menuWidth = Math.min(280, window.innerWidth - 16);
        let left = rect.left;
        if (left + menuWidth > window.innerWidth - 8) {
          left = Math.max(8, window.innerWidth - menuWidth - 8);
        }
        setCourseDropdownCoords({
          top: Math.round(rect.bottom + 6),
          left: Math.round(Math.max(8, left)),
          width: Math.round(menuWidth)
        });
      }
    };

    updateCoords();

    const handleClickOutside = (e) => {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(e.target) &&
        !e.target.closest('.zc-cmd-course-menu-portaled')
      ) {
        setIsCourseDropdownOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsCourseDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isCourseDropdownOpen]);

  

  // Study Navigation Dropdown positioning & outside click / Escape handler
  useEffect(() => {
    if (!isStudyDropdownOpen) {
      setStudyDropdownCoords(null);
      return;
    }

    const updateCoords = () => {
      if (studyDropdownRef.current) {
        const rect = studyDropdownRef.current.getBoundingClientRect();
        const width = 230;
        let left = rect.left;
        if (left + width > window.innerWidth - 12) {
          left = window.innerWidth - width - 12;
        }
        if (left < 8) left = 8;
        setStudyDropdownCoords({
          top: Math.round(rect.bottom + 6),
          left: Math.round(left),
          width: Math.round(width)
        });
      }
    };

    updateCoords();

    const handleClickOutside = (e) => {
      if (
        studyDropdownRef.current &&
        !studyDropdownRef.current.contains(e.target) &&
        studyMenuPortalRef.current &&
        !studyMenuPortalRef.current.contains(e.target)
      ) {
        setIsStudyDropdownOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsStudyDropdownOpen(false);
        if (studyDropdownRef.current) {
          const btn = studyDropdownRef.current.querySelector('button');
          if (btn) btn.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isStudyDropdownOpen]);

  // Global Ctrl+K / Cmd+K Search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isHomeRoute) {
          window.dispatchEvent(new CustomEvent('zc-focus-home-search'));
        } else {
          setIsQuickJumpOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHomeRoute]);

  useEffect(() => {
    getLecturesManifest()
      .then((data) => {
        if (data?.lectures) setLecturesManifest(data.lectures);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isQuickJumpOpen) return;
    setQuickJumpQuery('');
    setSelectedIdx(0);
    setTimeout(() => {
      if (quickInputRef.current) quickInputRef.current.focus();
    }, 20);
  }, [isQuickJumpOpen]);

  // Close Quick Jump modal if user navigates to Home
  useEffect(() => {
    if (isHomeRoute && isQuickJumpOpen) {
      setIsQuickJumpOpen(false);
    }
  }, [isHomeRoute, isQuickJumpOpen]);

  // Sync last viewed time from Firestore if available
  useEffect(() => {
    if (isSoleAdmin && currentUser?.adminLastViewedAt) {
      const fsTime = currentUser.adminLastViewedAt.toMillis
        ? currentUser.adminLastViewedAt.toMillis()
        : new Date(currentUser.adminLastViewedAt).getTime();
      if (fsTime > lastViewedNoti) {
        setLastViewedNoti(fsTime);
        try {
          localStorage.setItem('admin_last_viewed_noti', String(fsTime));
        } catch {}
      }
    }
  }, [isSoleAdmin, currentUser, lastViewedNoti]);

  const markAdminNotificationsAsSeen = () => {
    const now = Date.now();
    setLastViewedNoti(now);
    setAdminNotificationCount(0);
    try {
      localStorage.setItem('admin_last_viewed_noti', String(now));
    } catch {}
    if (isSoleAdmin && currentUser?.uid) {
      updateDoc(doc(db, 'users', currentUser.uid), {
        adminLastViewedAt: serverTimestamp()
      }).catch(() => {});
    }
  };

  const handleOpenAdminPanel = () => {
    if (!isSoleAdmin) return;
    setShowAdminPanel(true);
    markAdminNotificationsAsSeen();
  };

  const handleCloseAdminPanel = () => {
    setShowAdminPanel(false);
    markAdminNotificationsAsSeen();
  };

  useEffect(() => {
    if (!isSoleAdmin) {
      setAdminNotificationCount(0);
      return;
    }

    const getDocTime = (data) => {
      const ts = data.updatedAt || data.requestedAt || data.createdAt;
      if (!ts) return 0;
      if (typeof ts.toMillis === 'function') return ts.toMillis();
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      const parsed = new Date(ts).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    let rawAccessDocs = [];
    let rawFeedbackDocs = [];

    const recalculateCount = () => {
      let count = 0;
      for (const data of rawAccessDocs) {
        const time = getDocTime(data);
        if (time > lastViewedNoti) count++;
      }
      for (const data of rawFeedbackDocs) {
        if (
          data.status === 'new' ||
          data.status === 'user_replied' ||
          !data.status ||
          data.status === 'pending'
        ) {
          const time = getDocTime(data);
          if (time > lastViewedNoti) count++;
        }
      }
      setAdminNotificationCount(count);
    };

    const qAccess = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsubscribeAccess = onSnapshot(
      qAccess,
      (snapshot) => {
        rawAccessDocs = snapshot.docs.map((d) => d.data());
        recalculateCount();
      },
      () => {}
    );

    const qFeedback = collection(db, 'feedbacks');
    const unsubscribeFeedback = onSnapshot(
      qFeedback,
      (snapshot) => {
        rawFeedbackDocs = snapshot.docs.map((d) => d.data());
        recalculateCount();
      },
      () => {}
    );

    return () => {
      unsubscribeAccess();
      unsubscribeFeedback();
    };
  }, [isSoleAdmin, lastViewedNoti]);

  useEffect(() => {
    if (!currentUser || isSoleAdmin) return;

    let uidReq = null;
    const emailReqs = new Map();
    const syncNotification = () => {
      const legacyActive = Array.from(emailReqs.values()).find(Boolean) || null;
      const active = uidReq || legacyActive;
      if (active) {
        setUserNotifications([
          {
            type: 'access_request_rejected',
            title: 'Access Request Rejected',
            message: `Your request for ${active.requestedCode || 'Blue'} Code access was declined by the admin.`,
            timestamp: active.requestedAt,
            requestDocId: active.requestDocId
          }
        ]);
      } else {
        setUserNotifications([]);
      }
    };

    const unsubUid = onSnapshot(
      doc(db, 'access_requests', currentUser.uid),
      (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : null;
        uidReq = data?.status === 'rejected' ? { ...data, requestDocId: docSnap.id } : null;
        syncNotification();
      },
      () => {
        uidReq = null;
        syncNotification();
      }
    );

    const legacyEmailKeys = currentUser.email && currentUser.email !== currentUser.uid
      ? Array.from(new Set([currentUser.email, currentUser.email.toLowerCase()]))
      : [];
    const unsubEmails = legacyEmailKeys.map((emailKey) =>
      onSnapshot(
        doc(db, 'access_requests', emailKey),
        (docSnap) => {
          const data = docSnap.exists() ? docSnap.data() : null;
          emailReqs.set(emailKey, data?.status === 'rejected' ? { ...data, requestDocId: docSnap.id } : null);
          syncNotification();
        },
        () => {
          emailReqs.set(emailKey, null);
          syncNotification();
        }
      )
    );

    return () => {
      unsubUid();
      unsubEmails.forEach((unsub) => unsub());
    };
  }, [currentUser, isSoleAdmin]);

  // Determine visually active course, term, and tool based on current route or context
  const visualCourse = urlCourseParam || normalizeCourse(activeCourse) || 'programming';

  let visualTerm = normalizeTerm(activeTerm) || 'mid';
  if (location.pathname.startsWith('/learn')) {
    visualTerm = 'final';
  } else if (location.pathname.startsWith('/workspace/')) {
    const id = location.pathname.split('/workspace/')[1];
    const currentProblem = problems.find((p) => p.id === id || p.id === Number(id));
    if (currentProblem) {
      const cat = (currentProblem.category || '').toLowerCase();
      visualTerm = cat.includes('final') || cat.includes('last') ? 'final' : 'mid';
    }
  }

  const isOnWorkspacePage = location.pathname === '/' && !isHomeRoute;
  const isOnCodingProblem = location.pathname.startsWith('/workspace/');
  const isOnNotebook = location.pathname.startsWith('/learn');

  const availableTools = useMemo(() => {
    return TOOLS_BY_TERM[visualTerm] || TOOLS_BY_TERM.mid;
  }, [visualTerm]);

  const effectiveActiveTool = useMemo(() => {
    if (isOnNotebook) return 'interactive';
    if (isOnCodingProblem) return 'tests';
    return resolveValidTool(visualTerm, activeTool);
  }, [isOnNotebook, isOnCodingProblem, visualTerm, activeTool]);

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    setIsCourseDropdownOpen(false);
    setIsQuickJumpOpen(false);
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (!isHomeRoute) {
      triggerLogoTransition('ZeroCoder Home');
    }
    navigate('/');
  };

  const navigateToDestination = (
    nextCourse,
    nextTerm,
    nextTool,
    { fallbackNotice = null, playBootTransition = false } = {}
  ) => {
    const validCourse = normalizeCourse(nextCourse) || 'programming';
    const validTerm = normalizeTerm(nextTerm) || 'mid';
    const validTool = resolveValidTool(validTerm, nextTool);

    setActiveCourse(validCourse);
    setActiveTerm(validTerm);
    setActiveTool(validTool, validTerm);
    setIsCourseDropdownOpen(false);

    if (playBootTransition) {
      const courseLabel = validCourse === 'database' ? 'Database' : 'Programming';
      triggerLogoTransition(`${courseLabel} Workspace`);
    }

    if (fallbackNotice && showToast) {
      showToast(fallbackNotice, 'info');
    }

    const meta = DESTINATION_METADATA[`${validCourse}:${validTerm}:${validTool}`];
    if (meta) {
      recordRecentActivity({
        id: `dest-${validCourse}-${validTerm}-${validTool}`,
        type: 'destination',
        title: meta.title,
        subtitle: meta.subtitle,
        course: validCourse,
        term: validTerm,
        tool: validTool,
        path: getDestinationUrl(validCourse, validTerm, validTool)
      });
    }

    navigate(getDestinationUrl(validCourse, validTerm, validTool));
  };

  const handleCourseSelect = (nextCourse) => {
    const shouldPlayBoot = isHomeRoute || nextCourse !== visualCourse;
    navigateToDestination(nextCourse, visualTerm, effectiveActiveTool, {
      playBootTransition: shouldPlayBoot
    });
  };

  const handleTermSwitch = (nextTerm) => {
    const requestedTool = effectiveActiveTool;
    const resolvedTool = resolveValidTool(nextTerm, requestedTool);
    let fallbackNotice = null;

    if (requestedTool === 'interactive' && nextTerm === 'mid') {
      fallbackNotice =
        'Interactive Learning is available in Final-term only. Opened Mid-term Tests.';
    }

    navigateToDestination(visualCourse, nextTerm, resolvedTool, {
      fallbackNotice,
      playBootTransition: isHomeRoute
    });
  };

  const handleToolSwitch = (nextTool) => {
    navigateToDestination(visualCourse, visualTerm, nextTool, {
      playBootTransition: isHomeRoute
    });
  };

  const handleTermKeyDown = (e) => {
    const terms = ['mid', 'final'];
    const currentIndex = terms.indexOf(visualTerm);
    let nextIndex = -1;

    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % terms.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + terms.length) % terms.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = terms.length - 1;

    if (nextIndex !== -1) {
      e.preventDefault();
      handleTermSwitch(terms[nextIndex]);
      const tabButtons = e.currentTarget.querySelectorAll('[role="tab"]');
      if (tabButtons[nextIndex]) tabButtons[nextIndex].focus();
    }
  };

  const handleToolKeyDown = (e) => {
    const toolIds = availableTools.map((t) => t.id);
    const currentIndex = Math.max(0, toolIds.indexOf(effectiveActiveTool));
    let nextIndex = -1;

    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % toolIds.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + toolIds.length) % toolIds.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = toolIds.length - 1;

    if (nextIndex !== -1) {
      e.preventDefault();
      handleToolSwitch(toolIds[nextIndex]);
      const tabButtons = e.currentTarget.querySelectorAll('[role="tab"]');
      if (tabButtons[nextIndex]) tabButtons[nextIndex].focus();
    }
  };

  const has2809Access = isSoleAdmin || currentUser?.colorCode === 'Blue';

  const allSearchItems = useMemo(() => {
    return buildSearchIndex({
      midtermCheatsheets: MIDTERM_CHEATSHEETS,
      finalCheatsheets: CHEATSHEETS,
      lecturesManifest,
      problems,
      has2809Access
    });
  }, [lecturesManifest, problems, has2809Access]);

  const { groups: quickJumpGroups, flatItems: quickJumpFlatItems } = useMemo(() => {
    return queryGroupedSearchResults(allSearchItems, quickJumpQuery, 18);
  }, [allSearchItems, quickJumpQuery]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [quickJumpQuery]);

  const handleSelectQuickItem = (item) => {
    if (!item) return;
    const isCourseBoundary = isHomeRoute || (item.course && item.course !== visualCourse);
    if (item.course) setActiveCourse(item.course);
    if (item.term) setActiveTerm(item.term);
    if (item.tool) setActiveTool(item.tool, item.term || visualTerm);
    if (isCourseBoundary) {
      triggerLogoTransition(`${item.courseLabel || 'Course'} Workspace`);
    }
    recordRecentActivity({
      id: item.id,
      type: item.tool,
      title: item.title,
      subtitle: item.subtitle,
      course: item.course,
      term: item.term,
      tool: item.tool,
      path: item.path
    });
    setIsQuickJumpOpen(false);
    navigate(item.path);
  };

  const handleQuickJumpKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsQuickJumpOpen(false);
      return;
    }
    if (quickJumpFlatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % quickJumpFlatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(
        (prev) => (prev - 1 + quickJumpFlatItems.length) % quickJumpFlatItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectQuickItem(quickJumpFlatItems[selectedIdx]);
    }
  };

  const isToolActive = useCallback(
    (toolId) =>
      (isOnWorkspacePage && effectiveActiveTool === toolId) ||
      (isOnCodingProblem && toolId === 'tests') ||
      (isOnNotebook && toolId === 'interactive'),
    [isOnWorkspacePage, effectiveActiveTool, isOnCodingProblem, isOnNotebook]
  );

  const activeToolObj = useMemo(() => {
    return (
      availableTools.find((tool) => isToolActive(tool.id)) || availableTools[0]
    );
  }, [availableTools, isToolActive]);


  const handleSearchButtonClick = () => {
    if (isHomeRoute) {
      window.dispatchEvent(new CustomEvent('zc-focus-home-search'));
    } else {
      setIsQuickJumpOpen(true);
    }
  };

  const statusColor = useMemo(() => {
    if (!currentUser) return '#10b981';
    switch (currentUser.colorCode) {
      case 'Green':
        return '#10b981';
      case 'Blue':
        return '#3b82f6';
      case 'Gray':
        return '#9ca3af';
      case 'Red':
        return 'var(--error, #ef4444)';
      default:
        return '#10b981';
    }
  }, [currentUser]);

  // ---- Content-aware header collapse -------------------------------------
  // Tries each state from most to least spacious and keeps the first one where
  // every region and control fits inside its allotted space. The result only
  // depends on the current width + content, never on the previous state, so it
  // cannot oscillate. All DOM writes happen before paint (layout effect /
  // ResizeObserver callback), so intermediate states are never painted.
  const fitHeader = useCallback(() => {
    const el = headerRef.current;
    if (!el) return;
    let chosen = HEADER_STATES.length - 1;
    for (let i = 0; i < HEADER_STATES.length; i++) {
      applyHeaderLevel(el, i);
      if (headerFits(el)) {
        chosen = i;
        break;
      }
    }
    applyHeaderLevel(el, chosen);
    setHeaderLevel((prev) => (prev === chosen ? prev : chosen));
  }, []);

  useLayoutEffect(() => {
    fitHeader();
  }, [
    fitHeader,
    currentUser?.username,
    currentUser?.role,
    currentUser?.colorCode,
    visualCourse,
    visualTerm,
    availableTools.length,
    adminNotificationCount,
    userNotifications.length,
    isHomeRoute
  ]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let lastWidth = -1;
    // Only the header's own width is observed. Collapse changes its children,
    // never its width (fixed 50px row, width = viewport), so this cannot loop.
    const ro = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width);
      if (width === lastWidth) return;
      lastWidth = width;
      fitHeader();
    });
    ro.observe(el);
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) fitHeader();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [fitHeader]);

  // Close menus that no longer exist in the current state.
  useEffect(() => {
    if (headerLevel < HEADER_STATES.indexOf('study')) setIsStudyDropdownOpen(false);
    if (headerLevel < HEADER_STATES.indexOf('minimal')) setIsMoreOpen(false);
  }, [headerLevel]);

  // "More" overflow menu (minimal state): position, outside-click, Escape.
  useEffect(() => {
    if (!isMoreOpen) {
      setMoreCoords(null);
      return undefined;
    }
    const updateCoords = () => {
      if (!moreBtnRef.current) return;
      const rect = moreBtnRef.current.getBoundingClientRect();
      const width = 240;
      let left = rect.right - width;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setMoreCoords({ top: Math.round(rect.bottom + 6), left: Math.round(left), width });
    };
    updateCoords();
    const handleClickOutside = (e) => {
      if (
        moreBtnRef.current &&
        !moreBtnRef.current.contains(e.target) &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target)
      ) {
        setIsMoreOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        moreBtnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', updateCoords);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isMoreOpen]);

  // Move focus into the menu once it is positioned.
  useEffect(() => {
    if (isMoreOpen && moreCoords && moreMenuRef.current) {
      moreMenuRef.current.querySelector('[role="menuitem"]')?.focus();
    }
  }, [isMoreOpen, moreCoords]);

  const handleMoreMenuKeyDown = (e) => {
    const items = Array.from(moreMenuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Tab') {
      setIsMoreOpen(false);
      return;
    }
    if (next !== -1) {
      e.preventDefault();
      items[next].focus();
    }
  };

  const runMoreAction = (action) => {
    setIsMoreOpen(false);
    action();
  };

  const statusLabel = `Code: ${currentUser?.colorCode || 'Red'}`;

  return (
    <header ref={headerRef} className="header global-header zc-command-header" data-hstate="full">
      {/* Region A — Brand: ZeroCoder Logo & Wordmark */}
      <div className="global-header-left zc-hdr-brand">
        <a
          href="/"
          onClick={handleGoHome}
          aria-label="Go to ZeroCoder Home"
          title="Go to ZeroCoder Home"
          className="zc-home-logo-link"
        >
          <div className="header-title">
            <img
              src="/zerocoder-logo-transparent.png"
              alt="zerocoder Logo"
              className="zc-brand-logo-img"
            />
            <span className="zc-brand-wordmark">zerocoder</span>
          </div>
        </a>
      </div>

      {/* Region B — Navigation: [Course Dropdown] [Term Selector] [Study Tools] */}
      {currentUser ? (
        <div
          className="global-header-tabs zc-header-command-center zc-hdr-nav"
          role="navigation"
          aria-label="ZeroCoder Contextual Command Navigation"
        >
          {/* Course Dropdown (Programming / Database) */}
          <div className="zc-cmd-course-dropdown-wrap" ref={courseDropdownRef}>
            <button
              type="button"
              className={`zc-cmd-course-trigger ${!isHomeRoute ? 'active' : ''}`}
              aria-haspopup="listbox"
              aria-expanded={isCourseDropdownOpen}
              aria-label={`Select Course (Current: ${
                visualCourse === 'database' ? 'Database' : 'Programming'
              })`}
              onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
            >
              {visualCourse === 'database' ? <Database size={13} /> : <Code2 size={13} />}
              <span className="zc-cmd-course-name">
                {visualCourse === 'database' ? 'Database' : 'Programming'}
              </span>
              <ChevronDown
                size={13}
                className={`zc-cmd-chevron ${isCourseDropdownOpen ? 'open' : ''}`}
              />
            </button>
          </div>

          <span className="zc-cmd-divider" aria-hidden="true">/</span>

          {/* Term Selector (Mid-term / Final-term) */}
          <div
            className="zc-cmd-group zc-cmd-term-group"
            role="tablist"
            aria-label="Academic Term Selection"
            onKeyDown={handleTermKeyDown}
          >
            <button
              type="button"
              role="tab"
              aria-selected={visualTerm === 'mid'}
              tabIndex={visualTerm === 'mid' ? 0 : -1}
              className={`header-tab-btn zc-cmd-pill ${visualTerm === 'mid' ? 'active' : ''}`}
              onClick={() => handleTermSwitch('mid')}
              title={`Switch to Mid-term (${
                visualCourse === 'database' ? 'Database' : 'Programming'
              })`}
            >
              <span className="zc-term-full">Mid-term</span>
              <span className="zc-term-short">Mid</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={visualTerm === 'final'}
              tabIndex={visualTerm === 'final' ? 0 : -1}
              className={`header-tab-btn zc-cmd-pill ${visualTerm === 'final' ? 'active' : ''}`}
              onClick={() => handleTermSwitch('final')}
              title={`Switch to Final-term (${
                visualCourse === 'database' ? 'Database' : 'Programming'
              })`}
            >
              <span className="zc-term-full">Final-term</span>
              <span className="zc-term-short">Final</span>
            </button>
          </div>

          <span className="zc-cmd-divider" aria-hidden="true">/</span>

          {/* Context-Aware Learning Tools (Progressive Collapse: Full -> Study Dropdown) */}
          <div
            className="zc-cmd-group zc-cmd-tools-group"
            role="tablist"
            aria-label={`${visualTerm === 'mid' ? 'Mid-term' : 'Final-term'} Learning Tools`}
          >
            {/* Expanded Study Navigation */}
            <div className="zc-cmd-tools-expanded" role="presentation" onKeyDown={handleToolKeyDown}>
              {availableTools.map((tool) => {
                const Icon = TOOL_ICONS[tool.id] || FileText;
                const isActive = isToolActive(tool.id);

                return (
                  <button
                    key={tool.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`header-tab-btn zc-cmd-tool-btn ${isActive ? 'active' : ''} ${
                      tool.id === 'interactive' ? 'zc-cmd-tool-interactive' : ''
                    }`}
                    onClick={() => handleToolSwitch(tool.id)}
                    title={`Open ${visualCourse === 'database' ? 'Database' : 'Programming'} ${
                      visualTerm === 'mid' ? 'Mid-term' : 'Final-term'
                    } ${tool.label}`}
                  >
                    <Icon size={13} className="zc-tool-icon" />
                    <span className="zc-cmd-tool-label-full">{tool.label}</span>
                    <span className="zc-cmd-tool-label-short">{tool.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Collapsed Study Navigation Dropdown Trigger */}
            <div className="zc-cmd-tools-collapsed" ref={studyDropdownRef}>
              <button
                type="button"
                className={`zc-cmd-tool-btn zc-cmd-study-dropdown-trigger ${
                  availableTools.some((t) => isToolActive(t.id)) ? 'active' : ''
                }`}
                aria-haspopup="listbox"
                aria-expanded={isStudyDropdownOpen}
                aria-label={`Study Navigation (Current: ${activeToolObj?.label || 'Study Tools'})`}
                onClick={() => setIsStudyDropdownOpen((prev) => !prev)}
              >
                <GraduationCap size={14} className="zc-tool-icon" />
                <span className="zc-cmd-study-trigger-label">Study</span>
                <ChevronDown
                  size={12}
                  className={`zc-cmd-chevron ${isStudyDropdownOpen ? 'open' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="global-header-tabs zc-hdr-nav" />
      )}

      {/* Region C — Utilities: [Global Search] [Admin/Notifications] [Feedback] [Settings] [About] [Profile/Status] [Logout] */}
      <div className="header-right-wrapper global-header-right zc-hdr-utilities">
        {currentUser && (
          <div className="dashboard-user-controls">
            {/* Single Global Search Entry Point */}
            <button
              type="button"
              className="zc-cmd-quickjump-btn"
              onClick={handleSearchButtonClick}
              title="Search courses, cheatsheets, tests, and interactive notebooks (Ctrl+K)"
              aria-label="Global Search (Ctrl+K)"
            >
              <Search size={14} className="zc-search-icon" />
              <span className="zc-cmd-quickjump-text">Search...</span>
              <kbd className="zc-cmd-kbd">Ctrl K</kbd>
            </button>

            {isSoleAdmin ? (
              <button
                type="button"
                onClick={handleOpenAdminPanel}
                className="button-secondary header-btn zc-utility-btn"
                title="Admin Dashboard"
                aria-label="Admin Dashboard"
              >
                <Shield size={14} />
                <span className="header-btn-label">Admin</span>
                {adminNotificationCount > 0 && (
                  <span className="zc-utility-badge">
                    {adminNotificationCount > 99 ? '99+' : adminNotificationCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowUserNotif(true)}
                className="button-secondary header-btn zc-utility-btn"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={14} />
                <span className="header-btn-label">Notifications</span>
                {userNotifications.length > 0 && (
                  <span className="zc-utility-badge">
                    {userNotifications.length}
                  </span>
                )}
              </button>
            )}

            <span ref={feedbackSlotRef} className="zc-util-secondary zc-feedback-slot">
              <FeedbackWidget iconOnly={true} />
            </span>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="button-secondary header-btn zc-utility-btn zc-util-secondary"
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={14} />
              <span className="header-btn-label">Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="button-secondary header-btn zc-utility-btn zc-util-secondary"
              title="About Project"
              aria-label="About Project"
            >
              <Info size={14} />
              <span className="header-btn-label">About Project</span>
            </button>

            <div className="header-divider" />

            <div
              className="dashboard-user-profile zc-profile-desktop"
              title={`User: ${currentUser.username} | Status: ${statusLabel}`}
            >
              <span className="zc-profile-username">{currentUser.username}</span>
              <div className="zc-profile-status-wrap">
                <span
                  className="zc-profile-code-dot"
                  style={{
                    backgroundColor: statusColor,
                    boxShadow: `0 0 6px ${statusColor}`
                  }}
                />
                <span
                  className="zc-profile-code-text"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="button-secondary header-btn zc-utility-btn zc-util-secondary"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
              <span className="header-btn-label">Logout</span>
            </button>

            {/* Accessible Overflow Menu Trigger (Only visible in minimal/micro states) */}
            <button
              ref={moreBtnRef}
              type="button"
              className="button-secondary header-btn zc-utility-btn zc-header-more-btn"
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              aria-label="More actions and account menu"
              title="More actions"
              onClick={() => setIsMoreOpen((prev) => !prev)}
            >
              <Ellipsis size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Path-Grouped Global Search Modal (Used on Learning Pages) */}
      {isQuickJumpOpen && !isHomeRoute && (
        <div
          className="zc-cmd-overlay"
          onClick={() => setIsQuickJumpOpen(false)}
          role="presentation"
        >
          <div
            className="zc-cmd-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Global Resource Search"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleQuickJumpKeyDown}
          >
            <div className="zc-cmd-input-row">
              <Search size={18} className="zc-cmd-search-icon" />
              <input
                ref={quickInputRef}
                type="text"
                className="zc-cmd-input"
                placeholder="Search by path or title (e.g. Programming Final-term, Pandas, Mock test, Database)..."
                value={quickJumpQuery}
                onChange={(e) => setQuickJumpQuery(e.target.value)}
                aria-label="Search courses, terms, tools, and resources"
              />
              {quickJumpQuery && (
                <button
                  type="button"
                  className="zc-cmd-clear-btn"
                  onClick={() => setQuickJumpQuery('')}
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                className="zc-cmd-esc-btn"
                onClick={() => setIsQuickJumpOpen(false)}
                aria-label="Close Search"
              >
                ESC
              </button>
            </div>

            <div className="zc-cmd-results" role="listbox" aria-label="Grouped Search Results">
              {quickJumpGroups.length === 0 ? (
                <div className="zc-cmd-empty">
                  <Terminal size={24} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <div>No matching resources found for "{quickJumpQuery}"</div>
                </div>
              ) : (
                quickJumpGroups.map((group) => (
                  <div key={group.groupPath} className="zc-search-path-group">
                    <div className="zc-search-group-header">
                      <span className="zc-search-breadcrumb">{group.groupPath}</span>
                      <span className="zc-search-group-count">{group.items.length}</span>
                    </div>
                    {group.items.map((item) => {
                      const Icon = TOOL_ICONS[item.tool] || Terminal;
                      const isSelected = item.flatIndex === selectedIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`zc-cmd-item ${isSelected ? 'selected' : ''}`}
                          onMouseEnter={() => setSelectedIdx(item.flatIndex)}
                          onClick={() => handleSelectQuickItem(item)}
                        >
                          <div className="zc-cmd-item-icon">
                            <Icon size={15} />
                          </div>
                          <div className="zc-cmd-item-main">
                            <div className="zc-cmd-item-title">
                              {highlightMatch(item.title, quickJumpQuery)}
                            </div>
                            <div className="zc-cmd-item-subtitle">
                              {highlightMatch(item.subtitle, quickJumpQuery)}
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

            <div className="zc-cmd-footer">
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to navigate
              </span>
              <span>
                <kbd>
                  <CornerDownLeft size={10} /> Enter
                </kbd>{' '}
                to open
              </span>
              <span>
                <kbd>ESC</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Animated ZeroCoder Boot Sequence Logo Transition Overlay (Portaled to document.body) */}
      {logoTransition.active &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            key={logoTransition.key}
            className="zc-boot-transition-overlay"
            role="status"
            aria-live="polite"
            aria-label={logoTransition.label || 'ZeroCoder transition'}
          >
            <div className="zc-boot-logo-stage">
              <svg
                className="zc-boot-svg"
                viewBox="0 0 220 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Left Bracket < */}
                <path
                  className="zc-boot-stroke zc-boot-left-bracket"
                  d="M64 34 L26 60 L64 86"
                  stroke="var(--accent-primary)"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Center Zero Circle O */}
                <circle
                  className="zc-boot-stroke zc-boot-zero-ring"
                  cx="110"
                  cy="60"
                  r="24"
                  stroke="var(--accent-primary)"
                  strokeWidth="7.5"
                />
                {/* Center Forward Slash / */}
                <line
                  className="zc-boot-stroke zc-boot-zero-slash"
                  x1="128"
                  y1="24"
                  x2="92"
                  y2="96"
                  stroke="var(--accent-primary)"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                {/* Right Bracket > */}
                <path
                  className="zc-boot-stroke zc-boot-right-bracket"
                  d="M156 34 L194 60 L156 86"
                  stroke="var(--accent-primary)"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="zc-boot-meta">
                <span className="zc-boot-brand">zerocoder</span>
                {logoTransition.label && (
                  <span className="zc-boot-target">&gt; {logoTransition.label}</span>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Portaled Study Navigation Dropdown Menu (Escapes header overflow) */}
      {isStudyDropdownOpen &&
        studyDropdownCoords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={studyMenuPortalRef}
            className="zc-cmd-study-menu zc-cmd-study-menu-portaled"
            role="listbox"
            aria-label="Study Navigation Menu"
            style={{
              position: 'fixed',
              top: `${studyDropdownCoords.top}px`,
              left: `${studyDropdownCoords.left}px`,
              width: `${studyDropdownCoords.width}px`,
              zIndex: 9999
            }}
          >
            {availableTools.map((tool) => {
              const Icon = TOOL_ICONS[tool.id] || Terminal;
              const isSelected = isToolActive(tool.id);
              const desc =
                TOOL_DESCRIPTIONS[tool.id] ||
                DESTINATION_METADATA[`${visualCourse}:${visualTerm}:${tool.id}`]?.subtitle ||
                tool.label;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`zc-cmd-study-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    handleToolSwitch(tool.id);
                    setIsStudyDropdownOpen(false);
                  }}
                >
                  <span className="zc-cmd-study-opt-icon">
                    <Icon size={15} />
                  </span>
                  <span className="zc-cmd-study-opt-body">
                    <span className="zc-cmd-study-opt-title">{tool.label}</span>
                    <span className="zc-cmd-study-opt-desc">{desc}</span>
                  </span>
                  {isSelected && <Check size={14} className="zc-cmd-study-check" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}

      {/* Portaled Course Selection Dropdown (Escapes overflow and fixed coordinates) */}
      {isCourseDropdownOpen &&
        courseDropdownCoords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="zc-cmd-course-menu zc-cmd-course-menu-portaled"
            role="listbox"
            aria-label="Course Selection"
            style={{
              position: 'fixed',
              top: `${courseDropdownCoords.top}px`,
              left: `${courseDropdownCoords.left}px`,
              width: `${courseDropdownCoords.width}px`,
              zIndex: 9999
            }}
          >
            {COURSES.map((course) => {
              const isSelected = !isHomeRoute && visualCourse === course.id;
              const CourseIcon = course.id === 'database' ? Database : Code2;
              return (
                <button
                  key={course.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`zc-cmd-course-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCourseSelect(course.id)}
                >
                  <span className="zc-cmd-course-opt-icon">
                    <CourseIcon size={15} />
                  </span>
                  <span className="zc-cmd-course-opt-body">
                    <span className="zc-cmd-course-opt-title">
                      {course.label}
                      <span className={`zc-cmd-course-opt-tag tag-${course.id}`}>
                        {course.badge}
                      </span>
                    </span>
                    <span className="zc-cmd-course-opt-desc">{course.description}</span>
                  </span>
                  {isSelected && <Check size={14} className="zc-cmd-course-check" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}

      {/* Portaled Overflow Utility Menu (Active in minimal/micro narrow states) */}
      {isMoreOpen &&
        moreCoords &&
        currentUser &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={moreMenuRef}
            className="zc-mobile-menu-popover"
            role="menu"
            aria-label="More Utility Actions"
            onKeyDown={handleMoreMenuKeyDown}
            style={{
              position: 'fixed',
              top: `${moreCoords.top}px`,
              left: `${moreCoords.left}px`,
              width: `${moreCoords.width}px`,
              zIndex: 9999
            }}
          >
            <div className="zc-mobile-menu-header">
              <div className="zc-mobile-menu-user-row">
                <User size={14} />
                <span className="zc-mobile-menu-username">{currentUser.username}</span>
              </div>
              <div className="zc-mobile-menu-badge-row">
                <span
                  className="zc-profile-code-dot"
                  style={{
                    backgroundColor: statusColor,
                    boxShadow: `0 0 6px ${statusColor}`
                  }}
                />
                <span className="zc-profile-code-text" style={{ color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="zc-mobile-menu-divider" />

            <button
              type="button"
              role="menuitem"
              className="zc-mobile-menu-item"
              onClick={() =>
                runMoreAction(() => feedbackSlotRef.current?.querySelector('button')?.click())
              }
            >
              <MessageSquare size={14} />
              <span>Feedback / Report Bug</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="zc-mobile-menu-item"
              onClick={() => runMoreAction(() => setShowSettings(true))}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="zc-mobile-menu-item"
              onClick={() => runMoreAction(() => setShowAbout(true))}
            >
              <Info size={14} />
              <span>About Project</span>
            </button>

            <div className="zc-mobile-menu-divider" />

            <button
              type="button"
              role="menuitem"
              className="zc-mobile-menu-item zc-mobile-menu-logout"
              onClick={() => runMoreAction(logout)}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>,
          document.body
        )}

      {isSoleAdmin && showAdminPanel && <AdminPanel onClose={handleCloseAdminPanel} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      {showUserNotif && (
        <UserNotificationModal
          onClose={() => setShowUserNotif(false)}
          notifications={userNotifications}
        />
      )}
    </header>
  );
}

export default GlobalHeader;

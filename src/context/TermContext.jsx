import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const TermContext = createContext();

export const useTerm = () => useContext(TermContext);

export const COURSES = [
  {
    id: 'programming',
    label: 'Programming',
    badge: 'ACTIVE',
    description: 'Python fundamentals, algorithms, NumPy, Pandas, and interactive Jupyter labs.'
  },
  {
    id: 'database',
    label: 'Database',
    badge: 'SCAFFOLD',
    description: 'Relational schemas, SQL querying, indexing, and database systems workspace.'
  }
];

/**
 * Per ZeroCoder 2.0 specification:
 * Neither Programming nor Database has a standalone Lectures navigation section.
 * Mid-term: Cheatsheet, Tests
 * Final-term: Cheatsheet, Tests, Interactive Learning
 */
export const TOOLS_BY_TERM = {
  mid: [
    { id: 'cheatsheet', label: 'Cheatsheet', shortLabel: 'Cheatsheet' },
    { id: 'tests', label: 'Tests', shortLabel: 'Tests' }
  ],
  final: [
    { id: 'cheatsheet', label: 'Cheatsheet', shortLabel: 'Cheatsheet' },
    { id: 'tests', label: 'Tests', shortLabel: 'Tests' },
    { id: 'interactive', label: 'Learn', shortLabel: 'Learn' }
  ]
};

export const DESTINATION_METADATA = {
  'programming:mid:cheatsheet': {
    course: 'programming',
    courseLabel: 'Programming',
    term: 'mid',
    termLabel: 'Mid-term',
    tool: 'cheatsheet',
    toolLabel: 'Cheatsheet',
    pathLabel: 'Programming / Mid-term / Cheatsheet',
    title: 'Mid-term Programming Cheatsheet',
    subtitle: 'Quick-reference syntax cards, runnable examples, and common pitfalls across Topics 1–7',
    badge: '84 Cards',
    isEmptyScaffold: false
  },
  'programming:mid:tests': {
    course: 'programming',
    courseLabel: 'Programming',
    term: 'mid',
    termLabel: 'Mid-term',
    tool: 'tests',
    toolLabel: 'Tests',
    pathLabel: 'Programming / Mid-term / Tests',
    title: 'Mid-term Programming Tests & Practice',
    subtitle: 'Mock Tests 1–4 and core Python coding exercises with instant Pyodide grading',
    badge: 'Mid-term',
    isEmptyScaffold: false
  },
  'programming:final:cheatsheet': {
    course: 'programming',
    courseLabel: 'Programming',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'cheatsheet',
    toolLabel: 'Cheatsheet',
    pathLabel: 'Programming / Final-term / Cheatsheet',
    title: 'Final-term Programming Cheatsheet',
    subtitle: 'Comprehensive reference for Python OOP, Exceptions, File I/O, NumPy, Pandas & SQL',
    badge: 'Reference',
    isEmptyScaffold: false
  },
  'programming:final:tests': {
    course: 'programming',
    courseLabel: 'Programming',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'tests',
    toolLabel: 'Tests',
    pathLabel: 'Programming / Final-term / Tests',
    title: 'Final-term Programming Tests & Quizzes',
    subtitle: 'Final-term Test 1, Mock Tests, Summer Course Test, Lecture Quizzes & Coding Practice',
    badge: 'Final-term',
    isEmptyScaffold: false
  },
  'programming:final:interactive': {
    course: 'programming',
    courseLabel: 'Programming',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'interactive',
    toolLabel: 'Learn',
    pathLabel: 'Programming / Final-term / Learn',
    title: 'Final-term Interactive Learning Notebooks',
    subtitle: 'Hands-on runnable Jupyter Notebooks (.ipynb) with live Pyodide execution and AI tutor',
    badge: '15 Labs',
    isEmptyScaffold: false
  },
  'database:mid:cheatsheet': {
    course: 'database',
    courseLabel: 'Database',
    term: 'mid',
    termLabel: 'Mid-term',
    tool: 'cheatsheet',
    toolLabel: 'Cheatsheet',
    pathLabel: 'Database / Mid-term / Cheatsheet',
    title: 'Database Mid-term Cheatsheet',
    subtitle: 'Database workspace is ready for future content.',
    emptyMessage: 'No cheatsheet entries available yet.',
    scaffoldDir: 'public/database/mid-term/cheatsheet',
    badge: 'Empty Scaffold',
    isEmptyScaffold: true
  },
  'database:mid:tests': {
    course: 'database',
    courseLabel: 'Database',
    term: 'mid',
    termLabel: 'Mid-term',
    tool: 'tests',
    toolLabel: 'Tests',
    pathLabel: 'Database / Mid-term / Tests',
    title: 'Database Mid-term Tests',
    subtitle: 'Database workspace is ready for future content.',
    emptyMessage: 'No tests available yet.',
    scaffoldDir: 'public/database/mid-term/tests',
    badge: 'Empty Scaffold',
    isEmptyScaffold: true
  },
  'database:final:cheatsheet': {
    course: 'database',
    courseLabel: 'Database',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'cheatsheet',
    toolLabel: 'Cheatsheet',
    pathLabel: 'Database / Final-term / Cheatsheet',
    title: 'Database Final-term Cheatsheet',
    subtitle: 'Database workspace is ready for future content.',
    emptyMessage: 'No cheatsheet entries available yet.',
    scaffoldDir: 'public/database/final-term/cheatsheet',
    badge: 'Empty Scaffold',
    isEmptyScaffold: true
  },
  'database:final:tests': {
    course: 'database',
    courseLabel: 'Database',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'tests',
    toolLabel: 'Tests',
    pathLabel: 'Database / Final-term / Tests',
    title: 'Database Final-term Tests',
    subtitle: 'Database workspace is ready for future content.',
    emptyMessage: 'No tests available yet.',
    scaffoldDir: 'public/database/final-term/tests',
    badge: 'Empty Scaffold',
    isEmptyScaffold: true
  },
  'database:final:interactive': {
    course: 'database',
    courseLabel: 'Database',
    term: 'final',
    termLabel: 'Final-term',
    tool: 'interactive',
    toolLabel: 'Learn',
    pathLabel: 'Database / Final-term / Learn',
    title: 'Database Final-term Interactive Learning',
    subtitle: 'Database workspace is ready for future content.',
    emptyMessage: 'No interactive learning modules available yet.',
    scaffoldDir: 'public/database/final-term/interactive-learning',
    badge: 'Empty Scaffold',
    isEmptyScaffold: true
  }
};

export const normalizeCourse = (rawCourse) => {
  if (!rawCourse) return null;
  const cleaned = String(rawCourse).toLowerCase().trim();
  if (cleaned === 'database' || cleaned === 'db') return 'database';
  if (cleaned === 'programming' || cleaned === 'prog' || cleaned === 'python') return 'programming';
  return null;
};

/**
 * Normalize legacy "last" / "last-term" / "final-term" values to canonical "mid" or "final".
 */
export const normalizeTerm = (rawTerm) => {
  if (!rawTerm) return null;
  const cleaned = String(rawTerm).toLowerCase().trim();
  if (cleaned === 'mid' || cleaned === 'mid-term' || cleaned === 'midterm') return 'mid';
  if (
    cleaned === 'final' ||
    cleaned === 'final-term' ||
    cleaned === 'finalterm' ||
    cleaned === 'last' ||
    cleaned === 'last-term' ||
    cleaned === 'lastterm'
  ) {
    return 'final';
  }
  return null;
};

/**
 * Resolve a valid tool for the given term.
 * Mid-term supports: cheatsheet, tests
 * Final-term supports: cheatsheet, tests, interactive
 * Legacy "lectures" requests map safely to "cheatsheet" (or "interactive" in Final-term if appropriate).
 */
export const resolveValidTool = (term, requestedTool) => {
  const normalizedTerm = normalizeTerm(term) || 'mid';
  const cleaned = String(requestedTool || '').toLowerCase().trim();
  if (cleaned === 'cheatsheets' || cleaned === 'lecture' || cleaned === 'lectures') {
    return 'cheatsheet';
  }
  if (cleaned === 'test' || cleaned === 'exams' || cleaned === 'practice') {
    return 'tests';
  }
  if (cleaned === 'learning' || cleaned === 'notebooks' || cleaned === 'interactive-learning') {
    return normalizedTerm === 'final' ? 'interactive' : 'tests';
  }
  const allowed = TOOLS_BY_TERM[normalizedTerm] || TOOLS_BY_TERM.mid;
  if (allowed.some((t) => t.id === cleaned)) {
    return cleaned;
  }
  return 'tests';
};

export const getDestinationMeta = (courseOrTerm, termOrTool, maybeTool) => {
  let c = 'programming';
  let t = 'mid';
  let tl = 'tests';

  if (maybeTool !== undefined) {
    c = normalizeCourse(courseOrTerm) || 'programming';
    t = normalizeTerm(termOrTool) || 'mid';
    tl = resolveValidTool(t, maybeTool);
  } else {
    t = normalizeTerm(courseOrTerm) || 'mid';
    tl = resolveValidTool(t, termOrTool);
  }
  return (
    DESTINATION_METADATA[`${c}:${t}:${tl}`] ||
    DESTINATION_METADATA[`programming:${t}:${tl}`] ||
    DESTINATION_METADATA['programming:mid:tests']
  );
};

export const getDestinationUrl = (courseOrTerm, termOrTool, maybeToolOrParams = {}, extraParams = {}) => {
  let c = 'programming';
  let t = 'mid';
  let tl = 'tests';
  let paramsObj = {};

  if (typeof maybeToolOrParams === 'string') {
    c = normalizeCourse(courseOrTerm) || 'programming';
    t = normalizeTerm(termOrTool) || 'mid';
    tl = resolveValidTool(t, maybeToolOrParams);
    paramsObj = extraParams || {};
  } else {
    c = 'programming';
    t = normalizeTerm(courseOrTerm) || 'mid';
    tl = resolveValidTool(t, termOrTool);
    paramsObj = maybeToolOrParams || {};
  }

  const params = new URLSearchParams();
  params.set('course', c);
  params.set('term', t);
  params.set('tool', tl);
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  });
  return `/?${params.toString()}`;
};

/**
 * Build path-grouped searchable items across Programming (real content) and Database (scaffold destinations only).
 */
export const buildSearchIndex = ({
  midtermCheatsheets = {},
  finalCheatsheets = {},
  lecturesManifest = [],
  problems = [],
  has2809Access = false
}) => {
  const items = [];
  const seenIds = new Set();

  const pushItem = (entry) => {
    if (!entry || !entry.id || seenIds.has(entry.id)) return;
    seenIds.add(entry.id);
    items.push(entry);
  };

  // 1. Course Workspace Destinations (Programming + Database Empty-State Scaffolds)
  Object.values(DESTINATION_METADATA).forEach((meta) => {
    pushItem({
      id: `dest:${meta.course}:${meta.term}:${meta.tool}`,
      course: meta.course,
      courseLabel: meta.courseLabel,
      term: meta.term,
      termLabel: meta.termLabel,
      tool: meta.tool,
      toolLabel: meta.toolLabel,
      groupPath: meta.pathLabel,
      title: meta.title,
      subtitle: meta.isEmptyScaffold ? meta.emptyMessage : meta.subtitle,
      badge: meta.badge,
      path: getDestinationUrl(meta.course, meta.term, meta.tool),
      isDestination: true,
      isEmptyScaffold: meta.isEmptyScaffold,
      keywords: `${meta.courseLabel} ${meta.termLabel} ${meta.toolLabel} ${meta.title} ${meta.subtitle}`.toLowerCase()
    });
  });

  // 2. Programming / Mid-term / Cheatsheet (Topics 1–7 & syntax cards)
  Object.values(midtermCheatsheets).forEach((topic) => {
    const totalCmds = (topic.categories || []).reduce((acc, c) => acc + (c.items?.length || 0), 0);
    pushItem({
      id: `prog:mid:cs:topic:${topic.lectureId}`,
      course: 'programming',
      courseLabel: 'Programming',
      term: 'mid',
      termLabel: 'Mid-term',
      tool: 'cheatsheet',
      toolLabel: 'Cheatsheet',
      groupPath: 'Programming / Mid-term / Cheatsheet',
      title: topic.title,
      subtitle: `${totalCmds} syntax commands — ${topic.subtitle || ''}`,
      badge: topic.lectureId,
      path: getDestinationUrl('programming', 'mid', 'cheatsheet', { filter: topic.lectureId }),
      keywords: `programming mid-term cheatsheet ${topic.lectureId} ${topic.title} ${topic.subtitle || ''}`.toLowerCase()
    });

    (topic.categories || []).forEach((cat) => {
      (cat.items || []).forEach((cmd, idx) => {
        pushItem({
          id: `prog:mid:cs:cmd:${topic.lectureId}:${cat.id}:${idx}`,
          course: 'programming',
          courseLabel: 'Programming',
          term: 'mid',
          termLabel: 'Mid-term',
          tool: 'cheatsheet',
          toolLabel: 'Cheatsheet',
          groupPath: 'Programming / Mid-term / Cheatsheet',
          title: `${cmd.title} (${cmd.syntax})`,
          subtitle: `${topic.title.split(':')[0]} • ${cat.name}`,
          badge: 'Syntax',
          path: getDestinationUrl('programming', 'mid', 'cheatsheet', { filter: topic.lectureId }),
          keywords: `programming mid-term cheatsheet ${topic.lectureId} ${cat.name} ${cmd.title} ${cmd.syntax} ${cmd.description || ''}`.toLowerCase()
        });
      });
    });
  });

  // 3. Programming / Final-term / Cheatsheet (Lectures 5–12 & syntax cards)
  Object.values(finalCheatsheets).forEach((sheet) => {
    const totalCmds = (sheet.categories || []).reduce((acc, c) => acc + (c.items?.length || 0), 0);
    pushItem({
      id: `prog:final:cs:sheet:${sheet.lectureId}`,
      course: 'programming',
      courseLabel: 'Programming',
      term: 'final',
      termLabel: 'Final-term',
      tool: 'cheatsheet',
      toolLabel: 'Cheatsheet',
      groupPath: 'Programming / Final-term / Cheatsheet',
      title: sheet.title,
      subtitle: `${totalCmds} reference commands — ${sheet.subtitle || ''}`,
      badge: sheet.lectureId,
      path: getDestinationUrl('programming', 'final', 'cheatsheet', { filter: sheet.lectureId }),
      keywords: `programming final-term cheatsheet ${sheet.lectureId} ${sheet.title} ${sheet.subtitle || ''}`.toLowerCase()
    });

    (sheet.categories || []).forEach((cat) => {
      (cat.items || []).forEach((cmd, idx) => {
        pushItem({
          id: `prog:final:cs:cmd:${sheet.lectureId}:${cat.id}:${idx}`,
          course: 'programming',
          courseLabel: 'Programming',
          term: 'final',
          termLabel: 'Final-term',
          tool: 'cheatsheet',
          toolLabel: 'Cheatsheet',
          groupPath: 'Programming / Final-term / Cheatsheet',
          title: `${cmd.title} (${cmd.syntax})`,
          subtitle: `${sheet.lectureId} • ${cat.name}`,
          badge: 'Syntax',
          path: getDestinationUrl('programming', 'final', 'cheatsheet', { filter: sheet.lectureId }),
          keywords: `programming final-term cheatsheet ${sheet.lectureId} ${cat.name} ${cmd.title} ${cmd.syntax} ${cmd.description || ''}`.toLowerCase()
        });
      });
    });
  });

  // 4. Programming / Final-term / Learn (Notebooks from lectures.json)
  if (Array.isArray(lecturesManifest)) {
    lecturesManifest.forEach((lecture) => {
      (lecture.notebooks || []).forEach((nb) => {
        pushItem({
          id: `prog:final:nb:${lecture.id}:${nb.id}`,
          course: 'programming',
          courseLabel: 'Programming',
          term: 'final',
          termLabel: 'Final-term',
          tool: 'interactive',
          toolLabel: 'Learn',
          groupPath: 'Programming / Final-term / Learn',
          title: nb.title,
          subtitle: `${lecture.id}: ${nb.description || lecture.title}`,
          badge: 'Notebook',
          path: `/learn/${lecture.id}/${nb.id}`,
          keywords: `programming final-term interactive learning learn notebook ${lecture.id} ${lecture.title} ${nb.title} ${nb.description || ''}`.toLowerCase()
        });
      });
    });
  }

  // 5. Programming / Mid-term & Final-term / Tests (Problems from ProblemsContext)
  if (Array.isArray(problems)) {
    problems.forEach((prob) => {
      const catLower = (prob.category || '').toLowerCase();
      if (catLower.includes('2809') && !has2809Access) return;
      const isFinal = catLower.includes('last-term') || catLower.includes('final');
      const termId = isFinal ? 'final' : 'mid';
      const termLabel = isFinal ? 'Final-term' : 'Mid-term';
      const displayCat = (prob.category || 'Practice').replace(/^Last-term/i, 'Final-term');

      pushItem({
        id: `prog:${termId}:test:${prob.id}`,
        course: 'programming',
        courseLabel: 'Programming',
        term: termId,
        termLabel,
        tool: 'tests',
        toolLabel: 'Tests',
        groupPath: `Programming / ${termLabel} / Tests`,
        title: prob.title,
        subtitle: `${displayCat}${prob.subCategory ? ` • ${prob.subCategory}` : ''}`,
        badge: prob.type === 'multiple_choice' ? 'Quiz' : 'Code',
        path: `/workspace/${prob.id}`,
        keywords: `programming ${termLabel} tests problem ${prob.title} ${displayCat} ${prob.subCategory || ''}`.toLowerCase()
      });
    });
  }

  return items;
};

/**
 * Filter and group search results by logical breadcrumb path (Course / Term / Tool).
 */
export const queryGroupedSearchResults = (allItems, rawQuery, limit = 18) => {
  const q = String(rawQuery || '').trim().toLowerCase();
  let matched = [];

  if (!q) {
    // When empty query, return the 10 core course/term/tool destinations + top notebooks/tests
    matched = allItems.filter((item) => item.isDestination).slice(0, 10);
  } else {
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const item of allItems) {
      if (tokens.every((tk) => item.keywords.includes(tk))) {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const pathLower = item.groupPath.toLowerCase();
        if (titleLower === q) score += 100;
        else if (titleLower.startsWith(q)) score += 60;
        else if (titleLower.includes(q)) score += 35;
        if (pathLower.includes(q)) score += 25;
        if (item.isDestination) score += 15;
        scored.push({ item, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    matched = scored.slice(0, limit).map((s) => s.item);
  }

  const groupsMap = new Map();
  const flatItems = [];

  matched.forEach((item) => {
    if (!groupsMap.has(item.groupPath)) {
      groupsMap.set(item.groupPath, {
        groupPath: item.groupPath,
        course: item.course,
        termLabel: item.termLabel,
        tool: item.tool,
        toolLabel: item.toolLabel,
        items: []
      });
    }
    const flatIndex = flatItems.length;
    const enriched = { ...item, flatIndex };
    groupsMap.get(item.groupPath).items.push(enriched);
    flatItems.push(enriched);
  });

  return {
    groups: Array.from(groupsMap.values()),
    flatItems
  };
};

const RECENT_STORAGE_KEY = 'zc_recent_activities_v2';

export const getRecentActivities = () => {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
};

export const recordRecentActivity = (activity) => {
  if (!activity || !activity.id || !activity.title) return;
  try {
    const existing = getRecentActivities().filter((item) => item.id !== activity.id);
    const next = [
      {
        ...activity,
        timestamp: Date.now()
      },
      ...existing
    ].slice(0, 6);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
};

export const TermProvider = ({ children }) => {
  const [activeCourse, setActiveCourseState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCourse = normalizeCourse(params.get('course'));
    if (urlCourse) return urlCourse;
    const saved = normalizeCourse(localStorage.getItem('active_course'));
    return saved || 'programming';
  });

  const [activeTerm, setActiveTermState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTerm = normalizeTerm(params.get('term'));
    if (urlTerm) return urlTerm;
    const saved = normalizeTerm(localStorage.getItem('active_term'));
    return saved || 'mid';
  });

  const [activeTool, setActiveToolState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTerm =
      normalizeTerm(params.get('term')) ||
      normalizeTerm(localStorage.getItem('active_term')) ||
      'mid';
    const urlTool = params.get('tool');
    if (urlTool) return resolveValidTool(initialTerm, urlTool);
    const savedTool = localStorage.getItem('active_tool');
    return resolveValidTool(initialTerm, savedTool || 'tests');
  });

  // Animated ZeroCoder Logo Transition state
  const [logoTransition, setLogoTransition] = useState({
    active: false,
    label: '',
    key: 0
  });
  const transitionTimerRef = useRef(null);

  const triggerLogoTransition = useCallback((label = 'Initializing Workspace') => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    if (prefersReducedMotion) {
      // Respect prefers-reduced-motion: immediate non-blocking state
      setLogoTransition({ active: false, label, key: Date.now() });
      return;
    }

    const nextKey = Date.now();
    setLogoTransition({
      active: true,
      label,
      key: nextKey
    });

    transitionTimerRef.current = setTimeout(() => {
      setLogoTransition((prev) => (prev.key === nextKey ? { ...prev, active: false } : prev));
    }, 280);
  }, []);

  // Trigger Login -> Home boot transition if sessionStorage flag was set during login
  useEffect(() => {
    try {
      const loginBoot = sessionStorage.getItem('zc_login_boot_transition');
      if (loginBoot === '1') {
        sessionStorage.removeItem('zc_login_boot_transition');
        triggerLogoTransition('ZeroCoder Home');
      }
    } catch {
      // Ignore sessionStorage errors
    }
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [triggerLogoTransition]);

  const setActiveCourse = useCallback((newCourse) => {
    const normalized = normalizeCourse(newCourse) || 'programming';
    setActiveCourseState(normalized);
    localStorage.setItem('active_course', normalized);
  }, []);

  const setActiveTerm = useCallback((newTerm) => {
    const normalized = normalizeTerm(newTerm) || 'mid';
    setActiveTermState(normalized);
    localStorage.setItem('active_term', normalized);
    setActiveToolState((prevTool) => {
      const nextTool = resolveValidTool(normalized, prevTool);
      localStorage.setItem('active_tool', nextTool);
      return nextTool;
    });
  }, []);

  const setActiveTool = useCallback((newTool, targetTerm) => {
    setActiveTermState((currentTerm) => {
      const termToUse = normalizeTerm(targetTerm) || currentTerm || 'mid';
      const validTool = resolveValidTool(termToUse, newTool);
      setActiveToolState(validTool);
      localStorage.setItem('active_tool', validTool);
      return currentTerm;
    });
  }, []);

  useEffect(() => {
    const normalizedCourse = normalizeCourse(activeCourse) || 'programming';
    localStorage.setItem('active_course', normalizedCourse);
    const normalizedTerm = normalizeTerm(activeTerm) || 'mid';
    localStorage.setItem('active_term', normalizedTerm);
    const validTool = resolveValidTool(normalizedTerm, activeTool);
    if (validTool !== activeTool) {
      setActiveToolState(validTool);
    }
    localStorage.setItem('active_tool', validTool);
  }, [activeCourse, activeTerm, activeTool]);

  const contextValue = useMemo(
    () => ({
      activeCourse,
      setActiveCourse,
      activeTerm,
      setActiveTerm,
      activeTool,
      setActiveTool,
      logoTransition,
      triggerLogoTransition
    }),
    [
      activeCourse,
      setActiveCourse,
      activeTerm,
      setActiveTerm,
      activeTool,
      setActiveTool,
      logoTransition,
      triggerLogoTransition
    ]
  );

  return (
    <TermContext.Provider value={contextValue}>
      {children}
    </TermContext.Provider>
  );
};

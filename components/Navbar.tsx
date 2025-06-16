import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import SearchOverlay from './SearchOverlay';
import Icon from './Icon';
import UserMenu from './UserMenu';
import TasksPanel from './TasksPanel';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface NavLink {
  href: string;
  icon: string;
  label: string;
}

interface Position {
  x: number;
  y: number;
}

interface EdgePosition {
  edge: 'left' | 'right' | 'top' | 'bottom';
  distance: number;
  position: Position;
}

const BUBBLE_SIZE = 48;
const PANEL_WIDTH = 280;
const PANEL_HEIGHT = 400;
const MARGIN = 16;
const PINNED_ICON_SIZE = 40;
const PINNED_GAP = 8;

export default function Navbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [position, setPosition] = useState<Position>({ x: MARGIN, y: MARGIN });
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [currentEdge, setCurrentEdge] = useState<'left' | 'right' | 'top' | 'bottom'>('left');
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const navLinks: NavLink[] = useMemo(() => [
    { href: '/', icon: 'house', label: 'Home' },
    { href: '/feed', icon: 'chat', label: 'Feed' },
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
    { href: '/full-report', icon: 'table-list', label: 'Full Report' },
    { href: '/van-state', icon: 'truck', label: 'Van State' },
    { href: '/users', icon: 'people', label: 'Users' },
    { href: '/messages', icon: 'chat-left', label: 'Messages' },
  ], []);

  const isActive = useCallback((href: string) => router.pathname === href, [router.pathname]);

  // Определение текущего края на основе позиции
  const determineCurrentEdge = useCallback((pos: Position): 'left' | 'right' | 'top' | 'bottom' => {
    if (windowSize.width === 0 || windowSize.height === 0) return 'left';
    
    const { width: winWidth, height: winHeight } = windowSize;
    
    const distances = [
      { edge: 'left' as const, distance: pos.x },
      { edge: 'right' as const, distance: winWidth - pos.x - BUBBLE_SIZE },
      { edge: 'top' as const, distance: pos.y },
      { edge: 'bottom' as const, distance: winHeight - pos.y - BUBBLE_SIZE }
    ];
    
    return distances.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    ).edge;
  }, [windowSize]);

  // Оптимизированное определение размеров окна
  useEffect(() => {
    const updateWindowSize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      
      resizeTimeoutRef.current = setTimeout(() => {
        const newSize = { width: window.innerWidth, height: window.innerHeight };
        setWindowSize(newSize);
        
        setPosition(prevPos => {
          const validatedPos = validatePosition(prevPos, newSize);
          const edge = determineCurrentEdge(validatedPos);
          setCurrentEdge(edge);
          return validatedPos;
        });
      }, 100);
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => {
      window.removeEventListener('resize', updateWindowSize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  // Загрузка сохраненных настроек
  useEffect(() => {
    try {
      const saved = localStorage.getItem('navBubble');
      if (saved) {
        const savedPosition = JSON.parse(saved);
        const validatedPos = validatePosition(savedPosition);
        setPosition(validatedPos);
        setCurrentEdge(determineCurrentEdge(validatedPos));
      }
      
      const pins = localStorage.getItem('pinnedLinks');
      if (pins) setPinned(JSON.parse(pins));
    } catch (error) {
      console.warn('Failed to load navigation settings:', error);
    }
  }, [windowSize]);

  // Валидация позиции
  const validatePosition = useCallback((pos: Position, size = windowSize): Position => {
    if (size.width === 0 || size.height === 0) return pos;

    const { width: winWidth, height: winHeight } = size;
    
    let newX = Math.max(MARGIN, Math.min(pos.x, winWidth - BUBBLE_SIZE - MARGIN));
    let newY = Math.max(MARGIN, Math.min(pos.y, winHeight - BUBBLE_SIZE - MARGIN));

    return { x: newX, y: newY };
  }, [windowSize]);

  // Snap-to-edge логика
  const snapToEdge = useCallback((point: { x: number; y: number }): { position: Position; edge: 'left' | 'right' | 'top' | 'bottom' } => {
    const { width: winWidth, height: winHeight } = windowSize;
    
    if (winWidth === 0 || winHeight === 0) {
      return { position: { x: MARGIN, y: MARGIN }, edge: 'left' };
    }

    const edges: EdgePosition[] = [
      {
        edge: 'left',
        distance: point.x,
        position: { x: MARGIN, y: Math.max(MARGIN, Math.min(point.y, winHeight - BUBBLE_SIZE - MARGIN)) }
      },
      {
        edge: 'right',
        distance: winWidth - point.x,
        position: { x: winWidth - BUBBLE_SIZE - MARGIN, y: Math.max(MARGIN, Math.min(point.y, winHeight - BUBBLE_SIZE - MARGIN)) }
      },
      {
        edge: 'top',
        distance: point.y,
        position: { x: Math.max(MARGIN, Math.min(point.x, winWidth - BUBBLE_SIZE - MARGIN)), y: MARGIN }
      },
      {
        edge: 'bottom',
        distance: winHeight - point.y,
        position: { x: Math.max(MARGIN, Math.min(point.x, winWidth - BUBBLE_SIZE - MARGIN)), y: winHeight - BUBBLE_SIZE - MARGIN }
      }
    ];

    const closest = edges.reduce((prev, current) => 
      current.distance < prev.distance ? current : prev
    );

    return { position: closest.position, edge: closest.edge };
  }, [windowSize]);

  // Обработчик завершения перетаскивания
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const { point } = info;
    const { position: newPosition, edge } = snapToEdge(point);
    
    setPosition(newPosition);
    setCurrentEdge(edge);
    setIsDragging(false);
    
    try {
      localStorage.setItem('navBubble', JSON.stringify(newPosition));
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
  }, [snapToEdge]);

  // Получение позиции панели с правильным направлением для bottom edge
  const getPanelPosition = useCallback(() => {
    switch (currentEdge) {
      case 'left':
        return {
          left: BUBBLE_SIZE + PINNED_GAP,
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          right: BUBBLE_SIZE + PINNED_GAP,
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'top':
        return {
          top: BUBBLE_SIZE + PINNED_GAP,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          bottom: BUBBLE_SIZE + PINNED_GAP,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      default:
        return {
          left: BUBBLE_SIZE + PINNED_GAP,
          top: '50%',
          transform: 'translateY(-50%)',
        };
    }
  }, [currentEdge]);

  // Получение позиции закрепленных элементов
  const getPinnedPosition = useCallback(() => {
    const isHorizontalEdge = currentEdge === 'top' || currentEdge === 'bottom';
    
    if (isHorizontalEdge) {
      return {
        className: `absolute flex gap-2 ${currentEdge === 'top' ? 'top-14' : 'bottom-14'} left-1/2 -translate-x-1/2`,
        direction: 'horizontal' as const
      };
    } else {
      return {
        className: `absolute flex flex-col gap-2 ${currentEdge === 'left' ? 'left-14' : 'right-14'} top-1/2 -translate-y-1/2`,
        direction: 'vertical' as const
      };
    }
  }, [currentEdge]);

  // Переключение закрепления
  const togglePin = useCallback((href: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setPinned(prev => {
      const isCurrentlyPinned = prev.includes(href);
      const newPinned = isCurrentlyPinned 
        ? prev.filter(p => p !== href)
        : [...prev, href].slice(0, 6);
      
      try {
        localStorage.setItem('pinnedLinks', JSON.stringify(newPinned));
      } catch (error) {
        console.warn('Failed to save pinned links:', error);
      }
      
      return newPinned;
    });
  }, []);

  // Обработчики наведения
  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, 150);
  }, []);

  // Закрытие панели при клике вне её
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const bubbleElement = document.querySelector('[data-bubble="true"]');
        if (bubbleElement && !bubbleElement.contains(event.target as Node)) {
          setNavOpen(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavOpen(false);
        setSearchOpen(false);
        setTasksOpen(false);
      }
    };

    if (navOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [navOpen]);

  // Мемоизированные закрепленные ссылки
  const pinnedLinks = useMemo(() => 
    pinned
      .map(href => navLinks.find(link => link.href === href))
      .filter((link): link is NavLink => !!link),
    [pinned, navLinks]
  );

  const pinnedPosition = getPinnedPosition();

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          left: MARGIN,
          right: windowSize.width - BUBBLE_SIZE - MARGIN,
          top: MARGIN,
          bottom: windowSize.height - BUBBLE_SIZE - MARGIN
        }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={position}
        transition={{ type: "tween", duration: 0.2 }}
        className="fixed z-50 select-none"
        style={{ touchAction: 'none' }}
        data-bubble="true"
      >
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          {/* Главная кнопка - полупрозрачная в покое, непрозрачная при hover */}
          <div
            className={`w-12 h-12 rounded-full bg-white/70 dark:bg-gray-800/70 shadow-lg border border-gray-200/50 dark:border-gray-600/50 flex items-center justify-center cursor-pointer transition-all duration-200 ${
              hovered || navOpen 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 scale-105' 
                : ''
            } ${
              navOpen 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => !isDragging && setNavOpen(prev => !prev)}
          >
            <div
              style={{
                transform: `rotate(${navOpen ? 45 : 0}deg)`,
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <Icon 
                name={navOpen ? "x" : "list"} 
                className={`w-6 h-6 transition-colors duration-200 ${
                  navOpen 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Закрепленные ссылки при наведении */}
          <AnimatePresence>
            {hovered && !navOpen && !isDragging && pinnedLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={pinnedPosition.className}
              >
                {pinnedLinks.map(({ href, icon, label }) => (
                  <div key={href}>
                    <Link 
                      href={href} 
                      className={`w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md border border-gray-200/50 dark:border-gray-600/50 flex items-center justify-center transition-all duration-150 hover:scale-105 hover:bg-white dark:hover:bg-gray-800 ${
                        isActive(href)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                          : 'hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      aria-label={label}
                    >
                      <Icon 
                        name={icon} 
                        className={`w-5 h-5 ${
                          isActive(href)
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      />
                    </Link>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Основная навигационная панель */}
          <AnimatePresence>
            {navOpen && (
              <motion.aside
                ref={panelRef}
                initial={{ 
                  opacity: 0, 
                  scale: 0.95,
                  ...(currentEdge === 'top' && { y: -10 }),
                  ...(currentEdge === 'bottom' && { y: 10 }),
                  ...(currentEdge === 'left' && { x: -10 }),
                  ...(currentEdge === 'right' && { x: 10 })
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.95 
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={getPanelPosition()}
                className={`absolute bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden ${
                  currentEdge === 'top' || currentEdge === 'bottom' ? 'w-80' : 'w-70'
                }`}
              >
                <div className="p-4 h-96 flex flex-col">
                  {/* Логотип - убрано dark:invert для правильного отображения */}
                  <div className="mb-6">
                    <Link href="/" className="flex items-center gap-3 px-2 group">
                      <div className="relative overflow-hidden rounded-lg">
                        <Image
                          src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg"
                          alt="Proovia Logo"
                          width={120}
                          height={32}
                          className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => (e.currentTarget.src = '/fallback-logo.png')}
                        />
                      </div>
                    </Link>
                  </div>

                  {/* Навигационные ссылки */}
                  <nav className="flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
                    {navLinks.map(({ href, icon, label }) => {
                      const isPinned = pinned.includes(href);
                      const active = isActive(href);
                      
                      return (
                        <div key={href} className="relative group">
                          <Link
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative ${
                              active
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <Icon name={icon} className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1 truncate">{label}</span>
                            {active && (
                              <div className="absolute right-2 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                            )}
                          </Link>
                          
                          <button
                            onClick={(e) => togglePin(href, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity duration-150 z-10"
                            aria-label={isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Icon 
                              name={isPinned ? 'star-fill' : 'star'} 
                              className={`w-4 h-4 ${
                                isPinned 
                                  ? 'text-yellow-500 dark:text-yellow-400' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`} 
                            />
                          </button>
                        </div>
                      );
                    })}
                  </nav>

                  {/* Нижняя панель инструментов */}
                  <div className="flex items-center justify-between p-3 mt-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 rounded-lg">
                    <div className="flex items-center gap-1">
                      <ThemeToggle />
                      <NotificationCenter />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSearchOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                        aria-label="Open search"
                      >
                        <Icon name="search" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => setTasksOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                        aria-label="Open tasks"
                      >
                        <Icon name="check" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                      <UserMenu />
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }

        @media (prefers-color-scheme: dark) {
          .custom-scrollbar {
            scrollbar-color: rgba(75, 85, 99, 0.7) transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(75, 85, 99, 0.7);
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(75, 85, 99, 0.9);
          }
        }
      `}</style>
    </>
  );
}
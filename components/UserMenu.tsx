import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

export default function UserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  
  const username = useUser();
  // Проверяем, что username не пустая строка и не null/undefined
  const isAuthenticated = username && username.trim() !== '';
  
  const { data, error } = useFetch<{ users: any[] }>(isAuthenticated ? '/api/users' : null);
  const userInfo = data?.users?.find((u: any) => u?.username === username);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      // Закрываем меню и перенаправляем
      setOpen(false);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Если пользователь не авторизован - показываем кнопку входа
  if (!isAuthenticated) {
    return (
      <Link 
        href="/auth/login" 
        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" 
        title="Войти в систему"
      >
        <Icon name="box-arrow-in-right" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </Link>
    );
  }

  // Если есть ошибка при загрузке данных пользователя
  if (error) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 bg-red-50 border border-red-200"
          title="Ошибка загрузки данных пользователя"
        >
          <Icon name="exclamation-triangle" className="w-6 h-6 text-red-500" />
        </button>
        
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
            <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
              Ошибка загрузки данных
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon name="box-arrow-right" className="w-4 h-4 mr-3" />
              Выйти
            </button>
          </div>
        )}
      </div>
    );
  }

  // Показываем индикатор загрузки, если данные еще не загружены
  if (!data) {
    return (
      <div className="p-2 rounded-full" title="Загрузка данных пользователя...">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400"></div>
      </div>
    );
  }

  // Основной интерфейс для авторизованного пользователя
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Меню пользователя"
        aria-expanded={open}
        type="button"
      >
        {userInfo?.photo ? (
          <img
            src={userInfo.photo}
            alt={`Аватар ${userInfo.name || username}`}
            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            onError={(e) => {
              // При ошибке загрузки показываем иконку
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                const fallbackIcon = parent.querySelector('.fallback-icon') as HTMLElement;
                if (fallbackIcon) {
                  fallbackIcon.style.display = 'block';
                }
              }
            }}
          />
        ) : (
          <Icon name="person-circle" className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        )}
        
        {/* Fallback иконка для случая ошибки загрузки фото */}
        {userInfo?.photo && (
          <Icon 
            name="person-circle" 
            className="fallback-icon w-8 h-8 text-gray-600 dark:text-gray-400" 
            style={{ display: 'none' }}
          />
        )}
      </button>

      {/* Выпадающее меню */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {/* Информация о пользователе */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {userInfo?.photo ? (
                <img
                  src={userInfo.photo}
                  alt={`Аватар ${userInfo.name || username}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon name="person" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {userInfo?.name || userInfo?.displayName || username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{username}
                </p>
              </div>
            </div>
          </div>

          {/* Навигационные ссылки */}
          <div className="py-1">
            <Link
              href={`/profile/${username}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Icon name="person" className="w-4 h-4 mr-3 text-gray-400" />
              Профиль
            </Link>
            
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Icon name="gear" className="w-4 h-4 mr-3 text-gray-400" />
              Настройки
            </Link>
          </div>
          
          {/* Разделитель */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          {/* Кнопка выхода */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            type="button"
          >
            <Icon name="box-arrow-right" className="w-4 h-4 mr-3" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
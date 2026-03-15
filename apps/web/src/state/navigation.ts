export type UserRole = 'ORGANIZER' | 'LEADER' | 'NAVIGATOR'

export type TopNavItem = {
  label: string
  shortLabel?: string
  path: string
  match: string[]
  requiresAuth?: boolean
  roles?: UserRole[]
}

export type SubMenuItem = {
  label: string
  anchor?: string
  roles?: UserRole[]
}

export const topNavItems: TopNavItem[] = [
  { label: 'Главная', path: '/home', match: ['/home'] },
  {
    label: 'Мои цели',
    shortLabel: 'Цели',
    path: '/goals/my',
    match: ['/goals'],
    requiresAuth: true,
    roles: ['NAVIGATOR']
  },
  {
    label: 'Мои специальности',
    shortLabel: 'Спец.',
    path: '/specialties/my',
    match: ['/specialties'],
    requiresAuth: true,
    roles: ['NAVIGATOR']
  },
  {
    label: 'Мои достижения',
    shortLabel: 'Достижения',
    path: '/achievements',
    match: ['/achievements'],
    requiresAuth: true,
    roles: ['NAVIGATOR']
  },
  {
    label: 'Хатка бобра',
    shortLabel: 'Хатка',
    path: '/beaver-hut',
    match: ['/beaver-hut'],
    requiresAuth: true,
    roles: ['NAVIGATOR', 'ORGANIZER']
  },
  {
    label: 'Чат',
    path: '/chat',
    match: ['/chat'],
    requiresAuth: true,
    roles: ['NAVIGATOR', 'LEADER']
  },
  {
    label: 'Профиль',
    path: '/profile',
    match: ['/profile'],
    requiresAuth: true
  },
  {
    label: 'Руководитель',
    shortLabel: 'Рук.',
    path: '/leader',
    match: ['/leader'],
    requiresAuth: true,
    roles: ['LEADER']
  },
  {
    label: 'Организатор',
    shortLabel: 'Орг.',
    path: '/organizer',
    match: ['/organizer'],
    requiresAuth: true,
    roles: ['ORGANIZER']
  },
  {
    label: 'Дополнительно',
    shortLabel: 'Доп.',
    path: '/extra',
    match: ['/extra']
  }
]

export const subMenus: Array<{ prefix: string; items: SubMenuItem[] }> = [
  {
    prefix: '/auth/team',
    items: [
      { label: 'Вход', anchor: 'auth-team-login' },
      { label: 'Регистрация команды', anchor: 'auth-team-register' },
      { label: 'Справка', anchor: 'auth-team-help' }
    ]
  },
  {
    prefix: '/auth/user',
    items: [
      { label: 'Вход', anchor: 'auth-user-login' },
      { label: 'Регистрация пользователя', anchor: 'auth-user-register' },
      { label: 'Справка', anchor: 'auth-user-help' }
    ]
  },
  {
    prefix: '/home',
    items: [
      { label: 'О проекте', anchor: 'home-welcome' },
      { label: 'Сферы развития', anchor: 'home-welcome', roles: ['LEADER', 'NAVIGATOR'] }
    ]
  },
  {
    prefix: '/profile',
    items: [
      { label: 'Профиль', anchor: 'profile-data' },
      { label: 'Смена пароля', anchor: 'profile-password' },
      { label: 'Переходы', anchor: 'profile-links' }
    ]
  },
  {
    prefix: '/goals/catalog',
    items: [
      { label: 'Возраст', anchor: 'goals-age' },
      { label: 'Сферы', anchor: 'goals-spheres' },
      { label: 'Компетентности', anchor: 'goals-competencies' },
      { label: 'Цели', anchor: 'goals-targets' },
      { label: 'Выбор (до 12)', anchor: 'goals-submit' }
    ]
  },
  {
    prefix: '/goals/my',
    items: [
      { label: 'Список', anchor: 'goals-list' },
      { label: 'Прогресс', anchor: 'goals-progress' },
      { label: 'Комментарии', anchor: 'goals-comments' }
    ]
  },
  {
    prefix: '/specialties/catalog',
    items: [
      { label: 'Области', anchor: 'specialties-areas' },
      { label: 'Видео', anchor: 'specialties-video' },
      { label: 'Специальности', anchor: 'specialties-list' },
      { label: 'Уровень', anchor: 'specialties-level' }
    ]
  },
  {
    prefix: '/specialties/my',
    items: [
      { label: 'Чек-лист', anchor: 'specialties-checklist' },
      { label: 'Материалы', anchor: 'specialties-materials' },
      { label: 'Статусы', anchor: 'specialties-status' }
    ]
  },
  {
    prefix: '/achievements',
    items: [
      { label: 'Статус', anchor: 'achievements-status' },
      { label: 'Этап', anchor: 'achievements-stage' },
      { label: 'Специальности', anchor: 'achievements-specialties' }
    ]
  },
  {
    prefix: '/beaver-hut',
    items: [
      { label: 'Жёлуди', anchor: 'beaver-acorns' },
      { label: 'Веточки', anchor: 'beaver-twigs' },
      { label: 'Поленья', anchor: 'beaver-logs' },
      { label: 'Корректировки', anchor: 'beaver-adjustments', roles: ['ORGANIZER'] }
    ]
  },
  {
    prefix: '/chat',
    items: [
      { label: 'Лента', anchor: 'chat-feed' },
      { label: 'Реакции', anchor: 'chat-reactions' },
      { label: 'Отправка', anchor: 'chat-compose' }
    ]
  },
  {
    prefix: '/extra',
    items: [
      { label: 'Условия использования', anchor: 'extra-terms' },
      { label: 'Конфиденциальность', anchor: 'extra-privacy' },
      { label: 'Онлайн-консультант', anchor: 'extra-chat' }
    ]
  },
  {
    prefix: '/organizer',
    items: [
      { label: 'Подтверждения', anchor: 'organizer-approvals' },
      { label: 'Анонсы', anchor: 'organizer-announcements' },
      { label: 'Консультант', anchor: 'organizer-appeals' }
    ]
  },
  {
    prefix: '/leader',
    items: [
      { label: 'Участники', anchor: 'leader-users' },
      { label: 'Цели', anchor: 'leader-goals' },
      { label: 'Создать команду', anchor: 'leader-create-team' }
    ]
  }
]

export type ScreenConfig = {
  path: string
  title: string
  description: string
  badges?: string[]
  showLogos?: boolean
}

export const screenConfigs: ScreenConfig[] = [
  {
    path: '/auth/team',
    title: 'Авторизация / Регистрация команды',
    description: 'Вход и регистрация команды после подтверждения организатором.',
    badges: ['Населенный пункт', 'Учреждение', 'Название команды']
  },
  {
    path: '/auth/user',
    title: 'Авторизация / Регистрация пользователя',
    description: 'Регистрация участника в команду с подтверждением руководителя.',
    badges: ['Фамилия и имя', 'Дата рождения', 'Выбор команды']
  },
  {
    path: '/home',
    title: 'Главная',
    description: 'Логотип проекта, описание движения и быстрые переходы к сферам развития.',
    badges: ['Логотип проекта', 'Описание', 'Сферы развития'],
    showLogos: true
  },
  {
    path: '/profile',
    title: 'Личный кабинет',
    description: 'Профиль пользователя, смена пароля и быстрые переходы.',
    badges: ['Данные профиля', 'Безопасность', 'Переходы']
  },
  {
    path: '/goals/catalog',
    title: 'Каталог целей',
    description: 'Выберите возрастную группу, сферу и цели для развития.',
    badges: ['Возраст', 'Сфера', 'Компетентность', 'Цели']
  },
  {
    path: '/goals/my',
    title: 'Мои цели',
    description: 'Список целей, отметка прогресса и идеи активностей.',
    badges: ['Прогресс 1 раз в неделю', 'Комментарий', 'Ссылка на активности']
  },
  {
    path: '/specialties/catalog',
    title: 'Каталог специальностей',
    description: 'Выберите одну активную специальность и уровень.',
    badges: ['Область', 'Видео', 'Специальность', 'Уровень']
  },
  {
    path: '/specialties/my',
    title: 'Мои специальности',
    description: 'Чек-лист прогресса и материалы по выбранной специальности.',
    badges: ['Чек-лист', 'Материалы', 'Статусы']
  },
  {
    path: '/achievements',
    title: 'Мои достижения',
    description: 'Статус по возрасту, этапы и уровни специальностей.',
    badges: ['Возрастной статус', 'Этап', 'Уровни']
  },
  {
    path: '/beaver-hut',
    title: 'Хатка бобра',
    description: 'Жёлуди, веточки и поленья за личные и командные достижения.',
    badges: ['Жёлуди', 'Веточки', 'Поленья']
  },
  {
    path: '/chat',
    title: 'Чат команды',
    description: 'Командное общение, реакции и авто-сообщения.',
    badges: ['Сообщения', 'Реакции', 'Авто-события']
  },
  {
    path: '/extra',
    title: 'Дополнительно',
    description: 'Условия использования, конфиденциальность и консультант.',
    badges: ['Условия', 'Конфиденциальность', 'Онлайн-консультант']
  },
  {
    path: '/organizer',
    title: 'Панель организатора',
    description: 'Управление подтверждениями, анонсами и командными начислениями.',
    badges: ['Подтверждения', 'Анонсы', 'Начисления']
  },
  {
    path: '/leader',
    title: 'Панель руководителя',
    description: 'Подтверждения команды и создание новой команды.',
    badges: ['Участники', 'Цели', 'Команда']
  }
]

export function getSubMenu(pathname: string, role?: UserRole | null) {
  const match = subMenus.find((item) => pathname.startsWith(item.prefix))
  const items = match?.items?.filter((item) => !item.roles || (role ? item.roles.includes(role) : false))
  return (
    items ?? [
      { label: 'Навигация' },
      { label: 'Содержимое' },
      { label: 'Действия' }
    ]
  )
}

export function getVisibleTopNavItems(role: UserRole | null | undefined, isAuthenticated: boolean) {
  return topNavItems.filter((item) => {
    if (role === 'NAVIGATOR' && item.path === '/extra') {
      return false
    }
    if (item.requiresAuth && !isAuthenticated) {
      return false
    }
    if (item.roles && (!role || !item.roles.includes(role))) {
      return false
    }
    return true
  })
}

export function getScreenConfig(pathname: string) {
  return screenConfigs.find((screen) => screen.path === pathname)
}

export function getScreenTitle(pathname: string) {
  return getScreenConfig(pathname)?.title ?? 'Экран'
}

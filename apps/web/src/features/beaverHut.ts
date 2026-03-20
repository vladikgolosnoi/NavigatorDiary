export const branchTypeLabels: Record<string, string> = {
  PARTICIPATION: 'Участие в мероприятии',
  ACTIVE_PARTICIPATION: 'Активное участие',
  WIN: 'Победа'
}

export const levelLabels: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

export const branchAmountLabels: Record<string, string> = {
  PARTICIPATION: '10 желудей',
  ACTIVE_PARTICIPATION: '15 желудей',
  WIN: '20 желудей'
}

export const resourceLabels: Record<'ACORN' | 'TWIG' | 'LOG', string> = {
  ACORN: 'Веточки',
  TWIG: 'Жёлуди',
  LOG: 'Поленья'
}

export const resourceDescriptions: Record<'ACORN' | 'TWIG' | 'LOG', string> = {
  ACORN: 'Собирая веточки, вы получаете новые статусы и идете к успеху.',
  TWIG: 'Собранные жёлуди вы можете потратить на атрибутику, сувениры и другие бонусы от организаторов проекта.',
  LOG: 'Собранные поленья позволяют принимать участие в мастер-классах от мастеров специальностей и мероприятиях партнёров.'
}

export type BeaverHutData = {
  acorns: number
  twigs: number
  logs: number
  achievedGoalsCount: number
  completedSpecialties: { id: string; specialty: string; level: string; completedAt?: string | null }[]
  twigAwards: {
    id: string
    type: string
    amount: number
    note?: string | null
    createdAt: string
    organizer?: string | null
  }[]
  adjustments: {
    id: string
    resourceType: 'ACORN' | 'TWIG' | 'LOG'
    amount: number
    note?: string | null
    createdAt: string
    organizer?: string | null
  }[]
}

export function getBeaverSummaryCards(data: BeaverHutData | null) {
  return [
    {
      id: 'beaver-status',
      title: resourceLabels.ACORN,
      value: data?.acorns ?? 0,
      note: resourceDescriptions.ACORN
    },
    {
      id: 'beaver-bonus',
      title: resourceLabels.TWIG,
      value: data?.twigs ?? 0,
      note: resourceDescriptions.TWIG
    },
    {
      id: 'beaver-logs',
      title: resourceLabels.LOG,
      value: data?.logs ?? 0,
      note: resourceDescriptions.LOG
    }
  ]
}

export function scrollToSectionById(sectionId: string, extraOffset = 12) {
  if (typeof window === 'undefined') {
    return
  }

  const section = document.getElementById(sectionId)
  if (!section) {
    return
  }

  const topNav = document.querySelector('.top-nav') as HTMLElement | null
  const subNav = document.querySelector('.sub-nav') as HTMLElement | null

  let topOffset = 0

  if (topNav) {
    topOffset = Math.max(topOffset, topNav.getBoundingClientRect().bottom)
  }

  if (subNav) {
    const subNavRect = subNav.getBoundingClientRect()
    const subNavInViewportTop =
      subNavRect.top <= topOffset && subNavRect.bottom > 0
    if (subNavInViewportTop) {
      topOffset = Math.max(topOffset, subNavRect.bottom)
    }
  }

  const targetY = section.getBoundingClientRect().top + window.scrollY - (topOffset + extraOffset)
  window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
}

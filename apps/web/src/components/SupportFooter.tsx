import supportLogo from '../assets/brand/pgrants-horizontal.png'

export function SupportFooter() {
  return (
    <footer className="support-footer">
      <div className="support-footer__inner">
        <div className="support-footer__copy">
          <span className="support-footer__eyebrow">Поддержка проекта</span>
          <strong>Разработано при поддержке Фонда президентских грантов</strong>
        </div>
        <img src={supportLogo} alt="При поддержке Фонда президентских грантов" />
      </div>
    </footer>
  )
}

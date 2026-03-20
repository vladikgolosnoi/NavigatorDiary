import supportLogo from '../assets/brand/pgrants-horizontal.png'

export function SupportFooter() {
  return (
    <footer className="support-footer">
      <div className="support-footer__inner">
        <img src={supportLogo} alt="При поддержке Фонда президентских грантов" />
      </div>
    </footer>
  )
}

import { LogoCluster } from '../components/LogoCluster'
import { useAuth } from '../state/auth'

const sphereLinks = {
  intellectual: 'https://rsdmo.ru/page95471836.html',
  physical: 'https://rsdmo.ru/page80881566.html',
  emotional: 'https://rsdmo.ru/page97984836.html',
  social: 'https://rsdmo.ru/page81393986.html',
  spiritual: 'https://rsdmo.ru/page81357916.html',
  character: 'https://rsdmo.ru/page81356256.html'
} as const

const projectLink = 'https://rsdmo.ru/page77671096.html'

export function HomePage() {
  const { auth } = useAuth()
  const showSphereLinks = auth.user?.role === 'LEADER' || auth.user?.role === 'NAVIGATOR'

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Главная</h1>
          <p>
            Приветствуем вас в движении &laquo;Дружина навигаторов&raquo;. Участвовать легко,
            соберите команду навигаторов в составе от 7 до 9 человек и 1 взрослого. Участники
            команд организуют активности и выполняют вызовы, развивая личные качества,
            приобретая полезные навыки и просто веселясь. Активности можно выбрать по сферам
            развития, исходя из интересов навигаторов.
          </p>
        </div>
      </header>

      <div id="home-welcome">
        <LogoCluster
          showIcons={showSphereLinks}
          sphereLinks={showSphereLinks ? sphereLinks : undefined}
          mainLink={projectLink}
        />
      </div>
    </section>
  )
}

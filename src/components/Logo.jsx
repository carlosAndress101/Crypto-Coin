import { Link } from "react-router-dom"
import logoSvg from '../assets/logo.svg'

function Logo() {
  return (
    <Link to='/' className="absolute top-[1.5rem] left-[1.5rem] [text-decoration:none] text-lg text-cyan flex items-center">
        <img src={logoSvg} alt="logoCryptoSH1FT3R" />
        <span>CrytoSh1ft3r</span>
    </Link>
  )
}

export default Logo
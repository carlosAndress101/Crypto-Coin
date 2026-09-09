import { Link } from "react-router"
import logoCoin from '../assets/logo.png';

function Logo() {
  return (
    <Link to='/' className="absolute top-[1.5rem] left-[1.5rem] [text-decoration:none] text-lg text-accent flex items-center">
        <img src={logoCoin} alt="logoCryptoSH1FT3R" className="w-[3rem] sm:w-[4rem]"/>
        <span>CryptoCoin</span>
    </Link>
  )
}

export default Logo
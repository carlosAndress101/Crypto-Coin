import { Link } from "react-router-dom"
import logoCoin from '../assets/new cryptocoin bg void.png';

function Logo() {
  return (
    <Link to='/' className="absolute top-[1.5rem] left-[1.5rem] [text-decoration:none] text-lg text-cyan flex items-center">
        <img src={logoCoin} alt="logoCryptoSH1FT3R" className="w-[3rem] sm:w-[4rem]"/>
        <span>CryptoCoin</span>
    </Link>
  )
}

export default Logo
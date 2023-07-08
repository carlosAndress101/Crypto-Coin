import { Outlet } from "react-router-dom"
import Fillters from "../components/Fillters"
import TableComponent from "../components/TableComponent"

const Crypto = () => {
  return (
    <section className="w-[80%] h-full flex flex-col mt-16 mb-24 relative">
      <Fillters/>
      <TableComponent/>
      <Outlet/>
    </section>
  )
}

export default Crypto

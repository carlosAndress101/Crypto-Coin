import { NavLink } from "react-router";

function Navegation() {
  return (
    <nav className="w-[40%] mt-16 flex justify-around align-middle border border-accent rounded-lg lg:w-[40%] sm:w-[80%] w-[90%] flex justify-around align-middle lg:mt-16 sm:mt-24 mt-20 border border-solid border-accent sm:rounded-lg rounded-md">
      <NavLink
        to="/"
        className={({isActive}) => {
          return `w-full text-base text-center font-nunito m-2.5 
                ${isActive ? 'bg-accent text-fg-inverse' : 'bg-surface-control text-fg-muted hover:text-accent active:bg-accent active:text-fg-inverse' }
                  
                 border-0 cursor-pointer rounded capitalize font-semibold`;
        }}
      >
        Crypto
      </NavLink>
      <NavLink
        to="/trending"
        end
        className={({isActive}) => {
            return `w-full text-base text-center font-nunito m-2.5 
                  ${isActive ? 'bg-accent text-fg-inverse' : 'bg-surface-control text-fg-muted hover:text-accent active:bg-accent active:text-fg-inverse' }
                    
                   border-0 cursor-pointer rounded capitalize font-semibold`;
          }}
      >
        Trending 
      </NavLink>
      <NavLink
        to="/saved"
        className={({isActive}) => {
            return `w-full text-base text-center font-nunito m-2.5 
                  ${isActive ? 'bg-accent text-fg-inverse' : 'bg-surface-control text-fg-muted hover:text-accent active:bg-accent active:text-fg-inverse' }
                    
                   border-0 cursor-pointer rounded capitalize font-semibold`;
          }}
      >
        Saved
      </NavLink>
    </nav>
  );
}

export default Navegation;

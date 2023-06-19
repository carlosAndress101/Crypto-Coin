import { useLayoutEffect } from "react";
import { createContext, useState } from "react";

//create context objet
export const CryptoContext = createContext({});

//create the provider component
// eslint-disable-next-line react/prop-types
export const CryptoProvider = ({ children }) => {
  const [cryptoData, setCryptoData] = useState();
  const [searchData, setSearchData] = useState();
  const [coinSearch, setCoinSearch] = useState("");


  const getCryptoData = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_URL);
      const data = await response.json();
      setCryptoData(data);    
    } catch (error) {
      console.error(error);
    }
  };

  const getSearchResult = async (query) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SEARCH}${query}`);
      const data = await response.json();
      setSearchData(data.coins);    
    } catch (error) {
      console.error(error);
    }
  };

  useLayoutEffect(() => {
    getCryptoData();
  }, [coinSearch]);


  return (
    <CryptoContext.Provider value={{ cryptoData, searchData, getSearchResult, setCoinSearch, setSearchData }}>
      {children}
    </CryptoContext.Provider>
  );
};

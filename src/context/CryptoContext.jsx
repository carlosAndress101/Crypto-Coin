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
  const [currency, setCurrency] = useState("usd");
  const [sortBy, setSortBy] = useState("market_cap_desc");


  const getCryptoData = async () => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${coinSearch}&order=${sortBy}&per_page=10&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d&locale=en`);
      const data = await response.json();
      setCryptoData(data);    
    } catch (error) {
      console.error(error);
    }
  };

  const getSearchResult = async (query) => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
      const data = await response.json();
      setSearchData(data.coins);    
    } catch (error) {
      console.error(error);
    }
  };

  useLayoutEffect(() => {
    getCryptoData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinSearch, currency, sortBy]);


  return (
    <CryptoContext.Provider value={{ cryptoData, searchData, getSearchResult, setCoinSearch, setSearchData, currency, setCurrency, sortBy, setSortBy }}>
      {children}
    </CryptoContext.Provider>
  );
};

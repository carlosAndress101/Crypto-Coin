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
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(250);
  const [perPage, setPerPage] = useState(10);

  const getCryptoData = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/list`
      );
      const data = await response.json();
      setTotalPage(data.length);
    } catch (error) {
      console.error(error);
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${coinSearch}&order=${sortBy}&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=1h%2C24h%2C7d&locale=en`
      );
      const data = await response.json();
      setCryptoData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getSearchResult = async (query) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );
      const data = await response.json();
      setSearchData(data.coins);
    } catch (error) {
      console.error(error);
    }
  };

  const resetFunction = () => {
    setPage(1);
    setCoinSearch("");
  };

  useLayoutEffect(() => {
    getCryptoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinSearch, currency, sortBy, page, perPage]);

  return (
    <CryptoContext.Provider
      value={{
        cryptoData,
        searchData,
        getSearchResult,
        setCoinSearch,
        setSearchData,
        currency,
        setCurrency,
        sortBy,
        setSortBy,
        page,
        setPage,
        totalPage,
        resetFunction,
        setPerPage,
        perPage
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

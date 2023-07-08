import { createContext, useLayoutEffect, useState } from "react";

// create context object
export const TrendingContext = createContext({});

// create the provider component
// eslint-disable-next-line react/prop-types
export const TrendingProvider = ({ children }) => {
const [trendData, setTrendData] = useState();

  const getTrendData = async () => {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/search/trending`);
        const data = await response.json();
        console.log("treining",data)
        setTrendData(data.coins);
      } catch (error) {
        console.error(error);
      }
  };

  const resetTrendingResult = () => {
    getTrendData();
  };

  useLayoutEffect(() => {
    getTrendData();
  }, []);

return (
    <TrendingContext.Provider
      value={{
        trendData,
        resetTrendingResult,
    }}>
    {children}
    </TrendingContext.Provider>
  );
};
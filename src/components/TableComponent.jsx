import { useContext } from "react";
import { CryptoContext } from "../context/CryptoContext";
import Start from "../components/icons";
import Pagination from './Pagination';

function TableComponent() {
  let { cryptoData, currency } = useContext(CryptoContext);

  return (
    <div className="flex flex-col mt-9 border border-gray-100 rounded">
      {cryptoData ? (
        <table className="w-full table-auto">
          <thead className="capitalize text-base text-gray-100 font-medium border-b border-gray-100">
            <tr>
              <th className="py-1">Asset</th>
              <th className="py-1">Name</th>
              <th className="py-1">Price</th>
              <th className="py-1">Total Volumen</th>
              <th className="py-1">Market Cap Change</th>
              <th className="py-1">1H</th>
              <th className="py-1">24H</th>
              <th className="py-1">7D</th>
            </tr>
          </thead>
          <tbody>
            {cryptoData.map((data) => {
              return (
                <tr
                  className="text-center text-base border-b border-gray-100 hover:bg-gray-200 last:border-b-0"
                  key={data.id}
                >
                  <td className="py-4 flex items-center uppercase">
                    <button className="outline-0 border-0 bg-none cursor-pointer">
                      <Start className="ml-1.5 fill-gray-100 hover:fill-cyan" />
                    </button>
                    <img
                      src={data.image}
                      alt={data.name}
                      className="w-[1.2rem] h-[1.2rem] mx-1.5"
                    />
                    <span>{data.symbol}</span>
                  </td>
                  <td className="py-4">{data.name}</td>
                  <td className="py-4">{
                    new Intl.NumberFormat("en-In", {
                        style:'currency',
                        currency:currency
                    }).format(data.current_price)
                  }</td>
                  <td className="py-4">{data.total_volume}</td>

                  <td className={data.market_cap_change_percentage_24h > 0 ? "text-green py-4"
                        : "text-red py-4"}>
                    {Number(data.market_cap_change_percentage_24h).toFixed(2)}%
                  </td>

                  <td
                    className={data.price_change_percentage_1h_in_currency > 0 ? "text-green py-4"
                        : "text-red py-4"}>
                    {Number(data.price_change_percentage_1h_in_currency).toFixed(2)}%
                  </td>

                  <td className={data.price_change_percentage_24h_in_currency > 0 ? "text-green py-4"
                        : "text-red py-4"}>
                    {Number(data.price_change_percentage_24h_in_currency).toFixed(2)}%
                  </td>

                  <td className={data.price_change_percentage_7d_in_currency > 0 ? "text-green py-4"
                        : "text-red py-4"}>
                    {Number(data.price_change_percentage_7d_in_currency).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      <Pagination/>
    </div>
  );
}

export default TableComponent;

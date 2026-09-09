import { useContext, useState } from "react";
import searchIcon from "../assets/search-icon.svg";
import { CryptoContext } from "../context/CryptoContext";
import debounce from "lodash.debounce";

// eslint-disable-next-line react/prop-types
const SearchInput = ({ handleSearch }) => {
  const [searchText, setSearchText] = useState("");
  const { searchData, setCoinSearch, setSearchData } = useContext(CryptoContext);

  const handleInput = (e) => {
    e.preventDefault();
    let query = e.target.value;
    setSearchText(query);
    handleSearch(query);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchText);
  };

  const selectCoin = (coin) => {
    setCoinSearch(coin);
    setSearchText("");
    setSearchData();
  };

  return (
    <>
      <form
        className="lg:w-[25vw] w-[60vw] sm:w-[47vw] md:w-[78vw] sm:mt-1 lg:mt-1 mt-1 relative flex items-center lg:ml-7  font-nunito"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="search"
          onChange={handleInput}
          value={searchText}
          className="w-full rounded bg-surface-control placeholder:text-fg-muted
        pl-2 required outline-0 border border-transparent focus:border-accent"
          placeholder="search here..."
        />
        <button type="submit" className="absolute right-1 cursor-pointer">
          <img src={searchIcon} alt="search" className="w-full h-auto" />
        </button>
      </form>

      {searchText.length > 0 ? (
        <ul
          className="absolute top-11 right-0 w-96 h-96 rounded overflow-x-hidden py-2
        bg-surface-control/60 backdrop-blur-md scrollbar-thin scrollbar-thumb-fg-muted scrollbar-track-surface-control
        "
        >
          {searchData ? (
            searchData.map((coint) => {
              return (
                <li
                  key={coint.id}
                  className="flex items-center ml-4 my-2 cursor-pointer"
                  onClick={() => selectCoin(coint.id)}
                >
                  <img src={coint.thumb} alt={coint.name} className="w-[1rem] h-[1rem] mx-1.5" />
                  <span>{coint.name}</span>
                </li>
              );
            })
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <div
                className="w-8 h-8 border-4 border-accent rounded-full border-b-line animate-spin"
                role="status"
              />
              <span className="ml-2">Searching...</span>
            </div>
          )}
        </ul>
      ) : null}
    </>
  );
};

function Search() {
  const { getSearchResult } = useContext(CryptoContext);

  const debounceFunc = debounce((val) => {
    getSearchResult(val);
  }, 2000);

  return (
    <div className="relative">
      <SearchInput handleSearch={debounceFunc} />
    </div>
  );
}

export default Search;

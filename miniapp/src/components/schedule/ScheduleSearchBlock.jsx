import { AnimatePresence, motion } from "motion/react";
import {
  searchFormMotion,
  searchPillMotion,
  searchResultsMotion,
  searchSubmitTap,
} from "../../animations/ScheduleAnimations";

const ScheduleSearchBlock = ({
  selectedProfile,
  isEditingProfile,
  shouldExpandSearch,
  onEnterEditMode,
  searchInputRef,
  searchQuery,
  onChangeQuery,
  isSearchBusy,
  onSearch,
  searchError,
  searchResults,
  onSelectProfile,
  onFocusChange,
}) => (
  <div className="schedule-screen__search-block">
    <AnimatePresence mode="wait">
      {selectedProfile && !isEditingProfile ? (
        <motion.button
          key="schedule-search-pill"
          type="button"
          className="schedule-search-pill"
          onClick={onEnterEditMode}
          initial={searchPillMotion.initial}
          animate={searchPillMotion.animate}
          exit={searchPillMotion.exit}
          transition={searchPillMotion.transition}
          whileTap={searchPillMotion.whileTap}
        >
          <span>{selectedProfile.label}</span>
          <small>{selectedProfile.type}</small>
        </motion.button>
      ) : (
        <motion.div
          key="schedule-search-form"
          className={[
            "schedule-search__wrapper",
            shouldExpandSearch ? "schedule-search__wrapper--expanded" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          initial={searchFormMotion.initial}
          animate={searchFormMotion.animate}
          exit={searchFormMotion.exit}
          transition={searchFormMotion.transition}
        >
          <form className="schedule-search" onSubmit={onSearch}>
            <div className="schedule-search__field">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск расписания"
                value={searchQuery}
                onChange={(event) => onChangeQuery(event.target.value)}
                onFocus={() => onFocusChange(true)}
                onBlur={() => onFocusChange(false)}
              />
              {isSearchBusy && <span className="schedule-search__spinner" />}
            </div>
            <motion.button
              type="submit"
              className="schedule-search__submit"
              whileTap={searchSubmitTap}
              disabled={isSearchBusy}
              aria-label="Найти расписание"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="15.5"
                  y1="15.5"
                  x2="21"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
          </form>

          {searchError && (
            <p className="schedule-search__error">{searchError}</p>
          )}

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.ul
                className="schedule-search__results"
                initial={searchResultsMotion.initial}
                animate={searchResultsMotion.animate}
                exit={searchResultsMotion.exit}
                transition={searchResultsMotion.transition}
              >
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelectProfile(result)}
                    >
                      <span>{result.label}</span>
                      <small>{result.type}</small>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default ScheduleSearchBlock;

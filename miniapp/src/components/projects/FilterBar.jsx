import { VIEW_MODES } from "./utils";

const FilterBar = ({
  searchTerm,
  onSearchChange,
  tagOptions,
  activeTags,
  onToggleTag,
  viewMode,
  onViewModeChange,
}) => (
  <div className="projects-filter">
    <div className="projects-filter__search">
      <input
        type="search"
        placeholder="Поиск по названию"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
    <div className="projects-filter__view">
      <button
        type="button"
        className={`projects-filter__view-button${viewMode === VIEW_MODES.AVAILABLE ? " is-active" : ""}`}
        onClick={() => onViewModeChange(VIEW_MODES.AVAILABLE)}
      >
        Все доступные
      </button>
      <button
        type="button"
        className={`projects-filter__view-button${viewMode === VIEW_MODES.MINE ? " is-active" : ""}`}
        onClick={() => onViewModeChange(VIEW_MODES.MINE)}
      >
        Мои проекты
      </button>
    </div>
    {tagOptions.length > 0 && (
      <div className="projects-filter__tags">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`tag-chip${activeTags.includes(tag) ? " tag-chip--active" : ""}`}
            onClick={() => onToggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default FilterBar;

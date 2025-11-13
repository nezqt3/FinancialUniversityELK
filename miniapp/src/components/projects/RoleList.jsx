const RoleList = ({ roles = [] }) => (
  <div className="roles-list">
    {roles.map((role) => {
      const filled = Number(role.filledCount || 0);
      const required = Number(role.requiredCount || 0);
      const isFull = filled >= required && required > 0;
      return (
        <div
          key={role.id}
          className={`role-pill${isFull ? " role-pill--full" : ""}`}
        >
          <div>
            <p className="role-pill__name">{role.name}</p>
            <p className="role-pill__count">
              {filled}/{required || 0} занято
            </p>
          </div>
          {isFull && <span className="role-pill__status">Нет мест</span>}
        </div>
      );
    })}
    {roles.length === 0 && (
      <div className="role-pill role-pill--empty">Роли пока не добавлены</div>
    )}
  </div>
);

export default RoleList;

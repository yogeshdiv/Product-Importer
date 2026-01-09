import { NavLink } from "react-router-dom";

export const NavBar = () => {
  return (
    <nav className="topNav">
      <div className="navBrand">Product Importer</div>
      <div className="navLinks">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "navLink navLinkActive" : "navLink"
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/files"
          className={({ isActive }) =>
            isActive ? "navLink navLinkActive" : "navLink"
          }
        >
          Files
        </NavLink>
      </div>
    </nav>
  );
};



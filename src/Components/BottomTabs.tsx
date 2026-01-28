
import { Link, useLocation } from "react-router-dom";
import "./BottomTabs.css";

const tabs = [
  { path: "/", label: "Orders", icon: "📋" },
  { path: "/products", label: "Products", icon: "🥖" },
  { path: "/recipes", label: "Recipes", icon: "📝" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export function BottomTabs() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bottom-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`tab ${currentPath === tab.path ? "active" : ""}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
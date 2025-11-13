import { createRoot } from "react-dom/client";
// import { MaxUI } from "@maxhub/max-ui";
import "@maxhub/max-ui/dist/styles.css";
import App from "./App.jsx";
import { UniversityProvider } from "./context/UniversityContext.jsx";
import { AccountProvider } from "./context/AccountContext.jsx";

const Root = () => (
  // <MaxUI>
  <UniversityProvider>
    <AccountProvider>
      <App />
    </AccountProvider>
  </UniversityProvider>
  /* </MaxUI> */
);

createRoot(document.getElementById("root")).render(<Root />);

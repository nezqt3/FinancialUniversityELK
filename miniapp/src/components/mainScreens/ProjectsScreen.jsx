import { useAccount } from "../../context/AccountContext.jsx";
import ProjectActivityScreen from "../projects/ProjectActivityScreen.jsx";

const ProjectsScreen = () => {
  const { account } = useAccount();
  return <ProjectActivityScreen account={account} />;
};

export default ProjectsScreen;

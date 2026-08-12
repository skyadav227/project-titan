import { AuthProvider } from "./contexts/AuthContext";
import { ResumeProvider } from "./contexts/ResumeContext";
import AppRouter from "./routes/AppRouter";

function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <AppRouter />
      </ResumeProvider>
    </AuthProvider>
  );
}

export default App;
